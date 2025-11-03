// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./database/connectDB');
const { router } = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const app = express();

connectDB()                     // security headers
app.use(cors({
  origin: 'http://localhost:5173', // DO NOT use '*'
  credentials: true, // Allow credentials
}));                     // enable CORS
app.use(express.json());              // logging

// app.use(notFoundHandler);

app.use(router)

app.use(errorHandler);

// const url = 'https://api.clickup.com/api/v2/oauth/token';
// const options = {
//   method: 'POST',
//   headers: {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify({
//     client_id: process.env.VITE_CLICKUP_CLIENT_ID,
//     client_secret: process.env.VITE_CLICKUP_CLIENT_SECRET,
//     code: process.env.VITE_CLICKUP_AUTHORISATION_CODE,
//     redirect_uri: 'http://localhost:5173'
//   })
// };
// fetch(url, options)
//   .then(res => res.json())
//   .then(json => console.log(json))
//   .catch(err => console.error(err));
// Make sure to run in Node 18+, or install node-fetch for older versions
// npm install node-fetch if necessary
// import fetch from 'node-fetch'; // Uncomment if using node-fetch in older Node

// const url = 'https://api.clickup.com/api/v2/oauth/token';
// const options = {
//   method: 'POST',
//   headers: {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify({
//     client_id: process.env.VITE_CLICKUP_CLIENT_ID,
//     client_secret: process.env.VITE_CLICKUP_CLIENT_SECRET,
//     code: process.env.VITE_CLICKUP_AUTHORISATION_CODE,
//     redirect_uri: 'http://localhost:5173'
//   })
// };
// fetch(url, options)
//   .then(res => res.json())
//   .then(json => {
//     console.log('OAuth Response:', json);
//     // Save your token securely here!
//   })
//   .catch(err => console.error('Error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in on port ${PORT}`);
});
