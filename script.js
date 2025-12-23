const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec";
let currentType = 'manager';
let currentMonth = 1;
let masterData = { manager: [], staff: [] };
let lastFetchedAttendance = [];

window.onload = () => { renderMonthPicker(); loadAllData(); };

async function loadAllData() {
    try {
        const response = await fetch(GAN_URL);
        const res = await response.json();
        masterData.manager = []; masterData.staff = [];
        if(res.config) {
            const targetCol = 4 + (currentMonth - 1); 
            res.config.slice(1).forEach(row => {
                const p = { branch: row[1] || "", name: row[2] || "", req: row[3] || 0, unused: row[targetCol] || 0 };
                if (row[0] === 'manager') masterData.manager.push(p);
                else masterData.staff.push(p);
            });
        }
        lastFetchedAttendance = res.attendance || [];
        renderTable(lastFetchedAttendance);
    } catch (e) { console.error("데이터 로드 실패"); }
}

function renderTable(attendance) {
    const tbody = document.getElementById('attendance-body');
    const dateRow = document.getElementById('row-dates');
    const weekRow = document.getElementById('row-weeks');
    const holidayRow = document.getElementById('row-holidays');
    
    tbody.innerHTML = ''; dateRow.innerHTML = ''; weekRow.innerHTML = ''; holidayRow.innerHTML = '';
    
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    
    // 날짜/요일 헤더 생성
    for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, currentMonth - 1, d);
        const isExist = dateObj.getMonth() === currentMonth - 1;
        const thD = document.createElement('th'); thD.className = 'col-day';
        const thW = document.createElement('th'); thW.className = 'col-day';
        const thH = document.createElement('th'); thH.className = 'col-day';

        if (isExist) {
            const dayIdx = dateObj.getDay();
            thD.innerText = d; thW.innerText = weekDays[dayIdx];
            if(dayIdx === 0 || dayIdx === 6) [thD, thW, thH].forEach(el => el.classList.add('txt-red'));
        }
        dateRow.appendChild(thD); weekRow.appendChild(thW); holidayRow.appendChild(thH);
    }

    // 비고 헤더 추가
    const noteTh = document.createElement('th');
    noteTh.innerText = "비고"; noteTh.className = 'col-note';
    dateRow.appendChild(noteTh);
    weekRow.appendChild(document.createElement('th'));
    holidayRow.appendChild(document.createElement('th'));

    // 데이터 행 생성
    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    list.forEach(p => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', p.name);
        tr.innerHTML = `<td>${p.branch}</td><td>${p.name}</td><td>${p.req}</td><td>${p.unused}</td><td id="rem-${p.name}">${p.unused}</td><td id="rate-${p.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            const td = document.createElement('td');
            td.className = 'at-cell col-day';
            const match = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == i);
            td.innerText = match ? match[4] : "";
            td.onclick = function() { showDropdown(this, i, p.name); };
            tr.appendChild(td);
        }

        const noteTd = document.createElement('td');
        const noteMatch = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == 32);
        noteTd.className = 'col-note';
        noteTd.innerHTML = `<input type="text" value="${noteMatch ? noteMatch[4] : ""}" onchange="saveData(${currentMonth}, '${currentType}', '${p.name}', 32, this.value)">`;
        tr.appendChild(noteTd);
        tbody.appendChild(tr);
    });
    updateCounts();
}

function showDropdown(cell, day, name) {
    if (cell.querySelector('select')) return;
    const select = document.createElement('select');
    ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'].forEach(s => {
        const opt = document.createElement('option');
        opt.value = s; opt.innerText = s || '-';
        select.appendChild(opt);
    });
    select.onchange = function() {
        cell.innerText = this.value;
        saveData(currentMonth, currentType, name, day, this.value);
        updateCounts();
    };
    cell.innerHTML = ''; cell.appendChild(select);
    select.focus();
}

async function saveData(m, t, n, d, s) {
    fetch(GAN_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ month: m, type: t, name: n, day: d, status: s }) });
}

function updateCounts() {
    // 인원 및 연차 소진율 계산 로직 (기존과 동일)
}

function renderMonthPicker() {
    const container = document.getElementById('month-picker');
    container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = m + '월';
        btn.className = `month-btn ${m === currentMonth ? 'active' : ''}`;
        btn.onclick = () => { currentMonth = m; loadAllData(); };
        container.appendChild(btn);
    }
}

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}
