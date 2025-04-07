// Initialize values
document.getElementById("session").innerHTML = "2021-22";
document.getElementById("class").innerHTML = "Operating System";
document.getElementById("atdcnt").value = 1;

const API_URL = 'http://localhost:3000/api';

async function fetchStudentData() {
    try {
        const response = await fetch("data/students.json");
        if (!response.ok) {
            throw new Error("Failed to load student data");
        }
        const students = await response.json();
        populateTable(students);
    } catch (error) {
        console.error("Error:", error);
        showError("Failed to load student data");
    }
}

function populateTable(students) {
    const tableBody = document.getElementById("attendanceTable");
    tableBody.innerHTML = "";
    let serialNo = 0;

    students.forEach(student => {
        const row = document.createElement("tr");
        
        // Serial number
        const sCell = document.createElement("td");
        serialNo++;
        sCell.textContent = serialNo;
        row.appendChild(sCell);

        // Name
        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;
        row.appendChild(nameCell);

        // ID
        const idCell = document.createElement("td");
        idCell.textContent = student.id;
        row.appendChild(idCell);

        // Checkbox
        const checkboxCell = document.createElement("td");
        checkboxCell.classList.add("tcell");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.id = student.id;
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        // Percentage
        // const percentageCell = document.createElement("td");
        // percentageCell.textContent = "100%";
        // percentageCell.dataset.id = student.id;
        // row.appendChild(percentageCell);

        tableBody.appendChild(row);
    });

    setupCellClickHandlers();
    // updateAttendanceCount();
}

function setupCellClickHandlers() {
    document.querySelectorAll(".tcell").forEach(cell => {
        cell.addEventListener("click", function (e) {
            const checkbox = cell.querySelector("input[type='checkbox']");
            if (e.target.tagName !== "INPUT" && checkbox) {
                checkbox.checked = !checkbox.checked;
            }
        });
    });
}

function updateAttendanceCount() {
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked').length;
    document.getElementById("atdcnt").value = checkedBoxes;
}

// document.getElementById('submit').addEventListener('click', async () => {
//     const date = document.getElementById('date').value;
//     if (!date) {
//         showError('Please select a date');
//         return;
//     }

//     try {
//         const attendanceData = {
//             date: date,
//             className: document.getElementById("class").innerHTML,
//             session: document.getElementById("session").innerHTML,
//             students: []
//         };
//         const atndce = document.getElementById("atdcnt").value;
//         document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
//             const row = checkbox.closest('tr');
//             attendanceData.students.push({
//                 studentId: checkbox.dataset.id,
//                 name: row.children[1].textContent,
//                 status: checkbox.checked ? 1 * atndce : 0
//             });
//         });

//         const response = await fetch(`${API_URL}/attendance`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(attendanceData)
//         });

//         // if (!response.ok) throw new Error('Failed to save attendance');

//         const result = await response.json();
//         showSuccess(result.message);
//         await fetchAndUpdatePercentages();

//         // Reset all fields
//         document.getElementById('date').value = ''; // Reset date input field
//         document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
//             checkbox.checked = false; // Uncheck all checkboxes
//         });
//         document.getElementById("atdcnt").value = 1;
//     } catch (error) {
//         console.error('Error:', error);
//         // showError('Failed to save attendance');
//     }
// });

document.getElementById('submit').addEventListener('click', async () => {
    const date = document.getElementById('date').value;
    if (!date) {
        showError('Please select a date');
        return;
    }

    try {
        const attendanceData = {
            date: date,
            className: document.getElementById("class").innerHTML,
            session: document.getElementById("session").innerHTML,
            students: []
        };
        const atndce = document.getElementById("atdcnt").value;
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            const row = checkbox.closest('tr');
            attendanceData.students.push({
                studentId: checkbox.dataset.id,
                name: row.children[1].textContent,
                status: checkbox.checked ? 1 * atndce : 0
            });
        });

        const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendanceData)
        });

        if (!response.ok) throw new Error('Failed to save attendance');

        const result = await response.json();
        showSuccess(result.message);
        await fetchAndUpdatePercentages();

        // Reset the date input and checkbox after submission
        document.getElementById('date').value = ''; // Reset date input field
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false; // Uncheck all checkboxes
        });
        document.getElementById("atdcnt").value = 1; // Reset attendance count to default
        
    } catch (error) {
        console.error('Error:', error);
        // showError('Failed to save attendance');
    }
    location.reload();
});

function showSuccess(message) {
    const successDiv = document.querySelector('.success-message') || 
        createMessageElement('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 3000);
}

function showError(message) {
    const errorDiv = document.querySelector('.error-message') || 
        createMessageElement('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 3000);
}

function createMessageElement(className) {
    const div = document.createElement('div');
    div.className = className;
    document.body.insertBefore(div, document.body.firstChild);
    return div;
}

document.addEventListener("DOMContentLoaded", fetchStudentData);

document.getElementById('see_all').addEventListener('click', async () => {
    const section = document.querySelector('#attendance-summary-section');
    section.innerHTML = ''; // Clear existing content

    try {
        const response = await fetch(`${API_URL}/attendance`);
        if (!response.ok) {
            throw new Error('Failed to fetch attendance data');
        }

        const attendanceData = await response.json();
        if (!attendanceData.length) {
            section.innerHTML = '<p>No attendance data available</p>';
            return;
        }

        // Create a map to store student attendance counts
        const studentAttendance = {};

        // Process attendance data
        attendanceData.forEach(record => {
            record.students.forEach(student => {
                if (!studentAttendance[student.studentId]) {
                    studentAttendance[student.studentId] = {
                        name: student.name,
                        attendanceCount: 0
                    };
                }
                studentAttendance[student.studentId].attendanceCount += student.status;
            });
        });

        // Create the table
        const table = document.createElement('table');
        table.classList.add('summary-table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Name</th>
            ${attendanceData.map(record => `<th>${new Date(record.date).toLocaleDateString()}</th>`).join('')}
            <th>Percentage</th>
        `;
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        // Populate the table rows
        Object.entries(studentAttendance).forEach(([studentId, data]) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${data.name}</td>`;

            // Add attendance for each date
            attendanceData.forEach(record => {
                const student = record.students.find(s => s.studentId === studentId);
                row.innerHTML += `<td>${student ? student.status : 'Absent'}</td>`;
            });

            // Calculate and add percentage
            const percentage = ((data.attendanceCount / 32) * 100).toFixed(2);
            row.innerHTML += `<td>${percentage}%</td>`;

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        section.appendChild(table);

    } catch (error) {
        console.error('Error:', error);
        section.innerHTML = `<p>Error loading data: ${error.message}</p>`;
    }
});

// download as CSV
document.getElementById('seeAllButton').addEventListener('click', async function() {
    // Fetch all attendance data from the backend (you can adjust the URL if needed)
    const response = await fetch(`${API_URL}/attendance`);
    const allAttendanceData = await response.json();

    // Ensure data is available
    if (!allAttendanceData || allAttendanceData.length === 0) {
        alert('No attendance data found.');
        return;
    }

    // Create an array to store student attendance records with all dates
    let studentData = [];

    // Loop through each attendance record to structure the data
    allAttendanceData.forEach(attendance => {
        attendance.students.forEach(student => {
            let studentRecord = studentData.find(record => record.studentId === student.studentId);
            if (!studentRecord) {
                studentRecord = {
                    studentId: student.studentId,
                    name: student.name,
                    attendance: {} // Will store attendance status per date
                };
                studentData.push(studentRecord);
            }

            // Add attendance for this student for the current date
            studentRecord.attendance[attendance.date] = student.status; // Store the actual status value (1 or 0)
        });
    });

    // Prepare CSV content
    let csvContent = "Name, " + allAttendanceData.map(att => att.date).join(", ") + ", Percentage\n";

    // Add student rows
    studentData.forEach(student => {
        let row = student.name;
        let totalClasses = allAttendanceData.length; // Total number of dates available
        let presentCount = 0;

        // Add attendance status for each date (using the actual status from the database)
        allAttendanceData.forEach(attendance => {
            const status = student.attendance[attendance.date] || 0; // Default to 0 (Absent) if no status found
            if (status === 1) presentCount++;
            row += `, ${status}`; // Use the actual status value (1 or 0)
        });

        // Calculate percentage
        const percentage = ((presentCount / totalClasses) * 100).toFixed(2);
        row += `, ${percentage}%`;

        // Append row to CSV content
        csvContent += row + "\n";
    });

    // Download the CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

