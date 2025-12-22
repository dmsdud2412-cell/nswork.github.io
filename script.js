// 1. 지점장 명단 데이터
const managerList = [
    { branch: "대전동지점", name: "이승삼", required: 17, unused: 17 },
    { branch: "대전서지점", name: "김학형", required: 17, unused: 17 },
    { branch: "천안지점", name: "백운식", required: 17, unused: 17 },
    { branch: "청주지점", name: "윤남수", required: 17, unused: 17 },
    { branch: "평택지점", name: "류희복", required: 17, unused: 17 },
    { branch: "홍성지점", name: "한수하", required: 17, unused: 17 },
    { branch: "충청영업기획", name: "나병운", required: 17, unused: 17 }
];

// 2. 직원 명단 데이터 (50명 자동 생성)
const staffList = [];
for (let i = 1; i <= 50; i++) {
    staffList.push({ branch: `지점${Math.ceil(i/5)}`, name: `직원${i}`, required: 15, unused: 15 });
}

let currentType = 'manager';
const holidayDates = [1, 3, 4, 10, 11, 17, 18, 24, 25, 31]; // 휴일 날짜 고정

// 페이지 로드 시 실행
window.onload = function() {
    renderTable('manager');
};

// 탭 전환 함수
function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(type);
}

// 테이블 렌더링 함수
function renderTable(type) {
    const tbody = document.getElementById('attendance-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const data = (type === 'manager') ? managerList : staffList;
    const savedData = JSON.parse(localStorage.getItem(`attendance_202601_${type}`)) || {};

    data.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        
        let rowHtml = `<td>${person.branch}</td><td>${person.name}</td>
            <td class="num-cell" id="req-${person.name}">${person.required}</td>
            <td class="num-cell" id="un-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rem-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rate-${person.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            const status = savedData[person.name] ? (savedData[person.name][i] || '') : '';
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
        cell.onclick = function() {
            let currentIdx = statuses.indexOf(this.innerText);
            let nextIdx = (currentIdx + 1) % statuses.length;
            let status = statuses[nextIdx];
            
            this.innerText = status;
            
            const isWeekend = this.classList.contains('weekend') ? 'weekend ' : '';
            this.className = `at-cell ${isWeekend}${getStatusClass(status)}`;
            
            saveData();
            updateCounts();
        };
    });
}

function saveData() {
    const rows = document.querySelectorAll('#attendance-body tr');
    const storageData = {};
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        storageData[name] = {};
        row.querySelectorAll('.at-cell').forEach(cell => {
            storageData[name][cell.getAttribute('data-day')] = cell.innerText;
        });
    });
    localStorage.setItem(`attendance_202601_${currentType}`, JSON.stringify(storageData));
}

function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    
    // 1. 개인별 연차 사용 현황 업데이트 (수치 계산)
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const cells = row.querySelectorAll('.at-cell');
        let used = 0;
        cells.forEach(c => {
            const txt = c.innerText;
            if (txt === '연차' || txt === '휴가') used += 1;
            else if (txt.includes('반차') && txt !== '반반차') used += 0.5;
            else if (txt === '반반차') used += 0.25;
            // 출장은 연차 수치에서 제외
        });
        
        const reqVal = parseFloat(document.getElementById(`req-${name}`).innerText);
        const unVal = parseFloat(document.getElementById(`un-${name}`).innerText);
        const rem = unVal - used;
        const rate = reqVal > 0 ? ((reqVal - rem) / reqVal) * 100 : 0;
        
        document.getElementById(`rem-${name}`).innerText = rem % 1 === 0 ? rem : rem.toFixed(2);
        document.getElementById(`rate-${name}`).innerText = Math.floor(rate) + '%';
    });

    // 2. 하단 합계 업데이트 (머릿수 계산)
    const hFooter = document.querySelectorAll('#holiday-row td:not(.footer-label)');
    const wFooter = document.querySelectorAll('#work-row td:not(.footer-label)');
    
    for (let i = 0; i < 31; i++) {
        let personCount = 0; // 휴무 인원수 (머릿수)
        rows.forEach(row => {
            const cell = row.querySelectorAll('.at-cell')[i];
            const txt = cell ? cell.innerText : '';
            // 빈칸이 아니면(연차, 반차, 출장 등 무엇이라도 적혀있으면) 인원수 1명 추가
            if (txt !== '') {
                personCount += 1;
            }
        });
        
        if(hFooter[i]) hFooter[i].innerText = personCount || '0'; // 휴무 인원 (총 머릿수)
        if(wFooter[i]) wFooter[i].innerText = rows.length - personCount; // 근무 인원 (전체 - 휴무)
    }
}
