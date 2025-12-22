const GAN_URL = "여기에_구글_배포_URL을_넣으세요";

let currentType = 'manager';
let currentYear = 2026;
let currentMonth = 1; 

let masterData = { manager: [], staff: [] }; 
let lastFetchedAttendance = []; // 출석 기록 임시 저장용

window.onload = function() {
    createMonthPicker(); 
    loadAllData();
};

// 1. 월 선택 버튼 생성
function createMonthPicker() {
    const header = document.querySelector('.header') || document.body;
    const pickerDiv = document.createElement('div');
    pickerDiv.className = 'month-picker';
    pickerDiv.style.cssText = "text-align:center; margin-bottom:15px; padding:10px; background:#f8f9fa; border-radius:8px;";
    
    for (let m = 1; m <= 12; m++) {
        const btn = document.createElement('button');
        btn.innerText = `${m}월`;
        btn.className = 'tab-btn'; 
        btn.style.margin = "2px";
        if(m === currentMonth) btn.style.background = "#d32f2f"; 
        
        btn.onclick = function() {
            currentMonth = m;
            document.querySelectorAll('.month-picker .tab-btn').forEach(b => b.style.background = "");
            this.style.background = "#d32f2f";
            renderTable(lastFetchedAttendance); // 월 변경 시 다시 그리기
        };
        pickerDiv.appendChild(btn);
    }
    header.prepend(pickerDiv);
}

// 2. 탭 전환 함수 (지점장/직원 클릭 시 실행)
function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(lastFetchedAttendance);
}

// 3. 구글 시트에서 데이터 로드
async function loadAllData() {
    const tbody = document.getElementById('attendance-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="37" style="text-align:center;">데이터 동기화 중...</td></tr>';

    try {
        const response = await fetch(GAN_URL);
        const res = await response.json();
        
        if (res.error) {
            alert(res.error);
            return;
        }

        masterData.manager = [];
        masterData.staff = [];
        
        // 시트 데이터 분류 (A열 기준)
        res.config.slice(1).forEach(row => {
            const person = { branch: row[1], name: row[2], required: row[3], unused: row[4] };
            if (row[0] === 'manager') masterData.manager.push(person);
            else if (row[0] === 'staff') masterData.staff.push(person);
        });

        lastFetchedAttendance = res.attendance;
        renderTable(lastFetchedAttendance);
    } catch (e) {
        console.error("로드 실패:", e);
        if (tbody) tbody.innerHTML = '<tr><td colspan="37" style="text-align:center; color:red;">데이터 로드 실패 (URL 또는 시트 설정을 확인하세요)</td></tr>';
    }
}

// 4. 표 그리기 (핵심)
function renderTable(attendance) {
    const tbody = document.getElementById('attendance-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    const weekends = getWeekends(currentYear, currentMonth);
    const holidays = getPublicHolidays(currentMonth);
    const allHolidays = [...new Set([...weekends, ...holidays])];

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="37" style="text-align:center; padding:20px;">[${currentType}] 명단이 없습니다.</td></tr>`;
        return;
    }

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
    
    applyFooterColor(allHolidays);
    updateCounts();
}

// 주말/공휴일/계산 관련 보조 함수들 (디자인 유지)
function getWeekends(year, month) {
    let weekends = [];
    let lastDay = new Date(year, month, 0).getDate(); 
    for (let d = 1; d <= lastDay; d++) {
        let dayOfWeek = new Date(year, month - 1, d).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) weekends.push(d);
    }
    return weekends;
}

function getPublicHolidays(month) {
    const holidays = { 1:[1], 2:[16,17,18], 3:[1,2], 5:[5,24,25], 6:[6], 8:[15,17], 9:[24,25,26], 10:[3,5,9], 12:[25] };
    return holidays[month] || [];
}

function applyFooterColor(holidays) {
    const footerRows = document.querySelectorAll('.footer-row');
    footerRows.forEach(row => {
        const cells = row.querySelectorAll('td:not(.footer-label)');
        cells.forEach((cell, idx) => {
            if (holidays.includes(idx + 1)) cell.classList.add('weekend');
            else cell.classList.remove('weekend');
        });
    });
}

function getStatusClass(status) {
    if (status === '휴가' || status === '연차') return 'status-연차';
    if (status.includes('반차') && status !== '반반차') return 'status-반차';
    if (status === '반반차') return 'status-반반차';
    return '';
}

function showDropdown(cell) {
    if (cell.querySelector('select')) return;
    const currentStatus = cell.innerText;
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'];
    const select = document.createElement('select');
    select.style.cssText = "width:100%; height:100%; border:none; background:transparent; font-size:12px; text-align:center;";
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
        cell.style.backgroundColor = "#fff9c4"; 
        try {
            await fetch(GAN_URL, {
                method: "POST",
                body: JSON.stringify({ month: currentMonth, type: currentType, name: name, day: day, status: newStatus })
            });
            cell.style.backgroundColor = "#c8e6c9"; 
            setTimeout(() => { cell.style.backgroundColor = ""; }, 500);
        } catch (e) {
            alert("저장 실패");
        }
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
            else if (txt.includes('반차') && txt !== '반반차') used += 0.5;
            else if (txt === '반반차') used += 0.25;
        });
        const reqEl = document.getElementById(`req-${name}`);
        const unEl = document.getElementById(`un-${name}`);
        if(reqEl && unEl) {
            const reqVal = parseFloat(reqEl.innerText);
            const unVal = parseFloat(unEl.innerText);
            const rem = unVal - used;
            document.getElementById(`rem-${name}`).innerText = rem % 1 === 0 ? rem : rem.toFixed(2);
            const rate = reqVal > 0 ? ((reqVal - rem) / reqVal) * 100 : 0;
            document.getElementById(`rate-${name}`).innerText = Math.floor(rate) + '%';
        }
    });
}
