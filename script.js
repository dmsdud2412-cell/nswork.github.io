document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '연차', '오전반차', '오후반차', '반반차'];

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            let current = cell.innerText;
            let nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
            let nextStatus = statuses[nextIdx];

            cell.innerText = nextStatus;

            // 디자인 클래스 유지
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

            // 1. 화면에 입력된 휴가 값 합산
            allCells.forEach(c => {
                const txt = c.innerText;
                if (txt === '연차') usedSum += 1;
                else if (txt.includes('반차') && txt !== '반반차') usedSum += 0.5;
                else if (txt === '반반차') usedSum += 0.25;
            });

            // 2. 필수 및 미사용 고정값 가져오기
            const requiredEl = document.getElementById(`required-${name}`);
            const unusedEl = document.getElementById(`unused-${name}`);
            const requiredVal = parseFloat(requiredEl.innerText) || 0;
            const unusedVal = parseFloat(unusedEl.innerText) || 0;

            // 3. 요청하신 수식 적용
            // 잔여 = 미사용 - 휴가합계
            const remainingVal = unusedVal - usedSum;
            // 사용률 = 잔여 / 필수 * 100
            const usageRate = requiredVal > 0 ? (remainingVal / requiredVal) * 100 : 0;

            // 4. 결과 출력 (잔여가 소수점이면 소수점 표시)
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
