// 1. 사용자님의 새로운 구글 웹앱 URL
const GAN_URL = "https://script.google.com/macros/s/AKfycbxYt5lKM8TH6fTCjxYE0Ps6ltIjQR50nGAYNAWqDH1h9gLJyq0YzxjvrVoaCIZVv7q-/exec";

let currentType = 'manager';
let currentMonth = new Date().getMonth() + 1; // 현재 월 자동 인식
let masterData = { manager: [], staff: [] }; 

window.onload = function() {
    loadAllData();
};

// 탭 전환 기능 (기존 디자인 유지)
function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    loadAllData(); // 탭 바꿀 때 데이터 다시 로드
}

// 이번 달 주말(토, 일) 자동 계산
function getWeekends(month) {
    let year = new Date().getFullYear();
    let weekends = [];
    let date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        if (date.getDay() === 0 || date.getDay() === 6) weekends.push(date.getDate());
        date.setDate(date.getDate() + 1);
    }
    return weekends;
}

// 구글 시트에서 모든 정보 가져오기
async function loadAllData() {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '<tr><td colspan="37" style="text-align:center;">데이터를 동기화 중입니다...</td></tr>';

    try {
        const response = await fetch(GAN_URL);
        const res = await response.json();
        
        // 구글 시트 '명단' 탭에서 인원 정보 파싱
        masterData.manager = [];
        masterData.staff = [];
        res.config.slice(1).forEach(row => {
            const person = { branch: row[1], name: row[2], required: row[3], unused: row[4] };
            if (row[0] === 'manager') masterData.manager.push(person);
            else masterData.staff.push(person);
        });

        renderTable(res.attendance);
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
}

function renderTable(attendance) {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '';
    
    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    const weekends = getWeekends(currentMonth);

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

            const isWeekend = weekends.includes(i) ? 'weekend' : '';
            const statusClass = getStatusClass(status);
            rowHtml += `<td class="at-cell ${isWeekend} ${statusClass}" data-day="${i}" onclick="showDropdown(this)">${status}</td>`;
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    
    updateCounts();
}

function showDropdown(cell) {
    if (cell.querySelector('select')) return;
    const currentStatus = cell.innerText;
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차', '휴가', '출장'];
    const select = document.createElement('select');
    select.style.cssText = "width:100%; height:100%; border:none; background:transparent; font-size:12px; text-align:center; cursor:pointer;";

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
        const isWeekend = cell.classList.contains('weekend') ? 'weekend ' : '';
        cell.className = `at-cell ${isWeekend}${getStatusClass(newStatus)}`;
        updateCounts(); // 클릭 즉시 계산

        cell.style.backgroundColor = "#fff9c4"; // 노란색 (저장중)

        try {
            await fetch(GAN_URL, {
                method: "POST",
                body: JSON.stringify({ month: currentMonth, type: currentType, name: name, day: day, status: newStatus })
            });
            cell.style.backgroundColor = "#c8e6c9"; // 초록색 (성공)
            setTimeout(() => { cell.style.backgroundColor = ""; }, 500);
        } catch (e) {
            alert("저장 실패! 시트 연결을 확인하세요.");
            cell.style.backgroundColor = "#ffcdd2";
        }
    };
    select.onblur = function() { if (cell.contains(this)) cell.innerText = this.value; };
}

function getStatusClass(status) {
    if (status === '휴가' || status === '연차') return 'status-연차';
    if (status.includes('반차') && status !== '반반차') return 'status-반차';
    if (status === '반반차') return 'status-반반차';
    return '';
}

// [중요] 계산 로직: 연차 관련만 차감, 휴가/출장은 무시
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
            // '휴가', '출장'은 여기서 계산되지 않음
        });
        
        const reqEl = document.getElementById(`req-${name}`);
        const unEl = document.getElementById(`un-${name}`);
        if(reqEl && unEl) {
            const reqVal = parseFloat(reqEl.innerText);
            const unVal = parseFloat(unEl.innerText);
            const rem = unVal - used;
            const rate = reqVal > 0 ? ((reqVal - rem) / reqVal) * 100 : 0;
            document.getElementById(`rem-${name}`).innerText = rem % 1 === 0 ? rem : rem.toFixed(2);
            document.getElementById(`rate-${name}`).innerText = Math.floor(rate) + '%';
        }
    });

    // 하단 일별 인원 합계
    const hFooter = document.querySelectorAll('#holiday-row td:not(.footer-label)');
    const wFooter = document.querySelectorAll('#work-row td:not(.footer-label)');
    for (let i = 0; i < 31; i++) {
        let personCount = 0;
        rows.forEach(row => {
            const cell = row.querySelectorAll('.at-cell')[i];
            if (cell && cell.innerText !== '') personCount += 1;
        });
        if(hFooter[i]) hFooter[i].innerText = personCount || '0';
        if(wFooter[i]) wFooter[i].innerText = rows.length - personCount;
    }
}
