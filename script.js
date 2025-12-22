const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec";

let currentType = 'manager';
let currentMonth = 1;
let masterData = { manager: [], staff: [] };
let lastFetchedAttendance = [];

window.onload = () => {
    renderMonthPicker();
    loadAllData();
};

// 2026년 공휴일 정보
function getHolidays(month) {
    const data = { 1: { 1: "신정" }, 2: { 16: "설날", 17: "설날", 18: "설날" }, 3: { 1: "삼일절", 2: "대체휴무" } /* 필요시 추가 */ };
    return data[month] || {};
}

function renderMonthPicker() {
    const container = document.getElementById('month-picker');
    container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = m + '월';
        btn.className = `month-btn ${m === currentMonth ? 'active' : ''}`;
        btn.onclick = () => { currentMonth = m; renderMonthPicker(); renderTable(lastFetchedAttendance); };
        container.appendChild(btn);
    }
}

async function loadAllData() {
    try {
        const res = await (await fetch(GAN_URL)).json();
        masterData.manager = []; masterData.staff = [];
        res.config.slice(1).forEach(row => {
            const p = { branch: row[1], name: row[2], req: row[3], unused: row[4] };
            if (row[0] === 'manager') masterData.manager.push(p);
            else masterData.staff.push(p);
        });
        lastFetchedAttendance = res.attendance;
        renderTable(lastFetchedAttendance);
    } catch (e) { console.error("로드 실패"); }
}

function renderTable(attendance) {
    const dateRow = document.getElementById('row-dates');
    const weekRow = document.getElementById('row-weeks');
    const tbody = document.getElementById('attendance-body');
    const vRow = document.getElementById('row-vacation');
    const wRow = document.getElementById('row-working');

    dateRow.innerHTML = ''; weekRow.innerHTML = ''; tbody.innerHTML = '';
    // 하단 인원 행 초기화 (라벨 제외)
    while(vRow.cells.length > 1) vRow.deleteCell(1);
    while(wRow.cells.length > 1) wRow.deleteCell(1);

    document.getElementById('month-title').innerText = `${currentMonth}월 근태 현황`;
    
    const holidayInfo = getHolidays(currentMonth);
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, currentMonth - 1, d);
        if (dateObj.getMonth() !== currentMonth - 1) break; // 해당 월의 마지막 날까지만 표시

        const dayIdx = dateObj.getDay(); // 0:일, 6:토
        const isRedDay = (dayIdx === 0 || dayIdx === 6 || holidayInfo[d]);

        // 1. 날짜 행 (숫자)
        const thD = document.createElement('th');
        thD.innerText = d;
        if(isRedDay) thD.className = 'txt-red';
        dateRow.appendChild(thD);

        // 2. 요일/신정 행
        const thW = document.createElement('th');
        thW.innerText = holidayInfo[d] || weekDays[dayIdx];
        if(isRedDay) thW.className = 'txt-red';
        weekRow.appendChild(thW);

        // 3. 하단 합계 행 (음영 없음)
        vRow.insertCell(-1).innerText = '0';
        wRow.insertCell(-1).innerText = '0';
    }

    // 명단 렌더링
    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    list.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.branch}</td><td>${p.name}</td><td>${p.req}</td><td>${p.unused}</td><td>${p.unused}</td><td>0%</td>`;
        
        for (let i = 1; i <= dateRow.cells.length; i++) {
            const dateObj = new Date(2026, currentMonth - 1, i);
            const dayIdx = dateObj.getDay();
            const isRedDay = (dayIdx === 0 || dayIdx === 6 || holidayInfo[i]);
            
            const td = document.createElement('td');
            td.className = `at-cell ${isRedDay ? 'bg-pink' : ''}`; // 주말/공휴일만 분홍 배경
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}
