
const enVars = require('dotenv').config().parsed;
const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const trivialdb = require('trivialdb');
const app = express();
const cookieParser = require('cookie-parser');
const db = trivialdb.db('sessionVars');

//let SplitFactory = require('@splitsoftware/splitio').SplitFactory;
const { create } = require("domain");


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});


    

app.post("/login", (req, res) => {
  const { eventName, splitName } = req.body;
  db.save({
    eventName: eventName,
    splitName: splitName,
  }).then(function (cookieId) {
    res.cookie("SPLIT_BOX_DEMO", cookieId, { maxAge: 900000, httpOnly: true });
    console.log("cookie created successfully");
    res.render("demo",{splitName: splitName, event: eventName, apiKey: enVars.API_KEY} );
  });
});



app.listen(3000, () => {
  console.log("server started on port 3000");
});
