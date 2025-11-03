require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/connectDB");
const { router } = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Connect to DB
connectDB();

// ✅ Define allowed origins
const allowedOrigins = [
  "https://www.socialbureau.in",
  "http://localhost:5173", // for local dev
];

// ✅ CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Middlewares
app.use(express.json());
app.use(router);
app.use(errorHandler);

// ✅ Default route (to avoid "Cannot GET /")
app.get("/", (req, res) => {
  res.send("Social Bureau backend is running 🚀");
});

// ✅ Export app (for Vercel)
module.exports = app;
