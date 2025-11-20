require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/connectDB");
const { router } = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const app = express();

connectDB()

const allowedOrigins = [
  "https://www.socialbureau.in",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || true);        
      } else {
        console.warn("Blocked by CORS:", origin);        
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser())

app.use(
    session({
        secret:"secret",
        resave:false,
        saveUninitialized:true
    })
)

app.use('/', router);
app.use(errorHandler)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));