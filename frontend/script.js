window.onload = function () {
    const classTable = document.getElementById('classTable');
    const classes = JSON.parse(localStorage.getItem('classes') || '[]');
    classes.forEach((cls, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${i + 1}</td><td>${cls.name}</td><td>${cls.session}</td>
      <td><a href="class.html?id=${cls.id}">Take Attendance</a></td>`;
      classTable.appendChild(row);
    });
  };