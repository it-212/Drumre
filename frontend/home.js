document.getElementById("apiInfoButton").addEventListener("click", function () {
  window.location.href = "/api-info";
});

fetch('/home_user_info')
  .then((response) => response.json())
  .then((data) => {
    document.getElementById('user-info').innerHTML = `
      <h2>Welcome, ${data.display_name}</h2>
      <p>Email: ${data.email}</p>
      <p>Country: ${data.country}</p>
    `;
  })
  .catch((error) => console.error('Error fetching user info:', error));
  