const GAN_URL = "https://script.google.com/macros/s/AKfycbxzW9z5RlDSmrYzMAH_2OCmorPWFbW4FposdvNNfaTOSsuzvamK5ANZIZL3-S43roYh/exec";

const managerList = [
    { branch: "대전동지점", name: "이승삼", required: 17, unused: 17 },
    { branch: "대전서지점", name: "김학형", required: 17, unused: 17 },
    { branch: "천안지점", name: "백운식", required: 17, unused: 17 },
    { branch: "청주지점", name: "윤남수", required: 17, unused: 17 },
    { branch: "평택지점", name: "류희복", required: 17, unused: 17 },
    { branch: "홍성지점", name: "한수하", required: 17, unused: 17 },
    { branch: "충청영업기획", name: "나병운", required: 17, unused: 17 }
];

const staffList = [];
for (let i = 1; i <= 50; i++) {
    staffList.push({ branch: `지점${Math.ceil(i/5)}`, name: `직원${i}`, required: 15, unused: 15 });
}

let currentType = 'manager';
const holidayDates = [1, 3, 4, 10, 11, 17, 18, 24, 25, 31];

// [수정] 페이지 로드 즉시 명단부터 그립니다.
window.onload = function() {
    renderTable(currentType, []); // 일단 빈 데이터로 명단부터 출력
    loadDataFromServer();         // 그 다음 서버에서 데이터를 가져와 채움
};

function switchTab(type) {
    currentType = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(currentType, []); // 탭 전환 시에도 명단부터 즉시 표시
    loadDataFromServer();
}

async function loadDataFromServer() {
    try {
        const response = await fetch(GAN_URL);
        const serverData = await response.json();
        renderTable(currentType, serverData); // 데이터를 받아오면 다시 그림
    } catch (error) {
        console.error("데이터 로드 실패:", error);
        // 실패해도 이미 그려진 명단은 유지됩니다.
    }
}

function renderTable(type, serverData) {
    const tbody = document.getElementById('attendance-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const dataList = (type === 'manager') ? managerList : staffList;

    dataList.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        
        let rowHtml = `<td>${person.branch}</td><td>${person.name}</td>
            <td class="num-cell" id="req-${person.name}">${person.required}</td>
            <td class="num-cell" id="un-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rem-${person.name}">${person.unused}</td>
            <td class="num-cell" id="rate-${person.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            let status = "";
            if (serverData && serverData.length > 0) {
                const match = serverData.find(row => row[0] === type && row[1] === person.name && String(row[2]) === String(i));
                if(match) status = match[3];
            }

            const statusClass = getStatusClass(status);
            const holidayClass = holidayDates.includes(i) ? 'weekend' : '';
            rowHtml += `<td class="at-cell ${holidayClass} ${statusClass}" data-day="${i}" onclick="showDropdown(this)">${status}</td>`;
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    
    updateCounts();
}

// [수정] 드롭다운 기능 (기존 디자인 유지)
function showDropdown(cell) {
    if (cell.querySelector('select')) return;

    const currentStatus = cell.innerText;
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];
    
    const select = document.createElement('select');
    // 셀 크기에 완벽히 맞춤
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

        try {
            await fetch(GAN_URL, {
                method: "POST",
                body: JSON.stringify({ type: currentType, name: name, day: day, status: newStatus })
            });
            updateCounts();
        } catch (e) {
            console.error("저장 실패");
        }
    };

    select.onblur = function() {
        if (cell.contains(this)) cell.innerText = this.value;
    };
}

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
