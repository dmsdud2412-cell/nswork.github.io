document.addEventListener('DOMContentLoaded', () => {
    const totalDays = 31;
    const managers = ['김진영']; // 관리할 지점장 이름 리스트

    // 1. 달력 칸 및 요약 칸 초기화
    function init() {
        // 지점장별 날짜 칸 생성
        managers.forEach(name => {
            const rows = document.querySelectorAll(`tr[data-person="${name}"] .daily-attendance-row, tr[data-person="${name}"] + tr .sub-row`);
            rows.forEach(row => {
                const innerTable = document.createElement('table');
                const tr = document.createElement('tr');
                for (let i = 1; i <= totalDays; i++) {
                    const td = document.createElement('td');
                    td.classList.add('attendance-cell');
                    td.dataset.date = i;
                    td.addEventListener('click', () => handleSelect(td));
                    tr.appendChild(td);
                }
                innerTable.appendChild(tr);
                row.appendChild(innerTable);
            });
        });

        // 하단 요약 칸 생성
        ['holiday-count-row', 'workforce-count-row'].forEach(id => {
            const container = document.getElementById(id);
            const innerTable = document.createElement('table');
            const tr = document.createElement('tr');
            for (let i = 1; i <= totalDays; i++) {
                const td = document.createElement('td');
                td.id = `${id}-${i}`;
                td.innerText = '0';
                tr.appendChild(td);
            }
            innerTable.appendChild(tr);
            container.appendChild(innerTable);
        });
        updateSummary();
    }

    function handleSelect(cell) {
        const types = ['', '연차', '오전반차', '오후반차', '반반차', '휴가'];
        let current = types.indexOf(cell.innerText);
        let next = (current + 1) % types.length;
        cell.innerText = types[next];
        
        // 색상 적용
        cell.style.backgroundColor = '';
        if (['연차', '휴가'].includes(types[next])) cell.style.backgroundColor = '#ffcccc';
        else if (types[next].includes('반차')) cell.style.backgroundColor = '#fffac2';
        
        updateSummary();
    }

    function updateSummary() {
        for (let i = 1; i <= totalDays; i++) {
            let holidayCount = 0;
            const dayCells = document.querySelectorAll(`.attendance-cell[data-date="${i}"]`);
            dayCells.forEach(c => {
                if (['연차', '휴가'].includes(c.innerText)) holidayCount += 1;
                else if (c.innerText.includes('반차')) holidayCount += 0.5;
                else if (c.innerText === '반반차') holidayCount += 0.25;
            });
            document.getElementById(`holiday-count-row-${i}`).innerText = holidayCount;
            document.getElementById(`workforce-count-row-${i}`).innerText = managers.length - holidayCount;
        }
    }

    init();
});
