// Initialize values
document.addEventListener("DOMContentLoaded", () => {
    // Get class ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('id');
    
    if (!classId) {
        showError("No class ID provided. Redirecting to class list...");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
        return;
    }
    
    // Fetch class data and student attendance
    fetchClassData(classId);
});

async function fetchClassData(classId) {
    try {
        // First fetch class details
        const classResponse = await fetch(`${API_URL}/classes/${classId}`);
        if (!classResponse.ok) {
            throw new Error("Failed to load class data");
        }
        const classData = await classResponse.json();
        
        // Update header information
        document.getElementById("session").innerHTML = classData.session;
        document.getElementById("class").innerHTML = classData.name;
        document.getElementById("atdcnt").value = 1;
        
        // Then fetch attendance data for this class
        fetchAttendanceData(classId, classData);
    } catch (error) {
        console.error("Error:", error);
        showError("Failed to load class data");
    }
}

async function fetchAttendanceData(classId, classData) {
    try {
        // Fetch attendance records for this class
        const attendanceResponse = await fetch(`${API_URL}/classes/${classId}/attendance`);
        if (!attendanceResponse.ok) {
            throw new Error("Failed to load attendance data");
        }
        
        const attendanceData = await attendanceResponse.json();
        
        // If we have attendance records, use the most recent one to populate the student list
        if (attendanceData && attendanceData.length > 0) {
            const latestAttendance = attendanceData[0]; // The first one should be the most recent
            populateTable(latestAttendance.students);
        } else {
            // If no attendance records yet, fetch students from the session
            fetchStudentsFromSession(classData.session);
        }
    } catch (error) {
        console.error("Error:", error);
        showError("Failed to load attendance data");
    }
}

async function fetchStudentsFromSession(sessionName) {
    try {
        const response = await fetch(`${API_URL}/sessions/${sessionName}`);
        if (!response.ok) {
            throw new Error("Failed to load student data from session");
        }
        
        const sessionData = await response.json();
        
        if (sessionData && sessionData.students && sessionData.students.length > 0) {
            populateTable(sessionData.students);
        } else {
            showError("No students found in this session");
        }
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
        idCell.textContent = student.studentId;
        row.appendChild(idCell);

        // Checkbox
        const checkboxCell = document.createElement("td");
        checkboxCell.classList.add("tcell");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.id = student.studentId;
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        tableBody.appendChild(row);
    });

    setupCellClickHandlers();
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

document.getElementById('submit').addEventListener('click', async () => {
    const date = document.getElementById('date').value;
    if (!date) {
        showError('Please select a date');
        return;
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('id');
        
        // First get class data to ensure we have the right info
        const classResponse = await fetch(`${API_URL}/classes/${classId}`);
        if (!classResponse.ok) {
            throw new Error("Failed to load class data");
        }
        const classData = await classResponse.json();
        
        const attendanceData = {
            date: date,
            className: classData.name,
            session: classData.session,
            students: []
        };
        const atndce = document.getElementById("atdcnt").value;
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            const row = checkbox.closest('tr');
            attendanceData.students.push({
                studentId: checkbox.dataset.id,
                name: row.children[1].textContent,
                status: checkbox.checked ? 1 * atndce : 3 // Use 3 for absent as per your model
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

        // Reset the date input and checkbox after submission
        document.getElementById('date').value = ''; // Reset date input field
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false; // Uncheck all checkboxes
        });
        document.getElementById("atdcnt").value = 1; // Reset attendance count to default
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to save attendance');
    }
});

document.getElementById('see_all').addEventListener('click', async () => {
    const section = document.querySelector('#attendance-summary-section');
    section.innerHTML = ''; // Clear existing content

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('id');
        
        const response = await fetch(`${API_URL}/classes/${classId}/attendance`);
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
                        attendanceCount: 0,
                        totalCount: 0
                    };
                }
                studentAttendance[student.studentId].totalCount++;
                if (student.status !== 3) { // If not absent (status 3)
                    studentAttendance[student.studentId].attendanceCount += student.status;
                }
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
                const status = student ? (student.status === 3 ? 'Absent' : student.status) : 'N/A';
                row.innerHTML += `<td>${status}</td>`;
            });

            // Calculate and add percentage
            const attendancePercentage = (data.attendanceCount / attendanceData.length * 100).toFixed(2);
            row.innerHTML += `<td>${attendancePercentage}%</td>`;

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
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('id');
        
        // Fetch attendance data for this specific class
        const response = await fetch(`${API_URL}/classes/${classId}/attendance`);
        if (!response.ok) {
            throw new Error('Failed to fetch attendance data');
        }
        
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
                studentRecord.attendance[attendance.date] = student.status;
            });
        });

        // Prepare CSV content
        let csvContent = "Name, " + allAttendanceData.map(att => new Date(att.date).toLocaleDateString()).join(", ") + ", Percentage\n";

        // Add student rows
        studentData.forEach(student => {
            let row = student.name;
            let totalClasses = allAttendanceData.length;
            let presentCount = 0;

            // Add attendance status for each date
            allAttendanceData.forEach(attendance => {
                const status = student.attendance[attendance.date] || 3; // Default to 3 (Absent) if no status found
                if (status !== 3) presentCount++; // Count as present if not absent
                row += `, ${status === 3 ? 'Absent' : status}`;
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
    } catch (error) {
        console.error('Error generating CSV:', error);
        alert('Failed to generate CSV: ' + error.message);
    }
});

// Reset button functionality
document.getElementById('reset').addEventListener('click', () => {
    document.getElementById('date').value = '';
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById("atdcnt").value = 1;
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

const API_URL = 'http://localhost:3000/api';