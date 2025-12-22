const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec"; 

let currentType = 'manager';
let currentYear = 2026;
let currentMonth = 1; 
let masterData = { manager: [], staff: [] }; 
let lastFetchedAttendance = []; 

window.onload = function() {
    createMonthPicker(); 
    loadAllData();
};

// 2026년 공휴일 및 신정(1/1)
function getPublicHolidays(month) {
    const holidays = { 1:[1], 2:[16,17,18], 3:[1,2], 5:[5,24,25], 6:[6], 8:[15,17], 9:[24,25,26], 10:[3,5,9], 12:[25] };
    return holidays[month] || [];
}

// 주말 계산
function getWeekends(year, month) {
    let weekends = [];
    let lastDay = new Date(year, month, 0).getDate(); 
    for (let d = 1; d <= lastDay; d++) {
        let dayOfWeek = new Date(year, month - 1, d).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) weekends.push(d);
    }
    return weekends;
}

// 탭 전환
function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}

// 데이터 로드
async function loadAllData() {
    try {
        const response = await fetch(GAN_URL);
        const res = await response.json();
        masterData.manager = [];
        masterData.staff = [];
        res.config.slice(1).forEach(row => {
            const person = { branch: row[1], name: row[2], required: row[3], unused: row[4] };
            if (row[0] === 'manager') masterData.manager.push(person);
            else if (row[0] === 'staff') masterData.staff.push(person);
        });
        lastFetchedAttendance = res.attendance;
        renderTable(lastFetchedAttendance);
    } catch (e) { console.error("로드 실패"); }
}

function renderTable(attendance) {
    const tbody = document.getElementById('attendance-body');
    const dateHeader = document.getElementById('date-header');
    const holidayRow = document.getElementById('holiday-row');
    const workRow = document.getElementById('work-row');
    
    // 헤더 및 합계행 초기화 (디자인 보존)
    dateHeader.innerHTML = '';
    const hLabel = holidayRow.cells[0]; holidayRow.innerHTML = ''; holidayRow.appendChild(hLabel);
    const wLabel = workRow.cells[0]; workRow.innerHTML = ''; workRow.appendChild(wLabel);

    const weekends = getWeekends(currentYear, currentMonth);
    const holidays = getPublicHolidays(currentMonth);
    const allHolidays = [...new Set([...weekends, ...holidays])];

    // 날짜 및 음영 생성
    for(let i=1; i<=31; i++) {
        const th = document.createElement('th');
        th.innerText = i;
        if(allHolidays.includes(i)) th.className = 'weekend';
        dateHeader.appendChild(th);

        const tdH = document.createElement('td');
        if(allHolidays.includes(i)) tdH.className = 'weekend';
        holidayRow.appendChild(tdH);

        const tdW = document.createElement('td');
        if(allHolidays.includes(i)) tdW.className = 'weekend';
        workRow.appendChild(tdW);
    }

    tbody.innerHTML = '';
    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;

    list.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        let rowHtml = `<td>${person.branch}</td><td>${person.name}</td>
            <td class="num-cell" id="req-${person.name}">${person.required}</td>
            <td class="num-cell" id="un-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rem-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rate-${person.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            let status = "";
            const match = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == person.name && r[3] == i);
            if(match) status = match[4];
            const isHoliday = allHolidays.includes(i) ? 'weekend' : '';
            rowHtml += `<td class="at-cell ${isHoliday} ${getStatusClass(status)}" data-day="${i}" onclick="showDropdown(this)">${status}</td>`;
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    updateCounts();
}

function getStatusClass(status) {
    if (status === '휴가' || status === '연차') return 'status-연차';
    if (status.includes('반차')) return 'status-반차';
    return '';
}

// 월 선택기 생성 (기능만 추가)
function createMonthPicker() {
    const header = document.querySelector('.header');
    const div = document.createElement('div');
    div.style.textAlign = 'center';
    div.style.marginBottom = '15px';
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = m + '월';
        btn.className = 'tab-btn';
        btn.style.margin = '2px';
        if(m === currentMonth) btn.classList.add('active');
        btn.onclick = function() {
            currentMonth = m;
            document.querySelectorAll('.month-picker-container button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTable(lastFetchedAttendance);
        };
        div.appendChild(btn);
    }
    div.className = 'month-picker-container';
    header.after(div);
}

// 드롭다운 및 계산 함수는 디자인에 영향 주지 않으므로 유지
function showDropdown(cell) {
    if (cell.querySelector('select')) return;
    const currentStatus = cell.innerText;
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'];
    const select = document.createElement('select');
    select.style.cssText = "width:100%; border:none; background:transparent; font-size:12px; text-align:center;";
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
        const isHoliday = cell.classList.contains('weekend') ? 'weekend ' : '';
        cell.className = `at-cell ${isHoliday}${getStatusClass(newStatus)}`;
        updateCounts(); 
        await fetch(GAN_URL, { method: "POST", body: JSON.stringify({ month: currentMonth, type: currentType, name: name, day: day, status: newStatus }) });
    };
    select.onblur = function() { if (cell.contains(this)) cell.innerText = this.value; };
}

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
        const reqEl = document.getElementById(`req-${name}`);
        const unEl = document.getElementById(`un-${name}`);
        if(reqEl && unEl) {
            const rem = parseFloat(unEl.innerText) - used;
            document.getElementById(`rem-${name}`).innerText = rem;
            const reqVal = parseFloat(reqEl.innerText);
            const rate = reqVal > 0 ? ((reqVal - rem) / reqVal) * 100 : 0;
            document.getElementById(`rate-${name}`).innerText = Math.floor(rate) + '%';
        }
    });
}
