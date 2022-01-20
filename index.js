
const enVars = require('dotenv').config().parsed;
const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const trivialdb = require('trivialdb');
const app = express();
const cookieParser = require('cookie-parser');
const db = trivialdb.db('sessionVars');

let SplitFactory = require('@splitsoftware/splitio').SplitFactory;
const { create } = require("domain");


function createTableData() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split('');
    const account = [
    ["Nike", "Nike", "Nike", "Apple", "Apple", "Apple", "LinkedIn", "Best Buy", "Best Buy", "Best Buy"],
    ["Nike", "Nike", "Nike", "Apple", "Apple", "Apple", "LinkedIn", "Best Buy", "Best Buy", "Best Buy"],
    ["Nike", "Nike", "Nike", "Apple", "Apple", "Apple", "LinkedIn", "Best Buy", "Best Buy", "Best Buy"],
    ["Google", "Google", "Google", "Microsoft", "Microsoft", "Microsoft", "Microsoft", "Best Buy", "Best Buy", "Best Buy"],
    ["Google", "Google", "Google", "Microsoft", "Microsoft", "Microsoft", "Microsoft", "Pintrest", "Pintrest", "Pintrest"],
    ["Google", "Google", "Google", "Microsoft", "Microsoft", "Microsoft", "Microsoft", "Pintrest", "Pintrest", "Pintrest"],
    ["Dell", "Dell", "Dell", "Microsoft", "Microsoft", "Microsoft", "Microsoft", "Pintrest", "Pintrest", "Pintrest"],
    ["Zoom", "Zoom", "Zoom", "Slack", "Slack", "Slack", "Samsung", "Disney", "Disney", "Disney"],
    ["Zoom", "Zoom", "Zoom", "Slack", "Slack", "Slack", "Samsung", "Disney", "Disney", "Disney"],
    ["Zoom", "Zoom", "Zoom", "Slack", "Slack", "Slack", "Samsung", "Disney", "Disney", "Disney"]
]; // theoretically you could expand this table if you wanted. It would be a non-trivial exercise to get realistic clusters like this though
    let table = [];
    for (let i = 0; i < 10; i += 1) {
        table.push([]);
        for (let j = 0; j < 10; j += 1 ) {
            table[i][j] = {user: alphabet[i]+j, account: account[i][j]}
        }
    }
    return table;
}

const table = createTableData();

function buildTable(table, splitClient, splitName, eventName) {
    let htmlString = '';
    for(let rowIdx = 0; rowIdx < table.length; rowIdx += 1) {
        htmlString += "<tr>";
        let row = table[rowIdx];
        for(let colIdx = 0; colIdx < row.length; colIdx += 1) {
            let rowElem = row[colIdx];
            let attributes = {
				row: rowElem.user.charAt(0),
				col: rowElem.user.charAt(1),
				userid: rowElem.user,
				account: rowElem.account
			}
            let splitResult = splitClient.getTreatmentWithConfig(rowElem.user, splitName, attributes);
            let configs = {
                            popup_value: '',
                            popup_message: 'coming soon',
                            font_size: 'medium'
                        }; // set default configs
            
            if(splitResult.config) {
                configs = JSON.parse(splitResult.config); //overide with configs from treatment
            }
            let treatmentColor;
            switch(splitResult.treatment) {
                case "standard":
                    treatmentColor = "rgb(255, 70, 82);";
                    break;
                case "premium":
                    treatmentColor = "rgb(0, 124, 156);";
                    break;
                case "current":
                    treatmentColor = "rgb(173, 193, 116);";
                    break;
                default:
                    treatmentColor = "red;";
                    break;
            }
            htmlString += `<td style="font-size:${configs.font_size}; color:white; width:40px; height:40px; text-align:center; background-color:${treatmentColor}" `;
            htmlString += `onclick= "createPopup({user:'${rowElem.user}', message:'${configs.popup_message}', eventName:'${eventName}', treatment:'${splitResult.treatment}', value:'${configs.popup_value}' })">${rowElem.user}</td>`;
        }
        htmlString += "</tr>";    
    }
    
    

    return htmlString
}


function createFactoryArgs(debug) {
return {
    startup: {
        requestTimeoutBeforeReady: 0.8, // 800ms
        retriesOnFailureBeforeReady: 1, // 1 sec
        readyTimeout: 1.5, // 1.5 sec
        eventsFirstPushWindow: 10 // 10 sec
    },
    core: {
        authorizationKey: enVars.API_KEY,
        trafficType: 'user',
        labelsEnabled: true
    },
    scheduler: {
        featuresRefreshRate: 1, // 30 sec 
        segmentsRefreshRate: 60, // 60 sec 
        metricsRefreshRate: 60, // 60 sec
        impressionsRefreshRate: 60, // 60 sec
        eventsPushRate: 60, // 60 sec
        eventsQueueSize: 500 // 500 items
    },
    streamingEnabled: true,
    debug: debug
    }
}

// not checking for rediness here, instead we will check when we call getTreatment
const splitClient = SplitFactory(createFactoryArgs(false)).client();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});


    app.get("/boxStream", (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders(); // flush the headers to establish SSE with client
      let cookie = req.cookies.SPLIT_BOX_DEMO; // get the split name and the event name from the cookie reference

      db.load(cookie, "default").then(function (val) {
        if (val == "default") {
          console.error("failed reading cookie for updating the boxes");
        }
        // send heartbeat   
        const interval = 60000;
        let intervalId = setInterval(function() {
          res.write(`:\n\n`);
        }, interval);


        // send if ready 
        // (since the SDK client is created upon server startup we expect this to be ready rather than polling for the SDK_READY event which likely already was fired by the time we get here)
        splitClient.ready().then(() => {
          res.write(
            `data: ${buildTable(
              table,
              splitClient,
              val.splitName,
              val.eventName
            )}\n\n`
          );


        // update upon SDK_UPDATE, no polling or refresh needed!
        splitClient.on(splitClient.Event.SDK_UPDATE, () => {
          res.write(
            `data: ${buildTable(
              table,
              splitClient,
              val.splitName,
              val.eventName
            )}\n\n`
          );
        });
        res.write()
        // If client closes connection, stop sending events
        res.on("close", () => {
          console.log("client dropped");
          res.end();
        });



        });


      });
    });


app.post("/login", (req, res) => {
  const { eventName, splitName } = req.body;
  db.save({
    eventName: eventName,
    splitName: splitName,
  }).then(function (cookieId) {
    res.cookie("SPLIT_BOX_DEMO", cookieId, { maxAge: 900000, httpOnly: true });
    console.log("cookie created successfully");
    res.render("demo",{} );
  });
});

  app.post("/track", function (req, res) {
    const { user, eventName, value, treatment } = req.body;
    let trackResult = splitClient.track(
      user,
      "user",
      eventName,
      parseFloat(value),
      { treatment_string: treatment }
    );
    trackResult
      ? console.log("tracked successfully on the server")
      : console.log("tracking failed on the server");
    res.sendStatus(200);
  });


app.listen(3000, () => {
  console.log("server started on port 3000");
});