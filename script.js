const GAN_URL = "사용자님의_새로운_웹앱_URL을_여기에_넣어주세요";

// 인원 명단 (나중에 구글 시트로 옮기기 전까지는 여기서 수정하세요)
const managerList = [
    { branch: "대전동지점", name: "이승삼", required: 17, unused: 17 },
    { branch: "대전서지점", name: "김학형", required: 17, unused: 17 },
    { branch: "천안지점", name: "백운식", required: 17, unused: 17 },
    { branch: "청주지점", name: "윤남수", required: 17, unused: 17 },
    { branch: "평택지점", name: "류희복", required: 17, unused: 17 },
    { branch: "홍성지점", name: "한수하", required: 17, unused: 17 },
    { branch: "충청영업기획", name: "나병운", required: 17, unused: 17 }
];

const staffList = []; // 직원 명단은 현재 비어있음

let currentType = 'manager';
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 현재 월 (1~12)

// [자동 주말 계산] 이번 달의 주말(토, 일) 날짜를 배열로 반환
function getWeekends(year, month) {
    let weekends = [];
    let date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        if (date.getDay() === 0 || date.getDay() === 6) { // 0: 일요일, 6: 토요일
            weekends.push(date.getDate());
        }
        date.setDate(date.getDate() + 1);
    }
    return weekends;
}

// 공휴일을 여기에 숫자로 넣으세요 (예: 1월 1일, 1월 28일)
const publicHolidays = [1, 28, 29, 30]; 

window.onload = function() {
    renderBaseTable();
    loadDataFromServer();
};

function renderBaseTable() {
    const tbody = document.getElementById('attendance-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const dataList = (currentType === 'manager') ? managerList : staffList;
    const weekends = getWeekends(currentYear, currentMonth);
    const allHolidays = [...new Set([...weekends, ...publicHolidays])];

    dataList.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        
        let rowHtml = `<td>${person.branch}</td><td>${person.name}</td>
            <td class="num-cell" id="req-${person.name}">${person.required}</td>
            <td class="num-cell" id="un-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rem-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rate-${person.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            // 주말이나 공휴일이면 'weekend' 클래스를 붙여 빨간색 음영 적용
            const holidayClass = allHolidays.includes(i) ? 'weekend' : '';
            rowHtml += `<td class="at-cell ${holidayClass}" data-day="${i}" onclick="showDropdown(this)"></td>`;
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    
    // 하단 합계행(footer)에도 주말 색상 입히기
    applyFooterColor(allHolidays);
    updateCounts();
}

function applyFooterColor(holidays) {
    const footerCells = document.querySelectorAll('.footer-row td:not(.footer-label)');
    footerCells.forEach((cell, idx) => {
        const day = idx + 1;
        if (holidays.includes(day)) {
            cell.classList.add('weekend');
        } else {
            cell.classList.remove('weekend');
        }
    });
}

async function loadDataFromServer() {
    try {
        const response = await fetch(GAN_URL);
        const serverData = await response.json();
        
        serverData.forEach(row => {
            const [month, type, name, day, status] = row;
            if (month == currentMonth && type === currentType) {
                const tr = document.querySelector(`tr[data-person="${name}"]`);
                if (tr) {
                    const cell = tr.querySelector(`td[data-day="${day}"]`);
                    if (cell) {
                        cell.innerText = status;
                        const isHoliday = cell.classList.contains('weekend') ? 'weekend ' : '';
                        cell.className = `at-cell ${isHoliday}${getStatusClass(status)}`;
                    }
                }
            }
        });
        updateCounts();
    } catch (e) { console.log("로드 중"); }
}

function showDropdown(cell) {
    if (cell.querySelector('select')) return;
    const currentStatus = cell.innerText;
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];
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
            const res = await fetch(GAN_URL, {
                method: "POST",
                body: JSON.stringify({ 
                    month: currentMonth, 
                    type: currentType, 
                    name: name, 
                    day: day, 
                    status: newStatus 
                })
            });
            if(res.ok) {
                cell.style.backgroundColor = "#c8e6c9"; 
                setTimeout(() => { cell.style.backgroundColor = ""; }, 500);
            }
        } catch (e) {
            alert("저장 실패");
            cell.style.backgroundColor = "#ffcdd2";
        }
    };
    select.onblur = function() { if (cell.contains(this)) cell.innerText = this.value; };
}

// ... (getStatusClass, updateCounts 함수는 기존과 동일하게 유지) ...
function getStatusClass(status) {
    if (status === '휴가' || status === '연차') return 'status-연차';
    if (status.includes('반차') && status !== '반반차') return 'status-반차';
    if (status === '반반차') return 'status-반반차';
    return '';
}

function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const cells = row.querySelectorAll('.at-cell');
        let used = 0;
        cells.forEach(c => {
            const txt = c.innerText;
            if (txt === '연차' || txt === '휴가') used += 1;
            else if (txt.includes('반차') && txt !== '반반차') used += 0.5;
            else if (txt === '반반차') used += 0.25;
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
