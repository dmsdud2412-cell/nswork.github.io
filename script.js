const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec";

let currentType = 'manager';
let currentMonth = 1;
let masterData = { manager: [], staff: [] };
let lastFetchedAttendance = [];

window.onload = () => { renderMonthPicker(); loadAllData(); };

function getHolidays(month) {
    const data = { 
        1: { 1: "신정" }, 
        2: { 16: "설날", 17: "설날", 18: "설날" }, 
        3: { 1: "삼일절", 2: "대체공휴일" }, 
        5: { 5: "어린이날", 24: "석가탄신일", 25: "대체공휴일" },
        6: { 6: "현충일" },
        8: { 15: "광복절", 17: "대체공휴일" },
        9: { 24: "추석", 25: "추석", 26: "추석", 28: "대체공휴일" }, 
        10: { 3: "개천절", 5: "대체공휴일", 9: "한글날" },
        12: { 25: "성탄절" }
    };
    return data[month] || {};
}

async function loadAllData() {
    try {
        const response = await fetch(GAN_URL);
        const res = await response.json();
        masterData.manager = []; masterData.staff = [];
        if(res.config) {
            res.config.slice(1).forEach(row => {
                const p = { branch: row[1] || "", name: row[2] || "", req: row[3] || 0, unused: row[4] || 0 };
                if (row[0] === 'manager') masterData.manager.push(p);
                else masterData.staff.push(p);
            });
        }
        lastFetchedAttendance = res.attendance || [];
        renderTable(lastFetchedAttendance);
    } catch (e) { console.error("데이터 로드 실패"); }
}

function renderTable(attendance) {
    const dateRow = document.getElementById('row-dates');
    const weekRow = document.getElementById('row-weeks');
    const holidayRow = document.getElementById('row-holidays');
    const tbody = document.getElementById('attendance-body');
    const vRow = document.getElementById('row-vacation');
    const wRow = document.getElementById('row-working');

    dateRow.innerHTML = ''; weekRow.innerHTML = ''; holidayRow.innerHTML = ''; tbody.innerHTML = '';
    while(vRow.cells.length > 1) vRow.deleteCell(1);
    while(wRow.cells.length > 1) wRow.deleteCell(1);

    const holidayInfo = getHolidays(currentMonth);
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, currentMonth - 1, d);
        const isExist = dateObj.getMonth() === currentMonth - 1;
        
        const thD = document.createElement('th');
        const thW = document.createElement('th');
        const thH = document.createElement('th');
        [thD, thW, thH].forEach(el => el.className = 'col-day');
        
        if (isExist) {
            const dayIdx = dateObj.getDay();
            const hName = holidayInfo[d] || "";
            const isRedDay = (dayIdx === 0 || dayIdx === 6 || hName !== "");
            thD.innerText = d; 
            thW.innerText = weekDays[dayIdx];
            thH.innerText = hName;
            if(isRedDay) { [thD, thW, thH].forEach(el => el.classList.add('txt-red')); }
        }
        dateRow.appendChild(thD);
        weekRow.appendChild(thW);
        holidayRow.appendChild(thH);
        
        // 하단 인원 셀 (ID 부여하여 나중에 계산 결과 주입)
        vRow.insertCell(-1).id = `vac-count-${d}`;
        wRow.insertCell(-1).id = `work-count-${d}`;
    }

    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    list.forEach(p => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', p.name);
        tr.innerHTML = `<td>${p.branch}</td><td>${p.name}</td><td>${p.req}</td><td>${p.unused}</td><td id="rem-${p.name}">${p.unused}</td><td id="rate-${p.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            const dateObj = new Date(2026, currentMonth - 1, i);
            const isExist = dateObj.getMonth() === currentMonth - 1;
            const td = document.createElement('td');
            td.className = 'at-cell col-day';

            if (isExist) {
                const dayIdx = dateObj.getDay();
                if (dayIdx === 0 || dayIdx === 6 || holidayInfo[i]) td.classList.add('bg-pink');
                const match = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == i);
                const status = (match && match[4]) ? match[4] : "";
                td.innerText = status;
                if(status) applyStatusColor(td, status);
                
                td.setAttribute('data-day', i);
                td.onclick = function() { showDropdown(this); };
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
    updateCounts();
}

function applyStatusColor(cell, status) {
    cell.classList.remove('status-연차');
    cell.style.color = ""; cell.style.fontWeight = "";
    if(status === '연차') { cell.classList.add('status-연차'); cell.style.color = "#1976d2"; cell.style.fontWeight = "bold"; }
    else if(status.includes('반차')) { cell.style.color = "#ef6c00"; cell.style.fontWeight = "bold"; }
    else if(status === '반반차') { cell.style.color = "#4caf50"; cell.style.fontWeight = "bold"; }
    else if(status === '출장' || status === '휴가') { cell.style.color = "#9c27b0"; cell.style.fontWeight = "bold"; }
}

function showDropdown(cell) {
    if (cell.querySelector('select')) return;
    const currentStatus = cell.innerText;
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'];
    const select = document.createElement('select');
    select.style.cssText = "width:100%; height:100%; border:none; background:transparent; font-size:11px; text-align:center; outline:none;";
    
    statuses.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s; opt.innerText = s === '' ? '-' : s;
        if(s === currentStatus) opt.selected = true;
        select.appendChild(opt);
    });

    cell.innerText = ''; cell.appendChild(select);
    select.focus();
    select.onchange = async function() {
        const newStatus = this.value;
        const day = cell.getAttribute('data-day');
        const name = cell.parentElement.getAttribute('data-person');
        cell.innerText = newStatus;
        applyStatusColor(cell, newStatus);
        updateCounts(); 
        await fetch(GAN_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ month: currentMonth, type: currentType, name: name, day: day, status: newStatus }) });
    };
    select.onblur = function() { if (cell.contains(this)) cell.innerText = this.value; };
}

function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    const totalPeople = rows.length;
    const dailyVacation = Array(32).fill(0);

    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const cells = row.querySelectorAll('.at-cell');
        let usedForPerson = 0;
        
        cells.forEach(c => {
            const txt = c.innerText;
            const day = parseInt(c.getAttribute('data-day'));
            // 수식 반영: 연차 1, 반차 0.5, 반반차 0.25
            if (txt === '연차') { usedForPerson += 1; dailyVacation[day] += 1; }
            else if (txt.includes('반차')) { usedForPerson += 0.5; dailyVacation[day] += 0.5; }
            else if (txt === '반반차') { usedForPerson += 0.25; dailyVacation[day] += 0.25; }
            else if (txt === '휴가') { dailyVacation[day] += 1; }
        });
        
        const unused = parseFloat(row.cells[3].innerText) || 0;
        const rem = unused - usedForPerson;
        const remEl = document.getElementById(`rem-${name}`);
        if(remEl) remEl.innerText = rem.toFixed(2).replace(/\.00$/, '');
        
        const req = parseFloat(row.cells[2].innerText) || 0;
        const rate = req > 0 ? ((req - rem) / req * 100) : 0;
        const rateEl = document.getElementById(`rate-${name}`);
        if(rateEl) rateEl.innerText = Math.floor(rate) + '%';
    });

    // 하단 휴가/근무 인원 수치 주입
    for (let d = 1; d <= 31; d++) {
        const vacCell = document.getElementById(`vac-count-${d}`);
        const workCell = document.getElementById(`work-count-${d}`);
        if (vacCell && workCell) {
            const vacNum = dailyVacation[d];
            vacCell.innerText = vacNum > 0 ? vacNum : '0';
            workCell.innerText = totalPeople - Math.ceil(vacNum); // 근무인원은 휴가자(반차포함 올림) 제외 계산
        }
    }
}

function renderMonthPicker() {
    const container = document.getElementById('month-picker');
    container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = m + '월';
        btn.className = `month-btn ${m === currentMonth ? 'active' : ''}`;
        if(m === currentMonth) { btn.style.background = "#d32f2f"; btn.style.color = "white"; }
        btn.onclick = () => { currentMonth = m; renderMonthPicker(); renderTable(lastFetchedAttendance); };
        container.appendChild(btn);
    }
}

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}
