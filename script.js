// 1. 구글 시트 연결 주소 (사용자님의 전용 URL)
const GAN_URL = "https://script.google.com/macros/s/AKfycbxgCUVZjK71YWfdtc30OcZF54Q6pLeo0Bg4FRr_6W69qVxFempPqaqJ-uNoNNnGrhB9/exec";

// 2. 명단 데이터 (기존과 동일)
const managerList = [
    { branch: "대전동지점", name: "이승삼", required: 17, unused: 17 },
    { branch: "대전서지점", name: "김학형", required: 17, unused: 17 },
    { branch: "천안지점", name: "백운식", required: 17, unused: 17 },
    { branch: "청주지점", name: "윤남수", required: 17, unused: 17 },
    { branch: "평택지점", name: "류희복", required: 17, unused: 17 },
    { branch: "홍성지점", name: "한수하", required: 17, unused: 17 },
    { branch: "충청영업기획", name: "나병운", required: 17, unused: 17 }
];

const staffList = [];
for (let i = 1; i <= 50; i++) {
    staffList.push({ branch: `지점${Math.ceil(i/5)}`, name: `직원${i}`, required: 15, unused: 15 });
}

let currentType = 'manager';
const holidayDates = [1, 3, 4, 10, 11, 17, 18, 24, 25, 31];

// 페이지 로드 시 구글 시트에서 데이터를 먼저 가져옵니다.
window.onload = function() {
    loadDataFromServer(); 
};

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    loadDataFromServer(); // 탭 바꿀 때도 서버에서 최신 데이터 로드
}

// [중요] 구글 시트에서 데이터를 읽어오는 함수
async function loadDataFromServer() {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '<tr><td colspan="37">데이터를 불러오는 중입니다...</td></tr>';
    
    try {
        const response = await fetch(GAN_URL);
        const serverData = await response.json();
        renderTable(currentType, serverData);
    } catch (error) {
        console.error("로딩 실패:", error);
        renderTable(currentType, []); // 실패 시 빈 테이블이라도 띄움
    }
}

function renderTable(type, serverData) {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '';
    
    const dataList = (type === 'manager') ? managerList : staffList;

    dataList.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        
        let rowHtml = `<td>${person.branch}</td><td>${person.name}</td>
            <td class="num-cell" id="req-${person.name}">${person.required}</td>
            <td class="num-cell" id="un-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rem-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rate-${person.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            // 서버 데이터에서 해당 사람의 해당 날짜 값을 찾음
            let status = "";
            const match = serverData.find(row => row[0] === type && row[1] === person.name && row[2] == i);
            if(match) status = match[3];

            const statusClass = getStatusClass(status);
            const holidayClass = holidayDates.includes(i) ? 'weekend' : '';
            rowHtml += `<td class="at-cell ${holidayClass} ${statusClass}" data-day="${i}">${status}</td>`;
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    
    attachCellEvents();
    updateCounts();
}

function getStatusClass(status) {
    if (status === '휴가' || status === '연차') return 'status-연차';
    if (status.includes('반차') && status !== '반반차') return 'status-반차';
    if (status === '반반차') return 'status-반반차';
    return '';
}

function attachCellEvents() {
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];
    
    cells.forEach(cell => {
        cell.onclick = async function() {
            let currentIdx = statuses.indexOf(this.innerText);
            let nextIdx = (currentIdx + 1) % statuses.length;
            let status = statuses[nextIdx];
            
            const oldText = this.innerText;
            this.innerText = status; // 화면 먼저 변경 (빠른 반응)
            
            const day = this.getAttribute('data-day');
            const name = this.parentElement.getAttribute('data-person');

            // 구글 시트로 데이터 전송
            try {
                await fetch(GAN_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        type: currentType,
                        name: name,
                        day: day,
                        status: status
                    })
                });
                const isWeekend = this.classList.contains('weekend') ? 'weekend ' : '';
                this.className = `at-cell ${isWeekend}${getStatusClass(status)}`;
                updateCounts();
            } catch (e) {
                alert("저장에 실패했습니다. 인터넷 연결을 확인하세요.");
                this.innerText = oldText; // 실패 시 복구
            }
        };
    });
}

// 나머지 수치 계산 로직은 기존과 동일 (생략 없이 유지)
function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const cells = row.querySelectorAll('.at-cell');
        let used = 0;
        cells.forEach(c => {
            const txt = c.innerText;
            if (txt === '연차' || txt === '휴가') used += 1;
            else if (txt.includes('반차') && txt !== '반반차') used += 0.5;
            else if (txt === '반반차') used += 0.25;
        });
        
        const reqEl = document.getElementById(`req-${name}`);
        const unEl = document.getElementById(`un-${name}`);
        if(reqEl && unEl) {
            const reqVal = parseFloat(reqEl.innerText);
            const unVal = parseFloat(unEl.innerText);
            const rem = unVal - used;
            const rate = reqVal > 0 ? ((reqVal - rem) / reqVal) * 100 : 0;
            document.getElementById(`rem-${name}`).innerText = rem % 1 === 0 ? rem : rem.toFixed(2);
            document.getElementById(`rate-${name}`).innerText = Math.floor(rate) + '%';
        }
    });

    const hFooter = document.querySelectorAll('#holiday-row td:not(.footer-label)');
    const wFooter = document.querySelectorAll('#work-row td:not(.footer-label)');
    for (let i = 0; i < 31; i++) {
        let personCount = 0;
        rows.forEach(row => {
            const cell = row.querySelectorAll('.at-cell')[i];
            if (cell && cell.innerText !== '') personCount += 1;
        });
        if(hFooter[i]) hFooter[i].innerText = personCount || '0';
        if(wFooter[i]) wFooter[i].innerText = rows.length - personCount;
    }
}
