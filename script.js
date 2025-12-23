// ... (상단 로직 동일)

function renderTable(attendance) {
    // ... (상단 날짜 생성 로직 동일)

    // [비고 헤더] 클래스 추가
    const noteTh = document.createElement('th');
    noteTh.innerText = "비고";
    noteTh.className = 'col-note'; 
    dateRow.appendChild(noteTh);
    weekRow.appendChild(document.createElement('th'));
    holidayRow.appendChild(document.createElement('th'));
    vRow.insertCell(-1); wRow.insertCell(-1);

    const list = (currentType === 'manager') ? masterData.manager : masterData.staff;
    list.forEach(p => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-person', p.name);
        tr.innerHTML = `<td>${p.branch}</td><td>${p.name}</td><td>${p.req}</td><td>${p.unused}</td><td id="rem-${p.name}">${p.unused}</td><td id="rate-${p.name}">0%</td>`;
        
        for (let i = 1; i <= 31; i++) {
            // ... (날짜 td 생성 로직 동일)
            const dateObj = new Date(2026, currentMonth - 1, i);
            const isExist = dateObj.getMonth() === currentMonth - 1;
            const td = document.createElement('td');
            td.className = 'at-cell col-day';
            if (isExist) {
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidayInfo[i]) td.classList.add('bg-pink');
                const match = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == i);
                const status = (match && match[4]) ? match[4] : "";
                td.innerText = status;
                if(status) applyStatusColor(td, status);
                td.setAttribute('data-day', i);
                td.onclick = function() { showDropdown(this); };
            }
            tr.appendChild(td);
        }

        // [비고 데이터 칸] 클래스 추가
        const noteTd = document.createElement('td');
        const noteMatch = attendance.find(r => r[0] == currentMonth && r[1] == currentType && r[2] == p.name && r[3] == 32);
        const noteValue = noteMatch ? noteMatch[4] : "";
        
        noteTd.className = 'col-note';
        noteTd.style.textAlign = "left";
        noteTd.style.padding = "0 8px";

        noteTd.innerHTML = `<input type="text" value="${noteValue}" 
            style="width: 100%; border:none; background:transparent; font-size:11px; outline:none; font-family:inherit;" 
            placeholder="입력">`;
        
        const input = noteTd.querySelector('input');
        input.onchange = function() {
            saveData(currentMonth, currentType, p.name, 32, this.value);
        };
        tr.appendChild(noteTd);
        tbody.appendChild(tr);
    });
    updateCounts();
}

// ... (이하 나머지 함수들 동일)
