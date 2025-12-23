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

    tbody.innerHTML = ''; dateRow.innerHTML = ''; weekRow.innerHTML = ''; holidayRow.innerHTML = '';
    while(vRow.cells.length > 1) vRow.deleteCell(1);
    while(wRow.cells.length > 1) wRow.deleteCell(1);

    const holidayInfo = { 1: { 1: "신정" }, 2: { 16: "설날", 17: "설날", 18: "설날" }, 3: { 1: "삼일절" }, 5: { 5: "어린이날", 24: "석가탄신일" }, 6: { 6: "현충일" }, 8: { 15: "광복절" }, 10: { 3: "개천절", 9: "한글날" }, 12: { 25: "성탄절" } }[currentMonth] || {};
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 1. 날짜, 요일, 휴일 행 생성
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

    // 2. 비고 헤더 통합 (4행 높이)
    // '1월 근태 현황' 타이틀이 적힌 <thead>의 첫 번째 줄(rowSpan=4 설정된 칸들과 같은 줄)에 붙여야 합니다.
    const noteTh = document.createElement('th');
    noteTh.innerText = "비고";
    noteTh.className = 'col-note';
    noteTh.rowSpan = 4;
    // 현재 구조상 dateRow가 최상단 데이터 행이므로 여기에 추가
    dateRow.appendChild(noteTh);

    // 3. 하단 푸터 빈 칸 추가
    vRow.insertCell(-1).className = 'col-note';
    wRow.insertCell(-1).className = 'col-note';

    // 4. 본문 데이터
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

// ... 나머지 함수들 (applyStatusColor, showDropdown, saveData, updateCounts, renderMonthPicker, switchTab)은 기존과 동일하므로 유지하세요.
// (공간상 생략하지만 기존 코드를 그대로 뒤에 붙이시면 됩니다.)
