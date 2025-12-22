document.addEventListener('DOMContentLoaded', () => {
    const totalDays = 31;
    const managers = ['김진영'];

    function createInnerTable(parent) {
        const table = document.createElement('table');
        const tr = document.createElement('tr');
        for (let i = 1; i <= totalDays; i++) {
            const td = document.createElement('td');
            td.dataset.day = i;
            tr.appendChild(td);
        }
        table.appendChild(tr);
        parent.appendChild(table);
        return tr;
    }

    // 메인 데이터 칸 생성
    managers.forEach(name => {
        const mainCell = document.querySelector(`tr[data-person="${name}"] .daily-attendance-row`);
        const subCell = document.querySelector(`tr[data-person="${name}"] + tr .sub-row`);
        
        [mainCell, subCell].forEach(cell => {
            const row = createInnerTable(cell);
            Array.from(row.cells).forEach(td => {
                td.addEventListener('click', () => {
                    const status = ['', '연차', '오전반차', '오후반차', '반반차'];
                    td.innerText = status[(status.indexOf(td.innerText) + 1) % status.length];
                    td.style.background = td.innerText === '연차' ? '#ffcccc' : (td.innerText ? '#fffac2' : '');
                    updateSummary();
                });
            });
        });
    });

    // 하단 요약 칸 생성
    const holidayRow = createInnerTable(document.querySelector('#holiday-count-row-parent .summary-area'));
    const workRow = createInnerTable(document.querySelector('#workforce-count-row-parent .summary-area'));

    function updateSummary() {
        for (let i = 1; i <= totalDays; i++) {
            let count = 0;
            document.querySelectorAll(`.daily-attendance-row td:nth-child(${i}), .sub-row td:nth-child(${i})`).forEach(c => {
                if (c.innerText === '연차') count += 1;
                else if (c.innerText.includes('반차')) count += 0.5;
            });
            holidayRow.cells[i-1].innerText = count;
            workRow.cells[i-1].innerText = managers.length - count;
        }
    }
    updateSummary();
});
