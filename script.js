document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            let current = cell.innerText;
            let nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
            let nextStatus = statuses[nextIdx];

            cell.innerText = nextStatus;

            // 디자인용 클래스는 그대로 유지
            cell.classList.remove('status-연차', 'status-반차', 'status-반반차');
            if (nextStatus === '연차') cell.classList.add('status-연차');
            else if (nextStatus.includes('반차') && nextStatus !== '반반차') cell.classList.add('status-반차');
            else if (nextStatus === '반반차') cell.classList.add('status-반반차');

            updateCounts();
        });
    });

    function updateCounts() {
        const rows = document.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const name = row.getAttribute('data-person');
            if (!name) return;

            const allCells = row.querySelectorAll('.at-cell');
            let usedSum = 0;

            // 화면상 휴가 합계 (연차:1, 반차:0.5, 반반차:0.25)
            allCells.forEach(c => {
                const txt = c.innerText;
                if (txt === '연차') usedSum += 1;
                else if (txt.includes('반차') && txt !== '반반차') usedSum += 0.5;
                else if (txt === '반반차') usedSum += 0.25;
            });

            const requiredVal = parseFloat(document.getElementById(`required-${name}`).innerText) || 0;
            const unusedVal = parseFloat(document.getElementById(`unused-${name}`).innerText) || 0;

            // [수정된 수식 적용]
            const remainingVal = unusedVal - usedSum; // 잔여 = 미사용 - 사용량
            const usageRate = requiredVal > 0 ? ((requiredVal - remainingVal) / requiredVal) * 100 : 0; // 사용률 = (필수 - 잔여) / 필수 * 100

            const remainingEl = document.getElementById(`remaining-${name}`);
            const rateEl = document.getElementById(`rate-${name}`);
            
            remainingEl.innerText = Number.isInteger(remainingVal) ? remainingVal : remainingVal.toFixed(2);
            rateEl.innerText = Math.floor(usageRate) + '%';
        });

        // 하단 요약 (디자인 및 위치 동일)
        updateFooterSummary(rows);
    }

    function updateFooterSummary(rows) {
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
});

