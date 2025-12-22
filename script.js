// 1. 새로 발급받은 구글 시트 연결 주소
const GAN_URL = "https://script.google.com/macros/s/AKfycbxzW9z5RlDSmrYzMAH_2OCmorPWFbW4FposdvNNfaTOSsuzvamK5ANZIZL3-S43roYh/exec";

// 2. 명단 데이터
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

// 페이지 로드 시 실행
window.onload = function() {
    loadDataFromServer(); 
};

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    loadDataFromServer();
}

// 서버에서 데이터 불러오기
async function loadDataFromServer() {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '<tr><td colspan="37" style="text-align:center;">데이터를 불러오는 중입니다...</td></tr>';
    
    try {
        const response = await fetch(GAN_URL);
        const serverData = await response.json();
        renderTable(currentType, serverData);
    } catch (error) {
        console.error("데이터 로드 실패:", error);
        renderTable(currentType, []);
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
            let status = "";
            // 서버 데이터 형식 [type, name, day, status] 에 맞춰 찾기
            const match = serverData.find(row => row[0] === type && row[1] === person.name && String(row[2]) === String(i));
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
            this.innerText = status; 
            
            const day = this.getAttribute('data-day');
            const name = this.parentElement.getAttribute('data-person');

            try {
                // 클릭 즉시 서버로 전송
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
                alert("연결이 불안정합니다. 다시 시도해 주세요.");
                this.innerText = oldText;
            }
        };
    });
}

function updateCounts() {
    const rows = document.querySelectorAll
