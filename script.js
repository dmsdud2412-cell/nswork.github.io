// 1. 데이터 정의 (임의 50명씩 생성)
const managerList = [];
const staffList = [];

// 샘플 데이터 생성
for (let i = 1; i <= 50; i++) {
    managerList.push({ branch: `본부${Math.ceil(i/10)}`, name: `지점장${i}`, required: 17, unused: 17 });
    staffList.push({ branch: `지점${Math.ceil(i/5)}`, name: `직원${i}`, required: 15, unused: 15 });
}

let currentTab = 'manager';

document.addEventListener('DOMContentLoaded', () => {
    renderTable('manager');
});

// 2. 표 그리기 함수
function renderTable(type) {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '';
    const data = (type === 'manager') ? managerList : staffList;

    data.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        
        let rowHtml = `
            <td>${person.branch}</td>
            <td>${person.name}</td>
            <td id="required-${person.name}">${person.required}</td>
            <td id="unused-${person.name}">${person.unused}</td>
            <td id="remaining-${person.name}">${person.unused}</td>
            <td id="rate-${person.name}">0%</td>
        `;
        for (let i = 1; i <= 31; i++) rowHtml += `<td class="at-cell"></td>`;
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    attachCellEvents();
    updateCounts();
}

// 3. 탭 전환 기능
function switchTab(type) {
    currentTab = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(type);
}

// 4. 클릭 이벤트 바인딩
function attachCellEvents() {
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            let current = cell.innerText;
            let nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
            let nextStatus = statuses[nextIdx];
            cell.innerText = nextStatus;

            cell.classList.remove('status-휴가', 'status-연차', 'status-반차', 'status-반반차');
            if (nextStatus === '휴가') cell.classList.add('status-휴가');
            else if (nextStatus === '연차') cell.classList.add('status-연차');
            else if (nextStatus.includes('반차') && nextStatus !== '반반차') cell.classList.add('status-반차');
            else if (nextStatus === '반반차') cell.classList.add('status-반반차');

            updateCounts();
        });
    });
}

// 5. 계산 로직
function updateCounts() {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const allCells = row.querySelectorAll('.at-cell');
        let usedSum = 0;

        allCells.forEach(c => {
            const txt = c.innerText;
            if (txt === '연차') usedSum += 1;
            else if (txt.includes('반차') && txt !== '반반차') usedSum += 0.5;
            else if (txt === '반반차') usedSum += 0.25;
        });

        const requiredVal = parseFloat(document.getElementById(`required-${name}`).innerText) || 0;
        const unusedVal = parseFloat(document.getElementById(`unused-${name}`).innerText) || 0;
        const remainingVal = unusedVal - usedSum;
        const usageRate = requiredVal > 0 ? ((requiredVal - remainingVal) / requiredVal) * 100 : 0;

        document.getElementById(`remaining-${name}`).innerText = Number.isInteger(remainingVal) ? remainingVal : remainingVal.toFixed(2);
        document.getElementById(`rate-${name}`).innerText = Math.floor(usageRate) + '%';
    });

    const holidayFooter = document.querySelectorAll('#holiday-row td:not(.footer-label)');
    const workFooter = document.querySelectorAll('#work-row td:not(.footer-label)');
    for (let i = 0; i < 31; i++) {
        let hCount = 0;
        rows.forEach(row => {
            const c = row.querySelectorAll('.at-cell')[i];
            if (c) {
                const txt = c.innerText;
                if (txt === '연차') hCount += 1;
                else if (txt.includes('반차') && txt !== '반반차') hCount += 0.5;
                else if (txt === '반반차') hCount += 0.25;
            }
        });
        holidayFooter[i].innerText = hCount || '0';
        workFooter[i].innerText = rows.length - hCount;
    }
}
