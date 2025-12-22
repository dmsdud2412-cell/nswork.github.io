document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('attendance-table');
    const tbody = table.querySelector('tbody');
    const totalDays = 3１; // 1월 총 일수

    // 초기 근태 데이터 정의 (첨부된 이미지 기반)
    // key: [날짜, 근태 종류, 시간(반차/반반차 처리용)]
    const initialData = {
        '김진영': [
            { date: 15, type: '연차', half: false },
            { date: 15, type: '오후반차', half: true },
            { date: 20, type: '휴가', half: false },
            { date: 21, type: '휴가', half: false },
        ],
        '이승심': [],
        '백윤식': [
            { date: 6, type: '반반차', half: false },
            { date: 20, type: '반반차', half: false },
            { date: 21, type: '연차', half: false },
        ],
        '임승수': [
            { date: 13, type: '연차', half: false },
            { date: 14, type: '연차', half: false },
        ],
        '홍화루': [
            { date: 10, type: '연차', half: false },
        ],
        '변수화': [],
        '총괄팀': [
            { date: 6, type: '오후반차', half: false },
            { date: 21, type: '연차', half: false },
            { date: 22, type: '연차', half: false },
        ],
    };

    // 지점장 목록 (데이터 행 순서대로)
    const managers = ['김진영', '이승심', '백윤식', '임승수', '홍화루', '변수화', '총괄팀'];

    // 근태 코드 및 명칭
    const attendanceTypes = ['연차', '오전반차', '오후반차', '반반차', '휴가'];

    // 1. 달력 헤더 자동 생성 (HTML에 이미 있으므로 생략, 데이터 셀만 생성)

    // 2. 근태 데이터 시각화 및 셀 클릭 기능 활성화
    managers.forEach(manager => {
        const rows = Array.from(tbody.querySelectorAll(`[data-person="${manager}"]`));
        if (rows.length === 0) return;

        const mainRow = rows[0];
        const calendarContainer = mainRow.querySelector('.daily-attendance-row') || mainRow;

        // 기존의 span 태그를 제거하고 달력 셀을 재구성
        calendarContainer.innerHTML = '';
        calendarContainer.setAttribute('colspan', totalDays);
        calendarContainer.style.display = 'contents'; // 셀 내부 요소가 테이블 레이아웃을 따르도록

        for (let day = 1; day <= totalDays; day++) {
            const dateCell = document.createElement('td');
            dateCell.classList.add('daily-attendance-cell');
            dateCell.dataset.date = day;
            dateCell.dataset.manager = manager;

            // 데이터 초기화
            const dataEntry = initialData[manager].find(d => d.date === day);
            if (dataEntry) {
                const typeSpan = document.createElement('span');
                typeSpan.classList.add('attendance-type', dataEntry.type);
                typeSpan.textContent = dataEntry.type;
                dateCell.appendChild(typeSpan);
            }

            // 클릭 이벤트 핸들러 추가
            dateCell.addEventListener('click', handleCellClick);
            calendarContainer.appendChild(dateCell);
        }
    });

    // 3. 셀 클릭 시 근태 입력/수정 기능
    function handleCellClick(event) {
        const cell = event.currentTarget;
        const manager = cell.dataset.manager;
        const date = cell.dataset.date;
        const currentType = cell.querySelector('.attendance-type')?.textContent || '';

        // 사용자가 선택할 수 있는 옵션 문자열 생성
        let options = `
            <option value="">(클릭하여 선택)</option>
            <option value=""></option>
            ${attendanceTypes.map(type => `<option value="${type}" ${currentType === type ? 'selected' : ''}>${type}</option>`).join('')}
        `;

        // 셀렉트 박스 생성 및 교체
        const select = document.createElement('select');
        select.innerHTML = options;
        select.style.width = '100%';
        select.style.height = '100%';
        select.style.border = 'none';
        select.style.padding = '0';
        select.style.fontSize = '10px';
        
        // 기존 내용을 제거하고 셀렉트 박스를 추가
        cell.innerHTML = '';
        cell.appendChild(select);

        select.focus();

        // 셀렉트 박스에서 값이 선택되거나 포커스가 벗어날 때 처리
        select.addEventListener('change', () => {
            const newType = select.value;
            updateCell(cell, manager, date, newType);
        });

        select.addEventListener('blur', () => {
            if (cell.contains(select)) {
                updateCell(cell, manager, date, select.value); // 포커스가 벗어날 때도 최종 값 저장
            }
        });
    }

    // 4. 셀 내용 업데이트 및 잔여 연차 재계산
    function updateCell(cell, manager, date, newType) {
        // 셀 내용 업데이트 (Span으로 다시 변경)
        cell.innerHTML = '';
        if (newType) {
            const typeSpan = document.createElement('span');
            typeSpan.classList.add('attendance-type', newType);
            typeSpan.textContent = newType;
            cell.appendChild(typeSpan);
        }
        
        // 클릭 이벤트 리스너 복원
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick);
        
        // 실제 데이터 객체 업데이트 (여기서는 간단히 DOM만 업데이트)
        // 실제 운영 시에는 이 부분에서 서버로 데이터를 전송해야 합니다.

        // 하단 요약 및 연차 잔여 일수 재계산 (구현 필요)
        calculateSummary();
    }

    // 5. 하단 요약 계산 (휴무/근무 인원)
    function calculateSummary() {
        const holidayCountRow = document.getElementById('holiday-count-row');
        const workforceCountRow = document.getElementById('workforce-count-row');
        
        // 초기화 (이전에 계산된 내용 제거)
        holidayCountRow.innerHTML = '';
        workforceCountRow.innerHTML = '';

        for (let day = 1; day <= totalDays; day++) {
            // 해당 날짜의 모든 근태 셀을 찾음
            const dayCells = document.querySelectorAll(`[data-date="${day}"]`);
            let totalHoliday = 0;
            const totalManagers = managers.length;

            dayCells.forEach(cell => {
                const type = cell.querySelector('.attendance-type')?.textContent;
                if (type) {
                    // 연차, 휴가: 1일 휴무
                    if (['연차', '휴가'].includes(type)) {
                        totalHoliday += 1;
                    } 
                    // 반차: 0.5일 휴무
                    else if (['오전반차', '오후반차'].includes(type)) {
                        totalHoliday += 0.5;
                    } 
                    // 반반차: 0.25일 휴무 (임시)
                    else if (type === '반반차') {
                        totalHoliday += 0.25;
                    }
                }
            });

            const totalWork = totalManagers - totalHoliday;

            // 휴무 인원 셀
            const holidayCell = document.createElement('td');
            holidayCell.textContent = totalHoliday;
            holidayCountRow.appendChild(holidayCell);
            
            // 근무 인원 셀
            const workforceCell = document.createElement('td');
            workforceCell.textContent = totalWork;
            workforceCountRow.appendChild(workforceCell);
        }
        
        // 연차 잔여 일수 계산 (구현 필요)
        // 각 지점장의 사용 일수와 잔여 일수를 계산하여 data-annual 셀을 업데이트 해야 합니다.
    }

    // 웹페이지 로드 시 초기 계산 실행
    calculateSummary();

});
