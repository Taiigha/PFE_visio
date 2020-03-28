var tracks = [];

var conf ={iceServers: [
    {urls: "stun:stun.l.google.com:19302"}/*,
  {url: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}*/ //TURN Server, uncomment if necessary. Usable for development purpose only.
  ]
};

var opt = {optional: [
    {DtlsSrtpKeyAgreement: true}
  ]
};

var jsonExec = "";
var debug = true;
var perf = true;

var local = null;
var remote = null;

var dataChannel1 = null;
var dataChannel2 = null;

var connSignalingServer = null;

var recipients = [];

var username;
var remoteUsername;

var currentAnswer = null, currentOffer = null;

var isAVideoCall = false;

var isNegotiating = false;

const ipV4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipV6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;


const HEARTBEAT_MESSAGE = "--heartbeat--";
const HEARTBEAT_TIMEOUT = 30000;
const HEARTBEAT_INTERVAL_TIME = 10000;

document.onload = function() {
  trackExecution("Document totally loaded");
}

function getTimestamp() {
  var date = new Date(Date.now());
  var timestamp = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear()
  + " "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
  return timestamp;
}

function trackExecution(data) {
  if(debug)
  {
    if(perf)
    {
      //:TODO:ROUX:2020-02-25:add some information about performance
    }
    console.log(getTimestamp() + "  " + data);
    jsonExec = jsonExec + '\n' + data;
  }
}

function error(err, msg) {
  trackExecution("ERR : " + err + " : " + msg);

  document.getElementById("alert").textContent = err + " : " + msg;
  document.getElementById("alert").style.display = "block";
}

function changePage(page) {
  document.getElementById("alert").style.display = "none";

  if(page === "call")
  {
    document.getElementById("connectToSignalingServer").style.display = "none";
    document.getElementById("inCommunication").style.display = "none";
    document.getElementById("call").style.display = "block";
  }
  else if(page === "inCommunication")
  {
    document.getElementById("endCon").style.display = "none";
    document.getElementById("call").style.display = "none";
    document.getElementById("inCommunication").style.display = "block";
  }
}

function sendMessageToSignalingServer(message) {
  trackExecution("CALL : sendMessageToSignalingServer");

  if(connSignalingServer != null)
    connSignalingServer.send(JSON.stringify(message));
  else
    error("Connection : No connection to signaling server");
}

function stopStreamedVideo(videoElem) {
  if(videoElem == null)
  {
    trackExecution("stopStreamedVideo: videoElem is null.");
    return;
  }

  const stream = videoElem.srcObject;

  if(stream == null)
    trackExecution("stopStreamedVideo: no stream assigned to component.");
  else
  {
    const tracks = stream.getTracks();
    tracks.forEach(function(track) {
      track.stop();
    });
  }

  videoElem.srcObject = null;
}

function hangUp(comment) {
  //:TODO:ROUX:send a debug message to server.
  trackExecution("HangUp function.");

  document.getElementById("endCon").style.display = "block";
  document.getElementById("endCon").textContent = "Fin de communcation avec : " + recipients + ". " + comment;
  console.log(jsonExec);
  document.getElementById("hangUpButton").disabled = true;
  changePage("call");

  if(local != null)
    trackExecution("HangUp: local is null.");
  else
  {
    local.close();
    local = null;
  }

  if(remote == null)
    trackExecution("HangUp: remote is null.");
  else
  {
    remote.close();
    remote = null;
  }

  recipients = [];
  stopStreamedVideo(document.getElementById("sendVideo"));
  stopStreamedVideo(document.getElementById("receiveVideo"));

  //:COMMENT:GOVIN:2020-03-10:DataChannels are automatically closed with the RTCPeerConnection
  dataChannel1 = null;
  dataChannel2 = null;
}

function wantToHangUp(comment) {
  changePage("call");

  trackExecution("CALL : wantToHangUp");

  console.log(recipients);

  recipients.forEach(function(user) {
    var message = {
      type: "leave",
      //from: my_username,
      from: username,
      to: user,
      comment : comment
    };

    console.log(message);

    sendMessageToSignalingServer(message);
  });

  message = {
    type: "logs",
    from: username,
    to: recipients,
    logs: jsonExec
  };

  sendMessageToSignalingServer(message);
  hangUp("Vous avez raccroché.");
}

function sendOffer(offer, recipient) {
  trackExecution("CALL : sendOffer");

  if(offer == null)
  {
    trackExecution("Offer is null while trying to send it.");
    return;
  }

  trackExecution("Sending offer through signaling server...");

  var message = {
    type:"offer",
    to:recipient,
    offer: offer,
    videoCall: isAVideoCall
  }

  sendMessageToSignalingServer(message);

  recipients.push(recipient);
}

function bindVideoWithStream(video, stream) {
  trackExecution("CALL : bindVideoWithStream");

  video.srcObject = stream;

  video.onloadedmetadata = function(e) {
    video.play();
  };
}

function initLocalEvent() {
  if(local == null)
  {
    trackExecution("Local RTCPeerConnection is null.");
    return;
  }

  local.onsignalingstatechange = function(e) {  // Workaround for Chrome: skip nested negotiations
      isNegotiating = (local.signalingState != "stable");
  }

  local.onicecandidate = function(e) {
    if(local != null)
    {
      trackExecution("EVENT : local.onicecandidate : " + local.localDescription);

      if(e.candidate == null)
      {
        trackExecution("Offer done");

        currentOffer = JSON.stringify(local.localDescription);
        var recipient = document.getElementById("recipient").value;

        if(recipient == null)
        {
          console.log("createOffer[local.onicecandidate]: recipient is null.");
          return;
        }

        sendOffer(currentOffer, recipient);

        changePage("inCommunication");
      }
    }
  };

  local.ontrack = function(e) {
    if(local != null)
    {
      trackExecution("EVENT : local.ontrack : " + local.getTracks);

      var receiveVideo = document.getElementById("receiveVideo");
      var stream = null;

      if (e.streams && e.streams[0])
      {
        trackExecution(e.streams[0]);
        trackExecution(e.streams[0].getTracks());

        stream = e.streams[0];

        bindVideoWithStream(receiveVideo, stream);
      }
    }
  };

  local.onconnectionstatechange = function(e) {
    if(local != null)
    {
      trackExecution("EVENT : local.onconnectionstatechange : " + local.connectionState);

      if(local.connectionState === "connected")
          trackExecution("Local connected");
    }
  };

  local.oniceconnectionstatechange = function(e) {
    if(local != null)
    {
      trackExecution("EVENT : local.oniceconnectionstatechange : " + local.iceConnectionState );

      if(local.iceConnectionState === "connected")
        trackExecution("Local connected (ICE)");
    }
  };
}

function sendAnswer(answer, recipient) {
  trackExecution("CALL : sendAnswer");

  if(answer == null)
  {
    trackExecution("Answer is null while trying to send it.");
    return;
  }

  trackExecution("Sending answer through signaling server...");

  var message = {
    type:"answer",
    to:recipient,
    answer: answer
  }

  sendMessageToSignalingServer(message);
}

function initRemoteEvent() {
  if(remote == null)
  {
    trackExecution("Remote RTCPeerConnection is null.");
    return;
  }

  remote.ontrack = function(e) {
    if(remote != null)
    {
      trackExecution("EVENT : remote.ontrack : " + remote.getTracks);

      var receiveVideo = document.getElementById("receiveVideo");
      var stream = null;

      if (e.streams && e.streams[0])
        stream = e.streams[0];

      bindVideoWithStream(receiveVideo, stream);
    }
  };

  remote.onicecandidate = function(e) {
    if(remote != null) {
      trackExecution("EVENT : remote.onicecandidate : " + remote.localDescription);

      if(e.candidate == null)
      {
        console.log("Answer done");
        currentAnswer = JSON.stringify(remote.localDescription);
        sendAnswer(currentAnswer, recipients[0]);
      }
    }
  };

  remote.onconnectionstatechange = function(e) {
    if(remote != null)
    {
      trackExecution("EVENT : remote.onconnectionstatechange : " + remote.connectionState);

      if(remote.connectionState === "connected")
        trackExecution("Remote connected");
    }
  };

  remote.oniceconnectionstatechange = function(e) {
    if(remote != null)
    {
      trackExecution("EVENT : remote.oniceconnectionstatechange : " + remote.iceConnectionState);

      if(remote.iceConnectionState === "connected")
        trackExecution("Remote connected (ice)");
    }
  };
}

function initPeers() {
  trackExecution("CALL : init");

  document.getElementById("hangUpButton").disabled = false;
  local = new RTCPeerConnection(conf, opt);
  remote = new RTCPeerConnection(conf, opt);

  initLocalEvent();
  initRemoteEvent();
}

function testDevices(callback, videoNeeded) {
  trackExecution("CALL : testDevices");

  var isAudioAvailable = false, isVideoAvailable = false;

  //Test if audio and video devices are availables
  navigator.mediaDevices.enumerateDevices().then(function(devices) {
    devices.forEach(function(device) {
      if(device.kind === "audioinput")
        isAudioAvailable = true;
      if(device.kind === "videoinput" && videoNeeded)
        isVideoAvailable = true;
    });

    callback(isAudioAvailable, isVideoAvailable);
  }).catch(function(err) {
    document.getElementById("alert").textContent = err.name + " : " + err.message;
    trackExecution("ERR : " + err.name + " : " + err.message);
  });
}

function call(videoNeeded) {
  document.getElementById("endCon").style.display = "none";

  var address = document.getElementById("recipient").value;

  if ((address != "") && (ipV4Regex.test(address) || ipV6Regex.test(address)))
  {
    trackExecution("Call function.");
    initPeers();
    isAVideoCall = videoNeeded;
    testDevices(createOffer, videoNeeded);
  }
  else
  {
    document.getElementById("alert").textContent = "Erreur : Vous n'avez pas renseigé d'adresse IP ou l'adresse IP a un format incorrect.";
    document.getElementById("alert").style.display = "block";
  }
}

function receivedAnswer(answer) {
  trackExecution("CALL : receivedAnswer");

  local.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer))).catch(function (err) {
    error(err.name, err.message);
  });
}

function heartbeat(ws) {
  clearTimeout(ws.heartbeatTimeout);
  ws.heartbeatTimeout = setTimeout(() => {
    window.alert("La connexion avec le serveur SIGNALING a été perdue. ")
    ws.close();
  }, HEARTBEAT_TIMEOUT);
}

function createConnectionToSignalingServer(address, port, username) {
  trackExecution("CALL : createConnectionToSignalingServer");
  trackExecution("Connection to "+ address +" on port "+ port +".");

  var ws = new WebSocket("ws://"+address+":"+port)

  ws.hertbeatInterval = setInterval(() => {
    ws.send(JSON.stringify(HEARTBEAT_MESSAGE));
  }, HEARTBEAT_INTERVAL_TIME);


  ws.onmessage = function (evt) {
    trackExecution("[Before Processing] Message received = " + evt.data);

    var data;
    //:COMMENT:GOVIN:2020-02-20:message shall contain {"type":"something"} and shall be in JSON format
    try {
      data = JSON.parse(evt.data);
      //:TODO:GOVIN:2020-02-20:Add the message in a log file
    } catch (e) {
      trackExecution("ERR : Invalid JSON");
      data = {};
    }

    if(data == HEARTBEAT_MESSAGE){
      heartbeat(ws);
      return;
    }

    switch (data.type) {
      case "offer":
        trackExecution("Offer : ");

        //:COMMENT:GOVIN:2020-02-20: Multiple user management might be here
        recipients = [];
        recipients.push(data.from.split("@")[1]);
        console.log("Received offer from "+data.from);
        if (confirm(data.from + " vous appelle. Souhaitez-vous répondre ?"))
        {
          changePage("inCommunication");
          currentOffer = data.offer;
          remoteUsername = data.from.split("@")[0];
          testDevices(receivedOffer, data.videoCall);
        }
        else
        {
          var message = {
            type:"refuse",
            to:recipients
          }
          sendMessageToSignalingServer(message);
        }
        break;

      case "answer":
        trackExecution("Answer : ");

        //:COMMENT:GOVIN:2020-02-20:currentAnswer is a global variable which can be used to retrieve the answer
        currentAnswer = data.answer;
        console.log("Received answer from "+data.from);
        remoteUsername = data.from.split("@")[0]
        receivedAnswer(currentAnswer);
        break;

      case "candidate":
        trackExecution("Candidate : "+data);
        break;

      case "comment":
        trackExecution("Comment : "+data);
        break;

      case "login":
        trackExecution("Login : ");
        if(data.success){
          trackExecution("Login: Success when login. ");
          changePage("call");
          document.getElementById("info").textContent = "Vous êtes connecté en tant que : " + data.to;
          document.getElementById("info").style.display = "block";
        }
        else
        {
          connSignalingServer.close();
          connSignalingServer = null;
          error("Login", "Error while trying to login");
        }
        break;

      case "leave":
        trackExecution("Leave : ");
        trackExecution(data);
        hangUp(data.comment);
        break;

      case "refuse":
        hangUp("Votre correspondant a refusé l'appel.");
        break;

      case "error":
        if(data.errorType === "offer")
          hangUp("Erreur : L'adresse IP que vous essayez d'appeler n'est pas connectée.");
        break;

      default:
        trackExecution("Default on message :");
        trackExecution(data);
        break;
    }
  };

  ws.onclose = function () {

    clearTimeout(ws.heartbeatTimeout);
    clearInterval(ws.hertbeatInterval);
    trackExecution("Connection closed...");
  };

  ws.onerror = function(err) {
    console.error("Error while connecting to WebSocket : ", err);
    error("Error while connecting to WebSocket", err );
  };

  return ws;
}

function loginSignalingServer(username) {
  var message = {
    type: "login",
    username: username
  };

  sendMessageToSignalingServer(message);
}

function connectToSignalingServer() {
  trackExecution("CALL : connectToSignalingServer");


  //:COMMENT:GOVIN:2020-03-15:0	CONNECTING; 1 OPEN; 2	CLOSING	;3 CLOSED
  if((connSignalingServer != null) && (connSignalingServer.readyState != 3))
  {
    if(connSignalingServer.readyState == 1)
      trackExecution("Already connected to a signaling server.");
    return;
  }

  var address = document.getElementById("url").value;
  var port = document.getElementById("port").value;
  username = document.getElementById("username").value;

  //Regex match
  if(!(address == null || address == "") && !(port == null || port == ""))
  {
    connSignalingServer = createConnectionToSignalingServer(address, port, username);
    connSignalingServer.onopen = function(e) {
      trackExecution("Socket connection opened properly");
      loginSignalingServer(username);
    }
  }
  else
    trackExecution("Paramêtres manquants pour effectuer la connexion.");
}

function showMessage(data, username) {
  trackExecution("CALL : showMessage");

  var date = new Date();
  var log = document.createElement('p');
  var logValue = document.createTextNode(username + "[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "] : " + data);

  log.appendChild(logValue);
  document.getElementById("chatbox").appendChild(log);
}

function sendMessage() {
  trackExecution("CALL : sendMessage");

  var text = document.getElementById("textToSend").value;

  if(text != "")
  {
    showMessage(text, username);

    document.getElementById("textToSend").value = "";

    if (dataChannel1 != null)
      dataChannel1.send(text);

    if (dataChannel2 != null)
      dataChannel2.send(text);
  }
}

function setUpDataChannel(dataChannel, username) {
  trackExecution("CALL : setUpDataChannel");

  dataChannel.onopen = function(event) {
    dataChannel.send("connected to chatbox");
  }

  dataChannel.onmessage = function(event) {
    showMessage(event.data, remoteUsername);
  }

  dataChannel.onclose = function(event) {
    showMessage("Has disconneted.", username)
  }
}

function createOffer(isAudioAvailable, isVideoAvailable) {
  trackExecution("CALL : createOffer");

  /* Configuration video
  if(isVideoAvailable)
  {
    isVideoAvailable = "width: " + document.getElementById("width") + ", height: " + document.getElementById("height") + ", frameRate: { min:" + document.getElementById("minframeRate") + ", max: " + document.getElementById("maxframeRate") + "}}"
  }*/


  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable , video: isVideoAvailable }).then(function(stream) {

    //Retrieve tracks
    tracks =  stream.getTracks();
    for (const track of stream.getTracks()) {
      local.addTrack(track, stream);
    }

    //::GOVIN:2020-02-20:Binding stream with sendVideo element
    var video = document.getElementById("sendVideo");
    video.srcObject = stream;

    video.onloadedmetadata = function(e) {
      video.play();
    };

    //Create datachannel
    dataChannel1 = local.createDataChannel("dc1", {negotiated: true, id: 0});
    setUpDataChannel(dataChannel1, username);

    //Create offer
    local.createOffer({offerToReceiveVideo: true}).then(function(offer) {
      return local.setLocalDescription(offer).catch(function (err) {
        error(err.name, err.message);
      });
    }).catch(function(err) {
      error(err.name, err.message);
    });

  }).catch(function(err) {
    error(err.name, err.message);
  });
}

function recipientError() {
  recipients.forEach(function(user) {
    var message = {
      type: "leave",
      from: username,
      to: user,
      comment : "Votre correspondant a rencontré une erreur."
    };

    console.log(message);

    sendMessageToSignalingServer(message);
  });

  hangUp("Une erreur s'est produite.");
}

function receivedOffer(isAudioAvailable, isVideoAvailable) {
  trackExecution("CALL : receivedOffer");

  initPeers();
  var offer = currentOffer;

  if(isVideoAvailable)
  {
    isVideoAvailable = "width: " + document.getElementById("width").value + ", height: " + document.getElementById("height").value + ", frameRate: { min:" + document.getElementById("minFrameRate").value + ", max: " + document.getElementById("maxFrameRate").value + "}}"
  }

  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable, video: isVideoAvailable }).then(function(stream) {

    //Retrieve tracks
    tracks =  stream.getTracks();
    for(const track of stream.getTracks()) {
      remote.addTrack(track, stream);
    }

    //::GOVIN:2020-02-20:Binding stream with sendVideo element
    var sendVideo = document.getElementById("sendVideo");
    sendVideo.srcObject = stream;

    sendVideo.onloadedmetadata = function(e) {
      sendVideo.play();
    };

    //Create datachannel
    dataChannel2 = remote.createDataChannel("dc2", {negotiated: true, id: 0});
    setUpDataChannel(dataChannel2, username);

    //Save remote offer
    remote.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer))).catch(function (err) {
      error(err.name, err.message);
      recipientError();
    });

    //Create answer
    remote.createAnswer().then(function(answer) {
      remote.setLocalDescription(answer).catch(function (err) {
        error(err.name, err.message);
        recipientError();
      });
    }).catch(function(err) {
      error(err.name, err.message);
      recipientError();
    });

  }).catch(function(err) {
    error(err.name, err.message);
    recipientError();
  });
}
