const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec";
let currentType = 'manager'; let currentMonth = 1; let masterData = { manager: [], staff: [] }; let lastFetchedAttendance = [];

window.onload = () => { renderMonthPicker(); loadAllData(); };

async function loadAllData() {
    try {
        const response = await fetch(GAN_URL);
        const res = await response.json();
        masterData.manager = []; masterData.staff = [];
        if(res.config) {
            const targetCol = 4 + (currentMonth - 1); 
            res.config.slice(1).forEach(row => {
                const p = { branch: row[1], name: row[2], req: row[3], unused: row[targetCol] || 0 };
                if (row[0] === 'manager') masterData.manager.push(p);
                else masterData.staff.push(p);
            });
        }
        lastFetchedAttendance = res.attendance || [];
        renderTable(lastFetchedAttendance);
    } catch (e) { console.error("로드 실패"); }
}

function renderTable(attendance) {
    document.getElementById('month-title').innerText = `${currentMonth}월 근태 현황`;
    const tbody = document.getElementById('attendance-body');
    const dateRow = document.getElementById('row-dates');
    const weekRow = document.getElementById('row-weeks');
    const holidayRow = document.getElementById('row-holidays');
    const vRow = document.getElementById('row-vacation');
    const wRow = document.getElementById('row-working');

    // 초기화
    tbody.innerHTML = ''; dateRow.innerHTML = ''; weekRow.innerHTML = ''; holidayRow.innerHTML = '';
    while(vRow.cells.length > 1) vRow.deleteCell(1);
    while(wRow.cells.length > 1) wRow.deleteCell(1);

    const holidayInfo = { 1: { 1: "신정" }, 2: { 16: "설날", 17: "설날", 18: "설날" }, 3: { 1: "삼일절" }, 5: { 5: "어린이날", 24: "석가탄신일" }, 6: { 6: "현충일" }, 8: { 15: "광복절" }, 10: { 3: "개천절", 9: "한글날" }, 12: { 25: "성탄절" } }[currentMonth] || {};
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 1. 1~31일까지 칸 만들기 (헤더 3줄 + 푸터 2줄 동시에)
    for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, currentMonth - 1, d);
        const isExist = dateObj.getMonth() === currentMonth - 1;
        
        const thD = document.createElement('th'); thD.className = 'col-day';
        const thW = document.createElement('th'); thW.className = 'col-day';
        const thH = document.createElement('th'); thH.className = 'col-day';

        if (isExist) {
            const dayIdx = dateObj.getDay();
            const hName = holidayInfo[d] || "";
            thD.innerText = d; thW.innerText = weekDays[dayIdx]; thH.innerText = hName;
            if(dayIdx === 0 || dayIdx === 6 || hName !== "") [thD, thW, thH].forEach(el => el.classList.add('txt-red'));
        }
        dateRow.appendChild(thD);
        weekRow.appendChild(thW);
        holidayRow.appendChild(thH);
        
        vRow.insertCell(-1).id = `vac-count-${d}`;
        wRow.insertCell(-1).id = `work-count-${d}`;
    }

    // 2. 비고 헤더 통합 (rowSpan=4는 첫 번째 행에만 추가)
    const noteTh = document.createElement('th');
    noteTh.innerText = "비고";
    noteTh.className = 'col-note';
    noteTh.rowSpan = 4; 
    // HTML 구조상 '1월 근태 현황' 타이틀이 있는 곳과 같은 레벨인 dateRow에 추가해야 합니다.
    // 하지만 현재 HTML은 dateRow가 1,2,3...숫자 행이므로 여기에 추가하면 이미지처럼 날짜 끝에 붙습니다.
    dateRow.appendChild(noteTh);

    // 3. 하단 푸터 비고 칸 추가 (라인 맞춤)
    vRow.insertCell(-1).className = 'col-note';
    wRow.insertCell(-1).className = 'col-note';

    // 4. 본문 데이터 생성
    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    list.forEach(p => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', p.name);
        tr.innerHTML = `<td>${p.branch}</td><td>${p.name}</td><td>${p.req}</td><td>${p.unused}</td><td id="rem-${p.name}">${p.unused}</td><td id="rate-${p.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            const dateObj = new Date(2026, currentMonth - 1, i);
            const isExist = dateObj.getMonth() === currentMonth - 1;
            const td = document.createElement('td'); td.className = 'at-cell col-day';
            if (isExist) {
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidayInfo[i]) td.classList.add('bg-pink');
                const match = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == i);
                td.innerText = match ? match[4] : "";
                if(td.innerText) applyStatusColor(td, td.innerText);
                td.setAttribute('data-day', i);
                td.onclick = function() { showDropdown(this, i, p.name); };
            }
            tr.appendChild(td);
        }
        const noteTd = document.createElement('td');
        const noteMatch = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == 32);
        noteTd.className = 'col-note';
        noteTd.innerHTML = `<input type="text" value="${noteMatch ? noteMatch[4] : ""}" placeholder="비고 입력" onchange="saveData(${currentMonth}, '${currentType}', '${p.name}', 32, this.value)">`;
        tr.appendChild(noteTd);
        tbody.appendChild(tr);
    });
    updateCounts();
}

function applyStatusColor(cell, status) {
    cell.style.color = ""; cell.style.fontWeight = "bold";
    if(status === '연차' || status === '휴가') cell.style.color = "#d32f2f";
    else if(status.includes('반차')) cell.style.color = "#ef6c00";
    else if(status === '반반차') cell.style.color = "#4caf50";
}

function showDropdown(cell, day, name) {
    if (cell.querySelector('select')) return;
    const select = document.createElement('select');
    ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'].forEach(s => {
        const opt = document.createElement('option'); opt.value = s; opt.innerText = s || '-';
        if(s === cell.innerText) opt.selected = true;
        select.appendChild(opt);
    });
    select.onchange = function() {
        cell.innerText = this.value; applyStatusColor(cell, this.value);
        saveData(currentMonth, currentType, name, day, this.value); updateCounts();
    };
    select.onblur = function() { cell.innerText = this.value; applyStatusColor(cell, this.value); };
    cell.innerHTML = ''; cell.appendChild(select); select.focus();
}

async function saveData(m, t, n, d, s) {
    fetch(GAN_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ month: m, type: t, name: n, day: d, status: s }) });
}

function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    const dailyVacation = Array(33).fill(0);
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        let used = 0;
        row.querySelectorAll('.at-cell').forEach(c => {
            const txt = c.innerText; if(!txt) return;
            if (txt === '연차') used += 1; else if (txt === '반반차') used += 0.25; else if (txt.includes('반차')) used += 0.5;
            dailyVacation[parseInt(c.getAttribute('data-day'))] += 1;
        });
        const base = parseFloat(row.cells[3].innerText) || 0;
        const rem = base - used;
        const remCell = document.getElementById(`rem-${name}`);
        if(remCell) remCell.innerText = Number.isInteger(rem) ? rem : rem.toFixed(2);
        const req = parseFloat(row.cells[2].innerText) || 0;
        const rateCell = document.getElementById(`rate-${name}`);
        if(rateCell) rateCell.innerText = req > 0 ? Math.floor((req - rem) / req * 100) + '%' : '0%';
    });
    for (let d = 1; d <= 31; d++) {
        const v = document.getElementById(`vac-count-${d}`); const w = document.getElementById(`work-count-${d}`);
        if (v && w) { v.innerText = dailyVacation[d]; w.innerText = rows.length - dailyVacation[d]; }
    }
}

function renderMonthPicker() {
    const container = document.getElementById('month-picker'); container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button'); btn.innerText = m + '월';
        btn.className =
