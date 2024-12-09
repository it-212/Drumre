const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

const PORT = 3000;

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

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Login endpoint
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
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokenData = await tokenResponse.json();
  const { access_token } = tokenData;

  res.redirect(`/home.html`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
