document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차'];

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            let current = cell.innerText;
            let nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
            let nextStatus = statuses[nextIdx];

            // 텍스트 변경
            cell.innerText = nextStatus;

            // 클래스 변경으로 색상 적용
            cell.className = 'at-cell'; // 초기화
            if (nextStatus === '연차') cell.classList.add('status-연차');
            else if (nextStatus.includes('반차')) cell.classList.add('status-반차');
            else if (nextStatus === '반반차') cell.classList.add('status-반반차');

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
                let cellText = row.querySelectorAll('.at-cell')[i].innerText;
                if (cellText === '연차') hCount += 1;
                else if (cellText.includes('반차')) hCount += 0.5;
                else if (cellText === '반반차') hCount += 0.25;
            });
            holidayFooter[i].innerText = hCount;
            workFooter[i].innerText = rows.length - hCount;
        }
    }
});
