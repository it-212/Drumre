document.getElementById('login').addEventListener('click', () => {
    window.location.href = '/login'; // Redirect to backend login route
  });
  
  // Parse access token from URL
  const hash = window.location.hash;
  if (hash) {
    const token = hash
      .substring(1)
      .split('&')
      .find((item) => item.startsWith('access_token'))
      ?.split('=')[1];
  
    if (token) {
      fetchUserInfo(token);
    }
  }
  
  // Fetch user info from Spotify
  function fetchUserInfo(token) {
    fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        document.getElementById('user-info').innerHTML = `
          <h2>Welcome, ${data.display_name}</h2>
          <p>Email: ${data.email}</p>
          <p>Country: ${data.country}</p>
        `;
      })
      .catch((error) => console.error('Error fetching user info:', error));
  }
  