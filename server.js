const express = require('express')
const bodyParser = require("body-parser");
const CronJob = require('cron').CronJob;
const request = require('request'); 


// create the express app
var app = express();
app.use(bodyParser.json());

// make the app listen through the port given by Heroku
const port = process.env.PORT;
app.listen(port, function() {
  console.log(`the app is now listening on ${port}`);
});

// using a GET request, display 'Up and Running' to know if the server has deployed correctly
app.get('/', function(req, res){
  res.send('Up and Running!');
});

// using a POST request that will receive the data to make the reminder
app.post('/reminders', function(req, res){
  console.log(req.body);
  var mes = req.body.message;
  var webhook = req.body.webhook;
  var userID = req.body.userID;
  var type = mes.substring(0,3);
  mes = mes.substring(3);
    switch (type.trim()) {
    case "in":
      // stores the info from the message received in variables and sets a reminder
      var match = mes.match("seconds|second|minutes|minute|hours|hour");
      var splitArray = mes.split(match[0]);
      var num = splitArray[0];
      var unit = match[0];
      var remMessage = splitArray[1];
      var timeStamp = req.body.timeStamp;
      setCron(webhook,userID,num,unit,remMessage,timeStamp);
      res.sendStatus(200);
      break;
  
    default:
      res.sendStatus(500);
      break;
  }
  
});

// Sets the reminder in x seconds/minutes/hours
function setCron(webhook,userID,num,unit,remMessage,timeStamp) {
  console.log("in "+num+" "+unit);
  var date = new Date(timeStamp);
  console.log('Original Date:', date);
  switch (unit) {
    case "second":
    case "seconds":
      date.setSeconds(date.getSeconds()+parseInt(num));
      break;
    case "minute":
    case "minutes":
      date.setMinutes(date.getMinutes()+parseInt(num));
      break;
    case "hour":
    case "hours":
      date.setHours(date.getHours()+parseInt(num));
      break;
    default:
      break;
  }
  console.log('Reminder Date:', date);
  const job = new CronJob(date, function() {
    console.log('onTick at:', new Date());
    sendRemindertoLine(webhook,userID,remMessage);
  });
  job.start();
}

// Sends the POST request to the client when the reminder is activated
function sendRemindertoLine(webhook, userId, message){
  var options = {
    uri: webhook,
    method: 'POST',
    json: true,
    body: {
      userID: userId,
      message: message
    }
  }; 
  request(options, function (error, response, body) {
    if (!error) {
      console.log('Response from client - '+response.body);
      return "OK";
    }else {
      console.log('Error from the client - \n' + error);
      return "ERROR";
    }
  });
};
