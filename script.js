const managerList = [];
const staffList = [];

// 50명 임의 데이터 생성 (사번 없이 지점/이름만)
for (let i = 1; i <= 50; i++) {
    managerList.push({ branch: `본부${Math.ceil(i/10)}`, name: `지점장${i}`, required: 17, unused: 17 });
    staffList.push({ branch: `지점${Math.ceil(i/5)}`, name: `직원${i}`, required: 15, unused: 15 });
}

document.addEventListener('DOMContentLoaded', () => {
    renderTable('manager');
});

function renderTable(type) {
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = '';
    const data = (type === 'manager') ? managerList : staffList;

    data.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        let rowHtml = `<td>${person.branch}</td><td>${person.name}</td>
            <td id="required-${person.name}">${person.required}</td>
            <td id="unused-${person.name}">${person.unused}</td>
            <td id="remaining-${person.name}">${person.unused}</td>
            <td id="rate-${person.name}">0%</td>`;
        for (let i = 1; i <= 31; i++) rowHtml += `<td class="at-cell"></td>`;
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    attachCellEvents();
    updateCounts();
}

function switchTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    renderTable(type);
}

function attachCellEvents() {
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];
    cells.forEach(cell => {
        cell.onclick = () => {
            let nextIdx = (statuses.indexOf(cell.innerText) + 1) % statuses.length;
            let status = statuses[nextIdx];
            cell.innerText = status;
            cell.classList.remove('status-휴가', 'status-연차', 'status-반차', 'status-반반차');
            if (status === '휴가' || status === '연차') cell.classList.add(status === '휴가' ? 'status-휴가' : 'status-연차');
            else if (status.includes('반차') && status !== '반반차') cell.classList.add('status-반차');
            else if (status === '반반차') cell.classList.add('status-반반차');
            updateCounts();
        };
    });
}

function updateCounts() {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        const cells = row.querySelectorAll('.at-cell');
        let used = 0;
        cells.forEach(c => {
            if (c.innerText === '연차') used += 1;
            else if (c.innerText.includes('반차') && c.innerText !== '반반차') used += 0.5;
            else if (c.innerText === '반반차') used += 0.25;
        });
        const req = parseFloat(document.getElementById(`required-${name}`).innerText) || 0;
        const unused = parseFloat(document.getElementById(`unused-${name}`).innerText) || 0;
        const rem = unused - used;
        const rate = req > 0 ? ((req - rem) / req) * 100 : 0;
        document.getElementById(`remaining-${name}`).innerText = rem % 1 === 0 ? rem : rem.toFixed(2);
        document.getElementById(`rate-${name}`).innerText = Math.floor(rate) + '%';
    });

    const holidayFooter = document.querySelectorAll('#holiday-row td:not(.footer-label)');
    const workFooter = document.querySelectorAll('#work-row td:not(.footer-label)');
    for (let i = 0; i < 31; i++) {
        let hCount = 0;
        rows.forEach(row => {
            const txt = row.querySelectorAll('.at-cell')[i].innerText;
            if (txt === '연차') hCount += 1;
            else if (txt.includes('반차') && txt !== '반반차') hCount += 0.5;
            else if (txt === '반반차') hCount += 0.25;
        });
        holidayFooter[i].innerText = hCount || '0';
        workFooter[i].innerText = rows.length - hCount;
    }
}
