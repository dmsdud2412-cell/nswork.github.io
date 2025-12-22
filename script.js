const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec";

let currentType = 'manager';
let currentMonth = 1;
let masterData = { manager: [], staff: [] };
let lastFetchedAttendance = [];

window.onload = () => { renderMonthPicker(); loadAllData(); };

// 2026년 공휴일 명칭
function getHolidays(month) {
    const data = { 
        1: { 1: "신정" }, 
        2: { 16: "설날", 17: "설날", 18: "설날" }, 
        3: { 1: "삼일절", 2: "대체휴무" },
        5: { 5: "어린이날", 24: "석가탄신일" },
        10: { 3: "개천절", 5: "추석", 6: "추석", 7: "추석", 8: "대체휴무", 9: "한글날" },
        12: { 25: "성탄절" }
    };
    return data[month] || {};
}

function renderTable(attendance) {
    const dateRow = document.getElementById('row-dates');
    const weekRow = document.getElementById('row-weeks');
    const tbody = document.getElementById('attendance-body');
    const vRow = document.getElementById('row-vacation');
    const wRow = document.getElementById('row-working');

    dateRow.innerHTML = ''; weekRow.innerHTML = ''; tbody.innerHTML = '';
    while(vRow.cells.length > 1) vRow.deleteCell(1);
    while(wRow.cells.length > 1) wRow.deleteCell(1);

    const holidayInfo = getHolidays(currentMonth);
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, currentMonth - 1, d);
        const isExist = dateObj.getMonth() === currentMonth - 1;
        
        const thD = document.createElement('th');
        const thW = document.createElement('th');
        thD.className = 'col-day';
        thW.className = 'col-day';
        
        if (isExist) {
            const dayIdx = dateObj.getDay();
            const isRedDay = (dayIdx === 0 || dayIdx === 6 || holidayInfo[d]);
            
            // 1단: 숫자
            thD.innerText = d;
            // 2단: 요일 / 3단: 공휴일명 (수직 배치)
            thW.innerHTML = `${weekDays[dayIdx]}<br><span style="font-size:9px; font-weight:normal;">${holidayInfo[d] || ''}</span>`;
            
            if(isRedDay) {
                thD.classList.add('txt-red');
                thW.classList.add('txt-red');
            }
        }
        dateRow.appendChild(thD);
        weekRow.appendChild(thW);
        
        // 하단 인원 행 칸 생성 (음영 없음)
        vRow.insertCell(-1).innerText = '0';
        wRow.insertCell(-1).innerText = '0';
    }

    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    list.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.branch}</td><td>${p.name}</td><td>${p.req}</td><td>${p.unused}</td><td>${p.unused}</td><td>0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            const dateObj = new Date(2026, currentMonth - 1, i);
            const isExist = dateObj.getMonth() === currentMonth - 1;
            const td = document.createElement('td');
            td.className = 'at-cell col-day';

            if (isExist) {
                const dayIdx = dateObj.getDay();
                if (dayIdx === 0 || dayIdx === 6 || holidayInfo[i]) td.classList.add('bg-pink');
                const match = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == i);
                if(match) {
                    td.innerText = match[4];
                    if(match[4] === '연차') td.classList.add('status-연차');
                }
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

// 월 버튼 및 기타 함수
function renderMonthPicker() {
    const container = document.getElementById('month-picker');
    container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = m + '월';
        btn.className = `month-btn ${m === currentMonth ? 'active' : ''}`;
        btn.style.cssText = "padding:5px 10px; cursor:pointer; border:1px solid #ddd; background:white; border-radius:4px; font-size:12px;";
        if(m === currentMonth) { btn.style.background = "#d32f2f"; btn.style.color = "white"; }
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
function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}
