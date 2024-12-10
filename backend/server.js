const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const PORT = 3000;
require('dotenv').config();

// Spotify app credentials (set these in .env file)
const CLIENT_ID = process.env.CLIENT_ID;
console.log(process.env.CLIENT_ID);
const CLIENT_SECRET = process.env.CLIENT_SECRET;
console.log(process.env.CLIENT_SECRET);
const REDIRECT_URI = 'http://localhost:3000/callback';

// Spotify Authorization URL
const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&scope=user-read-private%20user-read-email`;

app.use(express.json());


// Middleware to configure sessions
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/login', (req, res) => {
  res.redirect(AUTH_URL); // Redirect user to Spotify login
});

// Callback endpoint
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  // Exchange code for access token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      clientId: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokenData = await tokenResponse.json();
  const { access_token } = tokenData;
  console.log(access_token);
  req.session.access_token = tokenData.access_token;

  const profile = await fetchProfile(access_token);
  console.log(profile);
  res.redirect(`/home`);
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

app.get('/home_user_info', async (req, res) => {

  access_token = req.session.access_token;
  const profile = await fetchProfile(access_token);
  console.log(profile);

  res.json(profile)
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Helper functions
async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}
