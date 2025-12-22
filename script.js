const GAN_URL = "본인의_구글_배포_URL"; 

let currentType = 'manager';
let currentYear = 2026;
let currentMonth = 1; 
let masterData = { manager: [], staff: [] }; 
let lastFetchedAttendance = []; 

window.onload = function() {
    createMonthPicker(); 
    loadAllData();
};

function createMonthPicker() {
    const header = document.querySelector('.header');
    const pickerDiv = document.createElement('div');
    pickerDiv.style.cssText = "text-align:center; margin: 10px 0; padding:10px; background:#fff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);";
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = `${m}월`;
        btn.className = 'tab-btn';
        btn.style.margin = "0 2px";
        if(m === currentMonth) btn.style.background = "#d32f2f";
        btn.onclick = function() {
            currentMonth = m;
            document.querySelectorAll('.month-picker button').forEach(b => b.style.background = "");
            this.style.background = "#d32f2f";
            renderTable(lastFetchedAttendance);
        };
        pickerDiv.appendChild(btn);
    }
    pickerDiv.className = 'month-picker';
    header.after(pickerDiv);
}

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}

function getPublicHolidays(month) {
    const holidays = { 1:[1], 2:[16,17,18], 3:[1,2], 5:[5,24,25], 6:[6], 8:[15,17], 9:[24,25,26], 10:[3,5,9], 12:[25] };
    return holidays[month] || [];
}

function getWeekends(year, month) {
    let weekends = [];
    let lastDay = new Date(year, month, 0).getDate(); 
    for (let d = 1; d <= lastDay; d++) {
        let dayOfWeek = new Date(year, month - 1, d).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) weekends.push(d);
    }
    return weekends;
}

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
    if (!tbody) return;
    tbody.innerHTML = '';
    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    const weekends = getWeekends(currentYear, currentMonth);
    const holidays = getPublicHolidays(currentMonth);
    const allHolidays = [...new Set([...weekends, ...holidays])];

    list.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        let rowHtml = `<td>${person.branch}</td><td>${person.name}</td>
            <td id="req-${person.name}">${person.required}</td>
            <td id="un-${person.name}">${person.unused}</td>
            <td id="rem-${person.name}">${person.unused}</td>
            <td id="rate-${person.name}">0%</td>`;
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
    applyFooterColor(allHolidays);
    updateCounts();
}

function applyFooterColor(holidays) {
    const footerRows = document.querySelectorAll('#holiday-row td, #work-row td');
    footerRows.forEach((cell, idx) => {
        if (idx >= 1) { // 합계 라벨 이후 날짜칸들
            const dayNum = idx; 
            if (holidays.includes(dayNum)) cell.classList.add('weekend');
            else cell.classList.remove('weekend');
        }
    });
}

function getStatusClass(status) {
    if (status === '휴가' || status === '연차') return 'status-연차';
    if (status.includes('반차') && status !== '반반차') return 'status-반차';
    return '';
}

function showDropdown(cell) {
    if (cell.querySelector('select')) return;
    const currentStatus = cell.innerText;
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'];
    const select = document.createElement('select');
    select.style.cssText = "width:100%; border:none; background:transparent; font-size:12px; text-align:center;";
    statuses.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s === '' ? '-' : s;
        if(s === currentStatus) opt.selected = true;
        select.appendChild(opt);
    });
    cell.innerText = '';
    cell.appendChild(select);
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
            const rate = ((parseFloat(reqEl.innerText) - rem) / parseFloat(reqEl.innerText)) * 100;
            document.getElementById(`rate-${name}`).innerText = Math.floor(rate) + '%';
        }
    });
}
