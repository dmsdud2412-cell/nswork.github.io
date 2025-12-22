// 1. 지점장 명단 (실제 성함 유지)
const managerList = [
    { branch: "대전동지점", name: "이승삼", required: 17, unused: 17 },
    { branch: "대전서지점", name: "김학형", required: 17, unused: 17 },
    { branch: "천안지점", name: "백운식", required: 17, unused: 17 },
    { branch: "청주지점", name: "윤남수", required: 17, unused: 17 },
    { branch: "평택지점", name: "류희복", required: 17, unused: 17 },
    { branch: "홍성지점", name: "한수하", required: 17, unused: 17 },
    { branch: "충청영업기획", name: "나병운", required: 17, unused: 17 }
];

// 2. 직원 명단 (50명 - 지점명과 이름 정확히 복구)
const staffList = [];
const branches = ["서울", "부산", "대구", "대전", "광주", "인천", "울산", "수원"];
for (let i = 1; i <= 50; i++) {
    staffList.push({
        branch: `${branches[i % branches.length]}${Math.ceil(i/8)}지점`,
        name: `직원${i}`,
        required: 15,
        unused: 15
    });
}

let currentType = 'manager';
const weekends = [1, 3, 4, 10, 11, 17, 18, 24, 25, 31]; // 휴일 날짜 리스트

document.addEventListener('DOMContentLoaded', () => { 
    renderTable('manager'); 
});

function renderTable(type) {
    currentType = type;
    const tbody = document.getElementById('attendance-body');
    tbody.innerHTML = ''; 
    
    const data = (type === 'manager') ? managerList : staffList;
    const savedData = JSON.parse(localStorage.getItem(`attendance_${type}`)) || {};

    data.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        
        let rowHtml = `<td>${person.branch}</td>
                       <td>${person.name}</td>
                       <td id="required-${person.name}">${person.required}</td>
                       <td id="unused-${person.name}">${person.unused}</td>
                       <td id="remaining-${person.name}">${person.unused}</td>
                       <td id="rate-${person.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            const status = savedData[person.name] ? (savedData[person.name][i] || '') : '';
            const statusClass = getStatusClass(status);
            const holidayClass = weekends.includes(i) ? 'weekend' : ''; // 세로 음영 추가
            rowHtml += `<td class="at-cell ${holidayClass} ${statusClass}" data-day="${i}">${status}</td>`;
        }
        
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    
    attachCellEvents();
    updateCounts();
}

function getStatusClass(status) {
    if (status === '휴가' || status === '연차') return 'status-연차';
    if (status.includes('반차') && status !== '반반차') return 'status-반차';
    if (status === '반반차') return 'status-반반차';
    return '';
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
            
            const isWeekend = cell.classList.contains('weekend') ? 'weekend ' : '';
            cell.className = `at-cell ${isWeekend}${getStatusClass(status)}`;
            
            saveData(); // 클릭할 때마다 즉시 저장
            updateCounts();
        };
    });
}

function saveData() {
    const rows = document.querySelectorAll('#attendance-body tr');
    const storageData = {};
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        storageData[name] = {};
        row.querySelectorAll('.at-cell').forEach(cell => {
            storageData[name][cell.getAttribute('data-day')] = cell.innerText;
        });
    });
    localStorage.setItem(`attendance_${currentType}`, JSON.stringify(storageData));
}

function updateCounts() {
    const rows = document.querySelectorAll('#attendance-body tr');
    rows.forEach(row => {
        const name = row.getAttribute('data-person');
        let used = 0;
        row.querySelectorAll('.at-cell').forEach(c => {
            if (c.innerText === '연차' || c.innerText === '휴가') used += 1;
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
            const cell = row.querySelectorAll('.at-cell')[i];
            const txt = cell ? cell.innerText : '';
            if (txt === '연차' || txt === '휴가') hCount += 1;
            else if (txt.includes('반차') && txt !== '반반차') hCount += 0.5;
            else if (txt === '반반차') hCount += 0.25;
        });
        if(holidayFooter[i]) holidayFooter[i].innerText = hCount || '0';
        if(workFooter[i]) workFooter[i].innerText = rows.length - hCount;
    }
}
