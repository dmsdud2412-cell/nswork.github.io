document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차'];

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            let current = cell.innerText;
            let nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
            let nextStatus = statuses[nextIdx];

            cell.innerText = nextStatus;

            // 클래스 초기화 후 상태에 맞게 추가
            cell.classList.remove('status-연차', 'status-반차', 'status-반반차');
            
            if (nextStatus === '연차') {
                cell.classList.add('status-연차');
            } else if (nextStatus.includes('반차') && nextStatus !== '반반차') {
                cell.classList.add('status-반차');
            } else if (nextStatus === '반반차') {
                cell.classList.add('status-반반차');
            }

            updateCounts();
        });
    });

    function updateCounts() {
        const rows = document.querySelectorAll('tbody tr');
        const holidayFooter = document.querySelectorAll('#holiday-row td:not(.footer-label)');
        const workFooter = document.querySelectorAll('#work-row td:not(.footer-label)');

        for (let i = 0; i < 31; i++) {
            let hCount = 0;
            rows.forEach(row => {
                const cell = row.querySelectorAll('.at-cell')[i];
                if (!cell) return;
                const txt = cell.innerText;
                if (txt === '연차') hCount += 1;
                else if (txt.includes('반차') && txt !== '반반차') hCount += 0.5;
                else if (txt === '반반차') hCount += 0.25;
            });
            holidayFooter[i].innerText = hCount;
            workFooter[i].innerText = rows.length - hCount;
        }
    }
});
