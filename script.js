document.addEventListener('DOMContentLoaded', () => {
    // 1. 50명 임의 명단 데이터 (필수/미사용은 모두 17로 세팅)
    const staffData = [];
    const branches = ["서울", "부산", "대구", "대전", "광주", "인천", "울산", "수원"];
    for (let i = 1; i <= 50; i++) {
        staffData.push({
            branch: `${branches[i % branches.length]}${Math.ceil(i/8)}지점`,
            name: `지점장${i}`,
            required: 17,
            unused: 17
        });
    }

    const tbody = document.getElementById('attendance-body');

    // 2. 표 생성 (디자인을 위해 기존 구조 100% 동일하게 생성)
    staffData.forEach(person => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', person.name);
        
        let rowHtml = `
            <td>${person.branch}</td>
            <td>${person.name}</td>
            <td id="required-${person.name}">${person.required}</td>
            <td id="unused-${person.name}">${person.unused}</td>
            <td id="remaining-${person.name}">${person.unused}</td>
            <td id="rate-${person.name}">0%</td>
        `;
        
        for (let i = 1; i <= 31; i++) {
            rowHtml += `<td class="at-cell"></td>`;
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    // 3. 클릭 이벤트 및 상태 관리
    const cells = document.querySelectorAll('.at-cell');
    const statuses = ['', '휴가', '연차', '오전반차', '오후반차', '반반차', '출장'];

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            let current = cell.innerText;
            let nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
            let nextStatus = statuses[nextIdx];
            cell.innerText = nextStatus;

            cell.classList.remove('status-휴가', 'status-연차', 'status-반차', 'status-반반차');
            if (nextStatus === '휴가') cell.classList.add('status-휴가');
            else if (nextStatus === '연차') cell.classList.add('status-연차');
            else if (nextStatus.includes('반차') && nextStatus !== '반반차') cell.classList.add('status-반차');
            else if (nextStatus === '반반차') cell.classList.add('status-반반차');

            updateCounts();
        });
    });

    // 4. 계산 로직 (수식: (필수-잔여)/필수*100)
    function updateCounts() {
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const name = row.getAttribute('data-person');
            const allCells = row.querySelectorAll('.at-cell');
            let usedSum = 0;

            allCells.forEach(c => {
                const txt = c.innerText;
                if (txt === '연차') usedSum += 1;
                else if (txt.includes('반차') && txt !== '반반차') usedSum += 0.5;
                else if (txt === '반반차') usedSum += 0.25;
            });

            const requiredVal = parseFloat(document.getElementById(`required-${name}`).innerText) || 0;
            const unusedVal = parseFloat(document.getElementById(`unused-${name}`).innerText) || 0;

            const remainingVal = unusedVal - usedSum;
            const usageRate = requiredVal > 0 ? ((requiredVal - remainingVal) / requiredVal) * 100 : 0;

            document.getElementById(`remaining-${name}`).innerText = Number.isInteger(remainingVal) ? remainingVal : remainingVal.toFixed(2);
            document.getElementById(`rate-${name}`).innerText = Math.floor(usageRate) + '%';
        });

        // 하단 요약 업데이트
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
    
    // 초기 근무 인원 설정
    updateCounts();
});
