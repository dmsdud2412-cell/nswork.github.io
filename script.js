document.addEventListener('DOMContentLoaded', () => {
    const totalDays = 31;
    const managers = ['김진영'];

    // 1. 초기화: 모든 행에 31칸씩 생성
    function init() {
        // 지점장 행 생성
        managers.forEach(name => {
            const rowContainers = document.querySelectorAll(`tr[data-person="${name}"] .daily-attendance-row, tr[data-person="${name}"] + tr .sub-row`);
            rowContainers.forEach(container => {
                const table = document.createElement('table');
                const tr = document.createElement('tr');
                for (let i = 1; i <= totalDays; i++) {
                    const td = document.createElement('td');
                    td.classList.add('cell-' + i);
                    td.addEventListener('click', () => {
                        const types = ['', '연차', '오전반차', '오후반차', '반반차'];
                        let idx = types.indexOf(td.innerText);
                        td.innerText = types[(idx + 1) % types.length];
                        updateSummary();
                    });
                    tr.appendChild(td);
                }
                table.appendChild(tr);
                container.appendChild(table);
            });
        });

        // 하단 요약행 31칸 생성
        ['holiday-count-row-parent', 'workforce-count-row-parent'].forEach(id => {
            const parent = document.getElementById(id);
            const td = document.createElement('td');
            td.setAttribute('colspan', '31');
            const table = document.createElement('table');
            table.classList.add('summary-row-table');
            const tr = document.createElement('tr');
            for (let i = 1; i <= totalDays; i++) {
                const innerTd = document.createElement('td');
                innerTd.id = id + '-' + i;
                innerTd.innerText = '0';
                tr.appendChild(innerTd);
            }
            table.appendChild(tr);
            td.appendChild(table);
            parent.appendChild(td);
        });
    }

    function updateSummary() {
        for (let i = 1; i <= totalDays; i++) {
            let holiday = 0;
            // 모든 행의 i번째 날짜 칸을 찾아 계산
            const dayCells = document.querySelectorAll(`.daily-attendance-row td:nth-child(${i}), .sub-row td:nth-child(${i})`);
            dayCells.forEach(cell => {
                if (cell.innerText === '연차') holiday += 1;
                else if (cell.innerText.includes('반차')) holiday += 0.5;
            });
            document.getElementById(`holiday-count-row-parent-${i}`).innerText = holiday;
            document.getElementById(`workforce-count-row-parent-${i}`).innerText = managers.length - holiday;
        }
    }

    init();
});
