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

const allowedOrigins = "https://www.socialbureau.in";



app.use(cors({

    origin: allowedOrigins, 

    credentials: true, 

}));



app.use(express.json());

app.use(cookieParser())

app.use(

    session({

        secret:"secret",

        resave:false,

        saveUninitialized:true

    })

)

app.use(router)

app.use(errorHandler)