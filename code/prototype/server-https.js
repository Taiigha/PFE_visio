/*
* Prototype inspired by the following tutorial (20/02/2020):
https://www.tutorialspoint.com/webrtc/webrtc_signaling.htm


* Start the server :
node server.js

* Test with a client on another terminal :
wscat -c localhost:9090

* Example of client command :
{"type":"login", "name":"test"}
{"type":"list"}

* Command "list" has been added for testing purpose showing the list of connected users

*/

var WebSocketServer = require('ws').Server;

//:COMMENT:GOVIN:2020-02-20:Creating the server on the 9090 port
var wss = new WebSocketServer({port: 9090});

console.log("Server started. ")

//:COMMENT:GOVIN:2020-02-20:Will contain the connected users
var users = {};
var server_name = "Server";


function saveTrace(connection, data){
  console.log("Save trace "+connection.username);
  const fs = require('fs')
  var donnees = data.logs
  fs.writeFileSync('logs', donnees)
}


function login(connection, data){
  console.log("User "+data.username+" trying to log... ");


  //:COMMENT:GOVIN:2020-02-20:Refuse connection if username already exists.
  if(users[data.username]) {
    var message = {
                  type: "login",
                  success: false,
                  from: server_name,
                  comment:"Login already used. "
                };
    sendTo(connection, message);
      console.log("User "+data.username+" has failed to log, username already used. ");
    //:TODO:GOVIN:2020-02-20:Add the error message in a log file
  } else {

    //:COMMENT:GOVIN:2020-02-20:Saving the connection of the user in the server memory
    users[data.username] = connection;
    connection.username = data.username;

    var message = {
      type: "login",
      success: true,
      from: server_name,
      to: data.username,
      comment: "Welcome "+connection.username+" !"
    };
    sendTo(connection, message);
      console.log("User "+data.username+" is logged. ");

    //:TODO:GOVIN:2020-02-20:Add the message in a log file
  }
}


function sendOffer(connection, data){

  console.log("Sending offer from "+connection.username+" to: "+data.to);

  var conn = users[data.to];

  if(conn != null) {
    //:TODO:GOVIN:2020-02-20:Manage many connections
    //:COMMENT:GOVIN:2020-02-20:COMMENTARY
    connection.otherName = data.to;

    sendTo(conn, {
      type: "offer",
      offer: data.offer,
      from: connection.username,
      to: data.to
    });

    //:TODO:GOVIN:2020-02-20:Add the message in a log file
  }else{
    //:TODO:GOVIN:2020-02-20:Add the error message in a log file, other_username doesn't exist
  }
}

function answer(connection, data){
  console.log("Sending answer from "+connection.username+" to: "+ data.to);
  //:TODO:GOVIN:2020-02-20:Add the message in a log file

  //:COMMENT:GOVIN:2020-02-20:Connection answer to the other user in data
  var conn = users[data.to];

  if(conn != null) {
    connection.otherName = data.to;
    var message = {
      type: "answer",
      from: connection.username,
      to: data.to,
      answer: data.answer
    }
    sendTo(conn, message);
    //:TODO:GOVIN:2020-02-20:Add the message in a log file
  }else{
    //:TODO:GOVIN:2020-02-20:Add the error message in a log file
  }
}

function leave(connection, data){
  console.log(connection.username+" is disconnecting from "+data.to);
  //:TODO:GOVIN:2020-02-20:Add the message in a log file
  var conn = users[data.to];

  //:COMMENT:GOVIN:2020-02-20:Notify other user to close the peerconnection on his side
  //:TODO:GOVIN:2020-02-20:Manage many users

  if(conn != null) {
    conn.otherName = null;

    var message = {
      type: "leave",
      from: connection.username,
      to: data.to
    };
    sendTo(conn, message);
    //:TODO:GOVIN:2020-02-20:Add the message in a log file
  }else{
    //:TODO:GOVIN:2020-02-20:Add the error message in a log file
  }
}

function sendCandidateTo(connection, data){
  console.log(connection.username+" is sending candidate to : "+data.to);
  //:TODO:GOVIN:2020-02-20:Add the message in a log file
  var conn = users[data.to];

  if(conn != null) {
    var message = {
      type: "candidate",
      from: connection.username,
      to: data.to,
      candidate: data.candidate
    };
    sendTo(conn, message);
    //:TODO:GOVIN:2020-02-20:Add the message in a log file
  }else{
    //:TODO:GOVIN:2020-02-20:Add the error message in a log file
      console.log("Error for : ["+connection.username+ " is sending candidate to : "+data.to+"]");
  }
}

wss.on('connection', function(connection) {

  console.log("Connection incoming... ");
  //:TODO:GOVIN:2020-02-20:Add to log information on the connection

  //:COMMENT:GOVIN:2020-02-20:onmessage event for the connection.
  connection.on('message', function(incoming_message) {

    var data;
    //:COMMENT:GOVIN:2020-02-20:message shall contain {"type":"something"} and shall be in JSON format
    try {
      data = JSON.parse(incoming_message);
      //:TODO:GOVIN:2020-02-20:Add the message in a log file
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
      //:TODO:GOVIN:2020-02-20:Add the error message in a log file
    }

    switch (data.type) {
      //:COMMENT:GOVIN:2020-02-20:data Format {"type":"login", "username":"username"}
      case "login":
        login(connection, data);
      break;

      //:COMMENT:GOVIN:2020-02-20:data Format {"type":"offer", "to":"other_username", "offer":"offer"}
      case "offer":
        sendOffer(connection, data);
      break;

      //:COMMENT:GOVIN:2020-02-20:data Format {"type":"answer", "to":"other_username", answer="answer"}
      case "answer":
        answer(connection, data);
      break;

      //:COMMENT:GOVIN:2020-02-20:data Format {"type":"candidate", "to":"other_username", "candidate":"candidate"}
      case "candidate":
        sendCandidateTo(connection, data);
      break;

      //:COMMENT:GOVIN:2020-02-20:data Format {"type":"leave", "to":"other_username"}
      case "leave":
        leave(connection, data);
      break;

      //:GLITCH:GOVIN:2020-02-20:Test code to understand, might be a dead code
      case "list":
      console.log("List request from "+connection.username);
      user_names = [];
      Object.entries(users).forEach(([key, value]) => {
        user_names.push(value.username);
      });

      console.log(user_names);
      //notify the other user so he can disconnect his peer connection
      if(connection != null) {
        var message = {
                        type: "user_list",
                        "users": user_names
                      };
        sendTo(connection, message);
      }
      break;

      case "logs":
        saveTrace(connection, data);
      break;

      default:
        var message = {
                        type: "error",
                        message: "Command not found: "+data.type
                      };
        sendTo(connection, message);
      break;
    }
  });


  //:COMMENT:GOVIN:2020-02-20:Onclose event for the connection.
  connection.on("close", function() {

    if(connection.username) {
      delete users[connection.username];
      //:TODO:GOVIN:2020-02-20:Add the message in a log file

      if(connection.otherName) {
        console.log("Disconnecting from "+connection.otherName);
        //:TODO:GOVIN:2020-02-20:Add the message in a log file

        var conn = users[connection.otherName];
        //:TODO:GOVIN:2020-02-20:Manage many users
        if(conn != null) {
          conn.otherName = null;
          var message = {
                        type: "leave",
                        from: connection.username,
                        to: conn.username
                      };
          sendTo(conn, message);
          //:TODO:GOVIN:2020-02-20:Add the message in a log file
        }
      }
        console.log(connection.username+" user has disconnected. ");
    }else{
      //:TODO:GOVIN:2020-02-20:Add the message in a log file "anonymous user disconnected"
      console.log("Anonymous user has disconnected. ");
    }

  });
          //:TODO:GOVIN:2020-02-20:Add the message in a log file

  //:GLITCH:GOVIN:2020-02-20:type might be ambiguous or inadequate
  var message = {
              type: "comment",
              comment:"Connection to SIGNALING Server is a success. ",
              from: server_name
            };
  sendTo(connection, message);
});

function sendTo(connection, message) {
  connection.send(JSON.stringify(message));
}
