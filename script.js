// 1. 구글 시트 연결 주소
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

window.onload = function() {
    loadDataFromServer(); 
};

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    loadDataFromServer();
}

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
            const match = serverData.find(row => row[0] === type && row[1] === person.name && String(row[2]) === String(i));
            if(match) status = match[3];

            const statusClass = getStatusClass(status);
            const holidayClass = holidayDates.includes(i) ? 'weekend' : '';
            // 드롭다운 적용을 위해 클릭 이벤트를 셀에 직접 연결
            rowHtml += `<td class="at-cell ${holidayClass} ${statusClass}" data-day="${i}" onclick="showDropdown(this)">${status}</td>`;
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    
    updateCounts();
}

// --- 드롭다운 핵심 로직 시작 ---
function showDropdown(cell) {
    // 이미 드롭다운이 열려있으면 중복 생성 방지
    if (cell.querySelector('select')) return;

    const currentStatus = cell.innerText;
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];
    
    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.height = '100%';
    select.style.fontSize = '11px';
    select.style.border = 'none';
    select.style.appearance = 'none'; // 기본 화살표 숨김(디자인 깔끔하게)
    select.style.textAlign = 'center';

    statuses.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s === '' ? ' (선택안함) ' : s;
        if(s === currentStatus) opt.selected = true;
        select.appendChild(opt);
    });

    cell.innerText = '';
    cell.appendChild(select);
    select.focus();

    // 선택이 변경되었을 때 저장 로직 실행
    select.onchange = async function() {
        const newStatus = this.value;
        const day = cell.getAttribute('data-day');
        const name = cell.parentElement.getAttribute('data-person');

        cell.innerText = newStatus; // 화면 즉시 변경
        const isWeekend = cell.classList.contains('weekend') ? 'weekend ' : '';
        cell.className = `at-cell ${isWeekend}${getStatusClass(newStatus)}`;

        try {
            await fetch(GAN_URL, {
                method: "POST",
                body: JSON.stringify({
                    type: currentType,
                    name: name,
                    day: day,
