document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('attendance-table');
    const tbody = table.querySelector('tbody');
    const totalDays = 31; // 1월은 31일

    // 1. 지점장 목록 (HTML의 data-person 이름과 똑같아야 합니다)
    const managers = ['김진영', '이승심']; 

    // 2. 근태 종류
    const attendanceTypes = ['연차', '오전반차', '오후반차', '반반차', '휴가'];

    // 3. 달력 셀 생성 및 클릭 이벤트 연결
    function initializeCalendar() {
        managers.forEach(manager => {
            // 해당 지점장의 행을 찾음 (첫 번째 줄)
            const mainRow = tbody.querySelector(`tr[data-person="${manager}"]`);
            if (!mainRow) return;

            // 데이터를 넣을 셀(td)을 찾음
            const calendarCell = mainRow.querySelector('.daily-attendance-row');
            if (!calendarCell) return;

            // 기존 내용을 지우고 31개의 클릭 가능한 칸 생성
            calendarCell.innerHTML = '';
            calendarCell.style.padding = '0'; // 여백 제거

            // 내부 테이블 형태로 칸을 쪼갬
            const innerTable = document.createElement('table');
            innerTable.style.width = '100%';
            innerTable.style.height = '100%';
            innerTable.style.borderCollapse = 'collapse';
            innerTable.style.tableLayout = 'fixed';
            
            const innerRow = document.createElement('tr');

            for (let day = 1; day <= totalDays; day++) {
                const dateCell = document.createElement('td');
                dateCell.style.border = '1px solid #ddd';
                dateCell.style.height = '30px';
                dateCell.style.cursor = 'pointer';
                dateCell.dataset.date = day;
                dateCell.dataset.manager = manager;
                dateCell.classList.add('attendance-cell');

                // 클릭 이벤트 추가
                dateCell.addEventListener('click', (e) => handleCellClick(e.currentTarget));
                
                innerRow.appendChild(dateCell);
            }
            innerTable.appendChild(innerRow);
            calendarCell.appendChild(innerTable);
        });
    }

    // 4. 셀 클릭 시 선택창 띄우기
    function handleCellClick(cell) {
        if (cell.querySelector('select')) return; // 이미 선택창이 떠있으면 무시

        const currentText = cell.innerText;
        const select = document.createElement('select');
        select.style.width = '100%';
        
        const defaultOpt = document.createElement('option');
        defaultOpt.text = '-선택-';
        defaultOpt.value = '';
        select.appendChild(defaultOpt);

        attendanceTypes.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.text = type;
            if(type === currentText) opt.selected = true;
            select.appendChild(opt);
        });

        cell.innerHTML = '';
        cell.appendChild(select);
        select.focus();

        // 선택 완료 시
        select.onchange = () => {
            cell.innerText = select.value;
            applyColor(cell, select.value);
            calculateSummary();
        };

        // 포커스 나갈 때
        select.onblur = () => {
            if (!select.value) cell.innerHTML = '';
            else cell.innerText = select.value;
            applyColor(cell, cell.innerText);
        };
    }

    // 색상 적용 함수
    function applyColor(cell, type) {
        cell.style.backgroundColor = '';
        if (type === '연차' || type === '휴가') cell.style.backgroundColor = '#ffcccc';
        else if (type.includes('반차')) cell.style.backgroundColor = '#fffac2';
        else if (type === '반반차') cell.style.backgroundColor = '#d3f9d3';
    }

    // 5. 하단 요약 계산 (휴무/근무 인원)
    function calculateSummary() {
        const holidayRow = document.getElementById('holiday-count-row');
        const workRow = document.getElementById('workforce-count-row');
        
        if (!holidayRow || !workRow) return;

        holidayRow.innerHTML = '';
        workRow.innerHTML = '';

        for (let day = 1; day <= totalDays; day++) {
            let holidayCount = 0;
            const cells = document.querySelectorAll(`.attendance-cell[data-date="${day}"]`);
            
            cells.forEach(c => {
                const val = c.innerText;
                if (['연차', '휴가'].includes(val)) holidayCount += 1;
                else if (val.includes('반차')) holidayCount += 0.5;
                else if (val === '반반차') holidayCount += 0.25;
            });

            const hTd = document.createElement('td');
            hTd.innerText = holidayCount;
            holidayRow.appendChild(hTd);

            const wTd = document.createElement('td');
            wTd.innerText = managers.length - holidayCount;
            workRow.appendChild(wTd);
        }
    }

    initializeCalendar();
    calculateSummary();
});
