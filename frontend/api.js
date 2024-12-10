// Fetch API data
//   fetch('/api/data')
//     .then((response) => response.json())
//     .then((data) => {
//       renderData(data);
//     });

    fetch('/api/concerts?location=Zagreb')
    .then((response) => response.json())
    .then((concerts) => renderData(concerts));

  // Function to render data in a table
  function renderData(data) {
    const table = document.getElementById('dataTable');
    table.innerHTML = '';
    data.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.location}</td>
        <td>${item.date}</td>
        <td>
          <button onclick="deleteData('${item._id}')">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
  }

  // Delete data
  function deleteData(id) {
    fetch(`/api/data/${id}`, { method: 'DELETE' })
      .then(() => alert('Deleted successfully'))
      .then(() => location.reload());
  }