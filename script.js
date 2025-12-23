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
                const p = { branch: row[1] || "", name: row[2] || "", req: row[3] || 0, unused: row[targetCol] || 0 };
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
    const holidayRow = document.g육''.육'].forEa =>  
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

async function saveData(m, t, n, d, s) { fetch(GAN_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ month: m, type: t, name: n, day: d, status: s }) }); }

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
        btn.className = `month-btn ${m === currentMonth ? 'active' : ''}`;
        btn.onclick = () => { currentMonth = m; renderMonthPicker(); loadAllData(); };
        container.appendChild(btn);
    }
}

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}

function downloadExcel() {
    const table = document.getElementById("attendance-table");
    const wb = XLSX.utils.table_to_book(table, {sheet: "근태현황"});
    XLSX.writeFile(wb, `${currentMonth}월_근태현황_${currentType}.xlsx`);
}

