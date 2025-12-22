const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec";

let currentType = 'manager';
let currentMonth = 1;
let masterData = { manager: [], staff: [] };
let lastFetchedAttendance = [];

window.onload = () => { renderMonthPicker(); loadAllData(); };

// 2026년 공휴일 데이터
function getHolidays(month) {
    const data = { 
        1: { 1: "신정" }, 2: { 16: "설날", 17: "설날", 18: "설날" }, 3: { 1: "삼일절" },
        5: { 5: "어린이날", 24: "석가탄신일" }, 6: { 6: "현충일" }, 8: { 15: "광복절" },
        10: { 3: "개천절", 5: "추석", 6: "추석", 7: "추석", 8: "대체휴무", 9: "한글날" }, 12: { 25: "성탄절" }
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

    // 초기화
    dateRow.innerHTML = ''; weekRow.innerHTML = ''; holidayRow.innerHTML = ''; tbody.innerHTML = '';
    while(vRow.cells.length > 1) vRow.deleteCell(1);
    while(wRow.cells.length > 1) wRow.deleteCell(1);

    const holidayInfo = getHolidays(currentMonth);
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 1~31일 헤더 생성 (숫자, 요일, 공휴일명 3행 분리)
    for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, currentMonth - 1, d);
        const isExist = dateObj.getMonth() === currentMonth - 1;
        
        const thD = document.createElement('th');
        const thW = document.createElement('th');
        const thH = document.createElement('th');
        [thD, thW, thH].forEach(el => el.className = 'col-day');
        
        if (isExist) {
            const dayIdx = dateObj.getDay();
            const holidayName = holidayInfo[d] || "";
            const isRedDay = (dayIdx === 0 || dayIdx === 6 || holidayName !== "");
            
            thD.innerText = d; 
            thW.innerText = weekDays[dayIdx];
            thH.innerText = holidayName;
            
            if(isRedDay) { [thD, thW, thH].forEach(el => el.classList.add('txt-red')); }
        }
        dateRow.appendChild(thD);
        weekRow.appendChild(thW);
        holidayRow.appendChild(thH);
        
        // 하단 인원 행 생성 (음영 제거됨)
        vRow.insertCell(-1).innerText = '0';
        wRow.insertCell(-1).innerText = '0';
    }

    // 데이터 행 생성
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
                td.innerText = (match && match[4]) ? match[4] : "";
                if(td.innerText === '연차') td.classList.add('status-연차');
                
                td.setAttribute('data-day', i);
                // 클릭 시 드롭다운 이벤트 직접 할당 (먹통 해결 핵심)
                td.onclick = function() { showDropdown(this); };
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
    updateCounts();
}

function showDropdown(cell) {
    if (cell.querySelector('select')) return; // 이미 열려있으면 중복 실행 방지
    const currentStatus = cell.innerText;
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'];
    const select = document.createElement('select');
    
    // 스타일을 인라인으로 강제 적용하여 UI 보존
    select.style.cssText = "width:100%; height:100%; border:none; background:transparent; font-size:11px; text-align:center; outline:none; cursor:pointer;";
    
    statuses.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s; opt.innerText = s === '' ? '-' : s;
        if(s === currentStatus) opt.selected = true;
        select.appendChild(opt);
    });

    cell.innerText = '';
    cell.appendChild(select);
    select.focus();

    // 값 변경 시 즉시 반영 및 서버 전송
    select.onchange = async function() {
        const newStatus = this.value;
        const day = cell.getAttribute('data-day');
        const name = cell.parentElement.getAttribute('data-person');
        cell.innerText = newStatus;
        cell.classList.toggle('status-연차', newStatus === '연차');
        updateCounts(); 
        try {
            await fetch(GAN_URL, { 
                method: "POST", 
                body: JSON.stringify({ month: currentMonth, type: currentType, name: name, day: day, status: newStatus }) 
            });
        } catch(e) { console.error("업데이트 실패"); }
    };

    // 포커스 잃으면 드롭다운 닫기
    select.onblur = function() {
        if (cell.contains(this)) cell.innerText = this.value;
    };
}

// 나머지 함수(updateCounts, switchTab, renderMonthPicker)는 동일하게 유지
function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const cells = row.querySelectorAll('.at-cell');
        let used = 0;
        cells.forEach(c => {
            const txt = c.innerText;
            if (txt === '연차') used += 1;
            else if (txt.includes('반차')) used += 0.5;
        });
        const unused = parseFloat(row.cells[3].innerText) || 0;
        const req = parseFloat(row.cells[2].innerText) || 0;
        const rem = unused - used;
        const remEl = document.getElementById(`rem-${name}`);
        if(remEl) remEl.innerText = rem;
        const rate = req > 0 ? ((req - rem) / req * 100) : 0;
        const rateEl = document.getElementById(`rate-${name}`);
        if(rateEl) rateEl.innerText = Math.floor(rate) + '%';
    });
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
