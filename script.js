const GAN_URL = "https://script.google.com/macros/s/AKfycby42R57TUGVePyKRxfsFqeLuinCy0rxIVZudX2-Z1tERUpYCxJWw50EU0ZsqIrVGlWy/exec";

const urlParams = new URLSearchParams(window.location.search);
const myBranch = urlParams.get('branch');

let currentType = 'manager';
let currentMonth = 1;
let masterData = { manager: [], staff: [] };
let lastFetchedAttendance = [];

window.onload = () => { 
    renderMonthPicker(); 
    loadAllData(); 
};

// 엑셀 저장 버튼 (디자인 유지)
function addExcelButton() {
    if (document.getElementById('btn-excel')) return;
    const container = document.getElementById('month-picker');
    if (!container) return;

    const btn = document.createElement('button');
    btn.id = 'btn-excel';
    btn.innerText = '엑셀 저장 📥';
    btn.style.cssText = "margin-left:20px; background:#2e7d32; color:white; border:none; padding:5px 12px; cursor:pointer; border-radius:4px; font-weight:bold; font-size:12px;";
    btn.onclick = downloadExcel;
    container.appendChild(btn);
}

// 엑셀 다운로드 (테이블 자동 감지)
function downloadExcel() {
    const table = document.querySelector('table'); 
    if (!table) { alert("화면에 출력된 표를 찾을 수 없습니다."); return; }
    const branchInfo = myBranch ? myBranch : "전체지점";
    const filename = `2026년_${currentMonth}월_근태현황_${branchInfo}.xls`;
    let html = table.outerHTML;
    const uri = 'data:application/vnd.ms-excel;base64,';
    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
    const base64 = (s) => window.btoa(unescape(encodeURIComponent(s)));
    const link = document.createElement('a');
    link.href = uri + base64(template);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getHolidays(month) {
    const data = { 
        1: { 1: "신정" }, 2: { 16: "설날", 17: "설날", 18: "설날" }, 
        3: { 1: "삼일절", 2: "대체공휴일" }, 5: { 5: "어린이날", 24: "석가탄신일", 25: "대체공휴일" },
        6: { 6: "현충일" }, 8: { 15: "광복절", 17: "대체공휴일" },
        9: { 24: "추석", 25: "추석", 26: "추석", 28: "대체공휴일" }, 10: { 3: "개천절", 5: "대체공휴일", 9: "한글날" },
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
                const bName = row[1] || "";
                if (myBranch && bName !== myBranch) return; 
                const p = { branch: bName, name: row[2] || "", req: row[3] || 0, unused: row[4] || 0 };
                if (row[0] === 'manager') masterData.manager.push(p);
                else masterData.staff.push(p);
            });
        }
        lastFetchedAttendance = res.attendance || [];
        renderTable(lastFetchedAttendance);
    } catch (e) { console.error("데이터 로드 실패"); }
}

function renderTable(attendance) {
    // [보강된 제목 업데이트 로직]
    // 1. 'table-title' 아이디를 가진 요소 찾기
    // 2. 없으면 화면상의 h2 태그 찾기
    // 3. 그것도 없으면 '근태 현황' 텍스트를 포함한 모든 태그 중 첫 번째 찾기
    const titleEl = document.getElementById('table-title') || 
                    document.querySelector('h2') || 
                    Array.from(document.querySelectorAll('h1, h2, h3, div')).find(el => el.innerText.includes('근태 현황'));
    
    if (titleEl) {
        titleEl.innerText = `${currentMonth}월 근태 현황`;
    }

    const tbody = document.getElementById('attendance-body');
    const dateRow = document.getElementById('row-dates');
    const weekRow = document.getElementById('row-weeks');
    const holidayRow = document.getElementById('row-holidays');
    const vRow = document.getElementById('row-vacation');
    const wRow = document.getElementById('row-working');

    if(!tbody || !dateRow) return;

    tbody.innerHTML = ''; dateRow.innerHTML = ''; weekRow.innerHTML = ''; holidayRow.innerHTML = '';
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
        if (isExist) {
            const dayIdx = dateObj.getDay();
            const hName = holidayInfo[d] || "";
            thD.innerText = d; thW.innerText = weekDays[dayIdx]; thH.innerText = hName;
            if(dayIdx === 0 || dayIdx === 6 || hName !== "") { [thD, thW, thH].forEach(el => el.classList.add('txt-red')); }
        }
        dateRow.appendChild(thD); weekRow.appendChild(thW); holidayRow.appendChild(thH);
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
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidayInfo[i]) td.classList.add('bg-pink');
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
    cell.style.color = ""; cell.style.fontWeight = "bold";
    if(status === '연차' || status === '휴가') cell.style.color = "#d32f2f";
    else if(status === '출장') cell.style.color = "#000000";
    else if(status.includes('반차')) cell.style.color = "#ef6c00";
    else if(status === '반반차') cell.style.color = "#4caf50";
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
        fetch(GAN_URL, {
            method: "POST", mode: "no-cors",
            body: JSON.stringify({ month: parseInt(currentMonth), type: currentType, name: name, day: parseInt(day), status: newStatus })
        });
    };
    select.onblur = function() { if (cell.contains(this)) cell.innerText = this.value; };
}

function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    const dailyVacationCount = Array(32).fill(0);
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const cells = row.querySelectorAll('.at-cell');
        let used = 0;
        cells.forEach(c => {
            const txt = c.innerText;
            const day = parseInt(c.getAttribute('data-day'));
            if(!txt) return;
            if (txt === '연차') used += 1;
            else if (txt === '반반차') used += 0.25;
            else if (txt.includes('반차')) used += 0.5;
            if (['연차', '오전반차', '오후반차', '반반차', '휴가', '출장'].includes(txt)) dailyVacationCount[day] += 1;
        });
        const unused = parseFloat(row.cells[3].innerText) || 0;
        const rem = unused - used;
        const remEl = document.getElementById(`rem-${name}`);
        if(remEl) remEl.innerText = Number.isInteger(rem) ? rem : rem.toFixed(2);
        const req = parseFloat(row.cells[2].innerText) || 0;
        const rateEl = document.getElementById(`rate-${name}`);
        if(rateEl) rateEl.innerText = req > 0 ? Math.floor((req - rem) / req * 100) + '%' : '0%';
    });
    for (let d = 1; d <= 31; d++) {
        const vCell = document.getElementById(`vac-count-${d}`);
        const wCell = document.getElementById(`work-count-${d}`);
        if (vCell && wCell) {
            vCell.innerText = dailyVacationCount[d];
            wCell.innerText = rows.length - dailyVacationCount[d];
        }
    }
}

function renderMonthPicker() {
    const container = document.getElementById('month-picker');
    if (!container) return;
    container.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = m + '월';
        btn.className = `month-btn ${m === currentMonth ? 'active' : ''}`;
        if(m === currentMonth) { btn.style.background = "#d32f2f"; btn.style.color = "white"; }
        btn.onclick = () => { currentMonth = m; renderMonthPicker(); loadAllData(); };
        container.appendChild(btn);
    }
    addExcelButton();
}

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById(`btn-${type}`);
    if (targetBtn) targetBtn.classList.add('active');
    renderTable(lastFetchedAttendance);
    addExcelButton();
}
