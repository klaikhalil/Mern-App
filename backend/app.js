const express = require("express");
const connectToDb = require("./config/connectToDb");
require("dotenv").config();

// connection to db
connectToDb();

// init app
const app = express();

// middlewares
app.use(express.json());

// running the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`server is running in ${process.env.NODE_ENV} mode on port ${PORT}`));
