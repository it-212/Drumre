const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
// const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const PORT = 3000;
const MONGODB_PORT = 27017;
require('dotenv').config();

// Spotify app credentials (set these in .env file)
const CLIENT_ID = process.env.CLIENT_ID;
console.log(process.env.CLIENT_ID);
const CLIENT_SECRET = process.env.CLIENT_SECRET;
console.log(process.env.CLIENT_SECRET);
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
console.log(process.env.TICKETMASTER_API_KEY);

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

// MongoDB connection URI and client
const uri = `mongodb://localhost:${MONGODB_PORT}`;
const client = new MongoClient(uri);
let db;

// Connect to MongoDB
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db('drumre'); 
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });

fetchTicketmasterInfo();

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

  res.redirect(`/home`);
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

app.get('/api-info', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/api.html'));
});

app.get('/home_user_info', async (req, res) => {

  access_token = req.session.access_token;
  const profile = await fetchProfile(access_token);
  console.log(profile);

  try {
    const collection = db.collection('users');
    const data = profile; 
    const existingUser = await collection.findOne({ id: profile.id });
    if (!existingUser) {
      const result = await collection.insertOne(profile);
      console.log("User data saved to database");
    } else {
      console.log("User already exists in the database");
    }
    res.json(profile)
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ message: 'Failed to save data' });
  }

  
});

app.get('/api/data', async (req, res) => {
  const data = await db.collection('globalData').find().toArray();
  res.json(data);
});

app.delete('/api/data/:id', async (req, res) => {
  const id = req.params.id;
  await db.collection('globalData').deleteOne({ _id: new ObjectId(id) });
  res.status(200).send('Deleted');
});



app.get('/ticketmaster/concerts', async (req, res) => {
  // const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&size=200`;
  try {
    const ticketmasterCollection = db.collection('ticketmaster');
    const info = await ticketmasterCollection.find().toArray();
    res.json(info);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error });
  }
});


async function fetchTicketmasterInfo(){
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&size=200`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    if (data._embedded && data._embedded.events) {
      const ticketmasterCollection = db.collection('ticketmaster');
      for (const event of data._embedded.events) {
        const concert = {
          name: event.name,
          date: event.dates.start.localDate,
          time: event.dates.start.localTime,
          venue: event._embedded.venues[0].name,
          location: event._embedded.venues[0].city.name,
          url: event.url,
        };

        // Check if the concert already exists in the database based on the unique properties
        const existingConcert = await ticketmasterCollection.findOne({ name: concert.name, date: concert.date, venue: concert.venue });

        if (!existingConcert) {
          // If the concert doesn't exist, insert it into the database
          await ticketmasterCollection.insertOne(concert);
          console.log(`Inserted concert: ${concert.name} at ${concert.venue}`);
        } else {
          console.log(`Concert already exists: ${concert.name} at ${concert.venue}`);
        }
      }

    } else {
      res.status(404).json({ message: 'No concerts found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error });
  }
}

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
