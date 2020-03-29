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
const debug = true;

const fs = require("fs");

const WebSocketServer = require("ws").Server;

const ipV4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipV4PrefixedRegex = /^::ffff:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipV6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

const IPv6FamilyName = "IPv6";
const IPv4FamilyName = "IPv4";

const IPv4Prefix = "::ffff:";

const PING_INTERVAL = 15000;
const MAX_PING_ID = 5;

const HEARTBEAT_MESSAGE = "--heartbeat--";

const localhostIpAddress = "127.0.0.1";

//Creating the server on the 9090 port
var wss = new WebSocketServer({port: 9090});

var server_log_stream = fs.createWriteStream("server-logs-"+getCurrentDate(), {flags:'a'});
var log_queue = "\n";

//Will contain the connected users
var users = {};
var server_name = "Server Signaling";

server_log_stream.readyState = 0;

server_log_stream.on("open", function(){
  server_log_stream.readyState = 1;
  server_log_stream.write(log_queue);
  log_queue = "";
});

console.log("Server started at "+getTimestamp());

writeInServerLog("Server started at "+getTimestamp());

if(debug)
  setInterval(displayUsers, 30*1000);

function getTimestamp() {
  var timestamp = Date.now();
  var date = new Date(timestamp);
  var timestamp = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear()+ " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

  return timestamp;
}

function getTimestampedMessage(message) {
  return getTimestamp() + " " + message;
}

function writeInStream(stream, message) {
  stream.write(message);
}

function writeInServerLog(message) {
  var timestampedMessage = (getTimestampedMessage(message) + "\n");

  if(server_log_stream.readyState == 0)
  {
    log_queue += timestampedMessage;
    return;
  }

  writeInStream(server_log_stream, timestampedMessage);
}

function displayUsers() {
  var userList = getUserList();

  console.log(userList);

  writeInServerLog("Connected users : "+userList);
}

function saveTrace(connection, data) {
  console.log("Save trace " + connection.username);
  fs.writeFileSync(connection.username + "-logs", data.logs);
}

function extractIPv4FromIPv6(ipAddress) {
  if(ipAddress == null)
  {
    console.log("extractIPv4FromIPv6: ipAddress is null.");
    return;
  }

  return ipAddress.substring(IPv4Prefix.length);
}

function getIPAddress(address_struct) {
  //Argument example { address: '::ffff:192.168.0.16', family: 'IPv6', port: 9090 }
  if(address_struct == null)
  {
    console.log("getIPAddress: address is null. ");
    return;
  }

  if(address_struct.family === IPv4FamilyName)
  {
    return address_struct.address;
  }

  if(address_struct.family === IPv6FamilyName)
  {
    if(address_struct.address.match(ipV4PrefixedRegex))
    {
      return extractIPv4FromIPv6(address_struct.address);
    }

    return address_struct.address;
  }
}

function getUser(username) {
  if(username == null)
  {
    console.log("getUser: username is null.");
    return;
  }

  if(ipV4Regex.test(username) || ipV6Regex.test(username))
  {
    return users[username];
  }
  else
  {
    for(user in users){
      if(user.username === username)
        return user;
    }
  }
}

function sendTo(connection, message) {
  if(connection == null)
  {
    console.log("sendTo: Connection is null.");
    return;
  }

  if(message == null)
  {
    console.log("sendTo: message is null.");
    return;
  }

  connection.send(JSON.stringify(message));
}

function login(connection, data) {
  var address = {
    address: connection._socket.remoteAddress,
    family: connection._socket.remoteFamily,
    port: connection._socket.remotePort
  };

  var ipAddress = getIPAddress(address);

  console.log(getTimestamp() + " [Login-1] User " + ipAddress + " trying to log... ");
  writeInServerLog("[Login-1] User " + ipAddress + " trying to log... ");

  //Refuse connection if username already exists.
  if(users[ipAddress])
  {
    var message = {
                  type: "login",
                  success: false,
                  from: server_name,
                  comment:"You are already connected."
                };
    sendTo(connection, message);
    console.log(getTimestamp() + " [Login-2] User " + data.username + " has failed to log, user already connected.");
    writeInServerLog("[Login-2] User " + data.username + " has failed to log, user already connected.");
  }
  else
  {
    //Saving the connection of the user in the server memory
    users[ipAddress] = connection;
    if(data.username == null)
    {
      connection.username = ipAddress;
    }
    else
    {
      connection.username = data.username;
    }

    connection.ipAddress = ipAddress;

    var message = {
      type: "login",
      success: true,
      from: server_name,
      to: data.username + "@" + connection.ipAddress,
      comment: "Welcome " + connection.username + " !"
    };

    sendTo(connection, message);
    console.log(getTimestamp() + " [Login-3] User " + data.username + "@" + connection.ipAddress + " is logged.");
    writeInServerLog("[Login-3] User " + data.username + "@" + connection.ipAddress + " is logged.");
  }
}

function heartbeat(connection) {
  sendTo(connection, HEARTBEAT_MESSAGE);
}

function findConnection(recipient) {
  if(recipient == null)
  {
    console.log("findConnection: recipient is null.");
    return null;
  }

  if(isIpAddress(recipient))
  {
    return users[recipient];
  }
  else
  {
    for(user in users) {
      if(user.username == recipient)
        return user;
    }
  }
  return null;
}

function sendErrorMessage(connection, errorType, errorMessage) {
  var message = {
    type: "error",
    errorType: errorType,
    errorMessage: errorMessage
  }
  sendTo(connection, message);
}

function sendOffer(connection, data) {
  if(data.to == null)
  {
    console.log(getTimestamp() + " [Offer-0] Error: " + connection.username + "@" + connection.ipAddress + "trying to send offer to unknown.");
    writeInServerLog("[Offer-0] Error: " + connection.username + "@" + connection.ipAddress + "trying to send offer to unknown.");
    sendErrorMessage(connection, "offer", "Null recipient. ");
    return;
  }

  console.log(getTimestamp() + " [Offer-1] Sending offer from " + connection.username + " to: " + data.to);
  writeInServerLog("[Offer-1] Sending offer from " + connection.username + " to: " + data.to);

  var conn = users[data.to];

  if(conn != null)
  {
    //We assume that data.to is an IPAddress
    if(connection.otherAddresses == null)
      connection.otherAddresses = [];
    connection.otherAddresses.push(data.to);

    var message = {
      type: "offer",
      offer: data.offer,
      from: connection.username+"@"+connection.ipAddress,
      to: data.to+"@"+conn.ipAddress,
      videoCall : data.videoCall
    }

    sendTo(conn, message);
  }
  else
  {
    console.log(getTimestamp() + " [Offer-2] From " + connection.username + "@" + connection.ipAddress + " to " + data.to + " is not connected to the server.");
    writeInServerLog("[Offer-2] " + data.to + " is not connected to the server.");
    sendErrorMessage(connection, "offer", "Error: " + data.to + "is not connected to the server.");
  }
}

function answer(connection, data) {
  console.log(getTimestamp() + " [Answer-1] Sending answer from " + connection.username + " to: " + data.to);
  writeInServerLog("[Answer-1] Sending answer from " + connection.username + " to: " + data.to);

  //Connection answer to the other user in data
  var conn = users[data.to];

  if(conn != null)
  {
    if(connection.otherAddresses == null)
      connection.otherAddresses = [];

    connection.otherAddresses.push(data.to);

    var message = {
      type: "answer",
      from: connection.username+"@"+connection.ipAddress,
      to: data.to+"@"+conn.ipAddress,
      answer: data.answer
    }

    sendTo(conn, message);
  }
  else
  {
    console.log(getTimestamp() + " [Answer-2] From " + connection.username + "@" + connection.ipAddress + " to " + data.to + " is not connected to the server.");
    writeInServerLog("[Answer-2] From " + connection.username + "@" + connection.ipAddress + " to " + data.to + " is not connected to the server.");
    sendErrorMessage(connection, "answer", "Error: " + data.to + "is not connected to the server.");
  }
}

function removeElementInArray(array, ipAddress) {
  if(array == null)
  {
    console.log("removeElementInArray: array is null.");
    return;
  }

  var index = array.indexOf(ipAddress);

  if (index > -1)
    array.splice(index, 1);

  return array;
}

function leave(connection, data) {
  console.log(getTimestamp() + " [Leave-1] " + connection.username + "@" + connection.ipAddress + " is disconnecting from " + data.to);
  writeInServerLog("[Leave-1] " + connection.username + "@" + connection.ipAddress + " is disconnecting from " + data.to);

  if(data.to != null)
  {
      var conn = users[data.to];

      //Notify other user to close the peerconnection on his side
      if(conn != null)
      {
        conn.otherAddresses = removeElementInArray(conn.otherAddresses, connection.ipAddress);

        var message = {
          type: "leave",
          from: connection.username + "@" + connection.ipAddress,
          to: data.to + "@" + conn.ipAddress,
          comment : data.comment
        };
        sendTo(conn, message);
        console.log(getTimestamp() + " [Leave-2] " + connection.username + "@" + connection.ipAddress + " sending leaving message to " + data.to);
        writeInServerLog("[Leave-2] " + connection.username + "@" + connection.ipAddress + " sending leaving message to " + data.to);
      }
      else
      {
        console.log(getTimestamp() + " [Leave-4] Error: no connection found from " + connection.username + "@" + connection.ipAddress + " to remote " + data.to);
        writeInServerLog("[Leave-4] Error: no connection found from " + connection.username + "@" + connection.ipAddress + " to remote " + data.to);
      }
  }
  else
  {
    console.log(getTimestamp() + " [Leave-3] Error: no connection found from " + connection.username + "@" + connection.ipAddress + " to recipient " + data.to);
    writeInServerLog("[Leave-3] Error: no connection found from " + connection.username + "@" + connection.ipAddress + " to recipient " + data.to);
  }
}

function sendCandidateTo(connection, data) {
  if(data.to == null)
  {
    console.log(getTimestamp() + " [Candidate-0] " + connection.username + "@" + connection.ipAddress + " trying to send candidate to null.");
    writeInServerLog("[Candidate-0] " + connection.username + "@" + connection.ipAddress + " trying to send candidate to null.");
    sendErrorMessage(connection, "candidate", "Null recipient.");
    return;
  }

  console.log(getTimestamp() + " [Candidate-1] " + connection.username + "@" + connection.ipAddress + " is sending candidate to : " + data.to);
  writeInServerLog("[Candidate-1] " + connection.username+"@" + connection.ipAddress + " is sending candidate to : " + data.to);

  var conn = users[data.to];

  if(conn != null)
  {
    var message = {
      type: "candidate",
      from: connection.username + "@" + connection.ipAddress,
      to: data.to + "@" + conn.ipAddress,
      candidate: data.candidate
    };
    sendTo(conn, message);
    console.log(getTimestamp() + " [Candidate-2] " + connection.username + "@" + connection.ipAddress + " is sending candidate to : " + data.to + "@" + conn.ipAddress);
    writeInServerLog("[Candidate-2] " + connection.username + "@" + connection.ipAddress + " is sending candidate to : " + data.to + "@" + conn.ipAddress);
  }
  else
  {
    console.log("[Candidate-3] Error : [" + connection.username + "@" + connection.ipAddress + " is sending candidate to : " + data.to + "@" + conn.ipAddress + "]");
    writeInServerLog("[Candidate-3] Error : [" + connection.username + "@" + connection.ipAddress + " is sending candidate to : " + data.to + "@" + conn.ipAddress + "]");
  }
}

function getUserList() {
  user_names = [];

  Object.entries(users).forEach(([key, value]) => {
    user_names.push(value.username + "@" + key);
  });

  return user_names;
}

function refuse(connection, data) {
  console.log(getTimestamp() + " [Refuse-1] Sending refuse from " + connection.username + "@" + connection.ipAddress + " to: " + data.to);
  writeInServerLog("[Refuse-1] Sending refuse from " + connection.username + "@" + connection.ipAddress + " to: " + data.to);

  //Connection answer to the other user in data
  var conn = users[data.to];

  if(conn != null)
  {
    if(connection.otherAddresses == null)
      connection.otherAddresses = [];

    connection.otherAddresses.push(data.to);

    var message = {
      type: "refuse",
      from: connection.username + "@" + connection.ipAddress,
      to: data.to + "@" +conn.ipAddress,
      answer: data.answer
    }

    console.log("[Refuse-2] " + message + " conn : "+ conn);
    writeInServerLog("[Refuse-2] " + message + " conn : "+ conn);
    sendTo(conn, message);
  }
  else
  {
    writeInServerLog("[Refuse-3] connection is null.");
    console.log("[Refuse-3] connection is null.");
  }
}

function getCurrentDate() {
  var timestamp = Date.now();
  var date = new Date(timestamp);

  return date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
}

wss.on("connection", function(connection) {
  console.log("[ON-Connection-Event] Connection incoming... ");
  writeInServerLog("[ON-Connection-Event] Connection incoming... ");

  //onmessage event for the connection.
  connection.on("message", function(incoming_message) {
    var data;
    //message shall contain {"type":"something"} and shall be in JSON format
    try {
      data = JSON.parse(incoming_message);
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
      writeInServerLog("[ON-MESSAGE-Event] Invalid JSON from " + connection.username + "@" + connection.ipAddress);
    }

    if(data === HEARTBEAT_MESSAGE)
    {
      writeInServerLog("[HEARTBEAT] Received from " + connection.username + "@" + connection.ipAddress);
      heartbeat(connection);
      return;
    }

    switch (data.type) {
      //data Format {"type":"login", "username":"username"}
      case "login":
        login(connection, data);
      break;

      //data Format {"type":"offer", "to":"recipient", "offer":"offer", videoCall:isAVideoCall}
      case "offer":
        sendOffer(connection, data);
      break;

      //data Format {"type":"answer", "to":"recipient", answer="answer"}
      case "answer":
        answer(connection, data);
      break;

      //data Format {"type":"candidate", "to":"recipient", "candidate":"candidate"}
      case "candidate":
        sendCandidateTo(connection, data);
      break;

      //data Format {"type":"leave", "to":"recipient"}
      case "leave":
        leave(connection, data);
      break;

      //Command sent to retrieved the list of connected users.
      case "list":
        console.log("[List] Connected user list request from " + connection.username + "@" + connection.ipAddress);
        user_names = getUserList();

        if(connection != null)
        {
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

      case "refuse":
        refuse(connection,data)
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

  //Onclose event for the connection.
  connection.on("close", function() {
    var ipAddress = connection.ipAddress;
    console.log(getTimestamp() + " [Close-Connection-Event-1] Close connection from " + connection.username + "@" + ipAddress);
      writeInServerLog("[Close-Connection-Event-1] Close connection from " + connection.username + "@" + ipAddress);

    if(users[ipAddress])
    {
      if(connection.otherAddresses)
      {
        for(user in connection.otherAddresses)
        {
          var conn = users[user];
          if(conn != null)
          {
            console.log(getTimestamp() + " [Close-Connection-Event-2] " + connection.username + "@" + ipAddress + " disconnecting from " + conn.username + "@" + user);
            writeInServerLog("[Close-Connection-Event-2] " + connection.username + "@" + ipAddress + " disconnecting from " + conn.username + "@" + user);
            conn.otherAddresses = removeElementInArray(conn.otherAddresses, ipAddress);
            var message = {
                          type: "leave",
                          from: connection.username+"@"+ipAddress,
                          to: data.to+"@"+conn.ipAddress
                        };
            sendTo(conn, message);
            console.log(getTimestamp() + " [Close-Connection-Event-3] Leaving message send to " + conn.username + "@" + conn.ipAddress);
            writeInServerLog("[Close-Connection-Event-3] Leaving message send to " + conn.username + "@" + conn.ipAddress);
          }
        }
      }
      delete users[ipAddress];
    }
    else
    {
      console.log(getTimestamp() + " [Close-Connection-Event-5] Anonymous user " + ipAddress + " has disconnected.");
      writeInServerLog("[Close-Connection-Event-5] Anonymous " + ipAddress + " user has disconnected.");
    }

    //Ending the ping-pong routine
    clearInterval(connection.ping_interval);
  });

  connection.is_alive = true;
  connection.ping_id = 0;

  connection.on("pong", function heartbeat() {
      console.log(getTimestamp() + " [PONG] " + connection.username + "@" + connection.ipAddress + " is alive (ping id = "+connection.ping_id+").");
      connection.ping_id = 0;
      connection.is_alive = true;
  });

  //Starting the ping-pong routine
  connection.ping_interval = setInterval(function() {
    connection.ping_id++;
    connection.ping();

    if(connection.is_alive)
    {
      console.log(getTimestamp() + " [PING] " + connection.username + "@" + connection.ipAddress + " (ping id = " + connection.ping_id + ")");
    }
    else
    {
      console.log(getTimestamp() + " [PING] " + connection.username + "@" + connection.ipAddress + " is not alive, closing the socket.");
      writeInServerLog(" [PING] " + connection.username + "@" + connection.ipAddress + " is not alive, closing the socket.");
      connection.emit("close");
    }

    if(connection.ping_id > MAX_PING_ID)
      connection.is_alive = false;
  }, PING_INTERVAL);

  var message = {
              type: "comment",
              comment:"Connection to SIGNALING Server is a success. ",
              from: server_name
            };
  sendTo(connection, message);
});
