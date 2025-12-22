document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.at-cell');
    // 요청하신 순서: 빈칸, 휴가, 연차, 오전반차, 오후반차, 반반차, 출장
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            let current = cell.innerText;
            let nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
            let nextStatus = statuses[nextIdx];

            cell.innerText = nextStatus;

            // 기존 색상 클래스 제거
            cell.classList.remove('status-휴가', 'status-연차', 'status-반차', 'status-반반차');
            
            // 색상 부여 (휴가와 연차는 동일한 CSS 클래스 적용 가능하도록 설정)
            if (nextStatus === '휴가') cell.classList.add('status-휴가');
            else if (nextStatus === '연차') cell.classList.add('status-연차');
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

            allCells.forEach(c => {
                const txt = c.innerText;
                // 계산 점수: 연차만 1점, 반차 0.5점, 반반차 0.25점 (휴가/출장은 0점 유지)
                if (txt === '연차') usedSum += 1;
                else if (txt.includes('반차') && txt !== '반반차') usedSum += 0.5;
                else if (txt === '반반차') usedSum += 0.25;
            });

            const requiredVal = parseFloat(document.getElementById(`required-${name}`).innerText) || 0;
            const unusedVal = parseFloat(document.getElementById(`unused-${name}`).innerText) || 0;

            const remainingVal = unusedVal - usedSum;
            // 사용률 수식: (필수 - 잔여) / 필수 * 100
            const usageRate = requiredVal > 0 ? ((requiredVal - remainingVal) / requiredVal) * 100 : 0;

            const remainingEl = document.getElementById(`remaining-${name}`);
            const rateEl = document.getElementById(`rate-${name}`);
            
            remainingEl.innerText = Number.isInteger(remainingVal) ? remainingVal : remainingVal.toFixed(2);
            rateEl.innerText = Math.floor(usageRate) + '%';
        });

        // 하단 인원 합계 업데이트
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
