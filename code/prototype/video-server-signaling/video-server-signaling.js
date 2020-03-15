var tracks = [];

var conf = null;//{iceServers: [
  //{urls: "stun:stun.l.google.com:19302"}/*,
  //{url: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}*/ //TURN Server, uncomment if necessary. Usable for development purpose only.
//]
//};

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
//:GLITCH:GOVIN:2020-02-20:Awfull usernames management to change
var recipients = [];
var my_username = "Me";


var currentAnswer = null, currentOffer = null;
//:GLITCH:GOVIN:2020-02-20:To avoid putting manually all the information for the tests.
//:GLITCH:GOVIN:2020-02-20:Using JQuery to procceed because the dom is not loaded to link with the button

var isAVideoCall = false;


/*$(document).ready(e => {
  $("#username").val("Me");
  $("#url").val("192.168.0.13");
  $("#port").val("9090");

  //:COMMENT:GOVIN:2020-02-20:Link the #id button on click event with a function
  $("#connectToSignalingServerButton").on("click", connectToSignalingServer);

  $("#callButton").on("click", call);
  $("#hangUpButton").on("click", e => {
    var message = {
      type: "leave",
      from: my_username,
      to: other_username
    };
    sendMessageToSignalingServer(message);
    hangUp();
  });
});*/
document.onload = function(){
  trackExecution("finish");
  document.getElementById("username").value = "Me";
}



function wantToHangUp(){
  trackExecution('CALL : wantToHangUp');
  console.log(recipients);
  recipients.forEach(user => {
    var message = {
      type: "leave",
      from: my_username,
      to: user
    };
    console.log(message);
    console.log(message);
    sendMessageToSignalingServer(message);
  });





  message = {
    type: "logs",
    from: my_username,
    to: recipients,
    logs: jsonExec
  };
  sendMessageToSignalingServer(message);
  hangUp();
}


function initPeers(){
  trackExecution('CALL : init');
  document.getElementById('hangUpButton').disabled = false;
  //$("#hangUpButton").prop("disabled", false);
  local = new RTCPeerConnection(conf, opt);
  remote = new RTCPeerConnection(conf, opt);

  initLocalEvent();
  initRemoteEvent();
}

function call(audio, videoNeeded){
  trackExecution("Call function. ");
  initPeers();
  isAVideoCall = videoNeeded;
  testDevices(createOffer, videoNeeded);
}

function hangUp(){

  //:TODO:ROUX:send a debug message to server.
  trackExecution("HangUp function. ");
  console.log(jsonExec);
  document.getElementById('hangUpButton').disabled = true;
  //$("#hangUpButton").prop("disabled", true);

  if(local != null){
    trackExecution("HangUp: local is null. ");
  }else{
    local.close();
    local = null;
  }



  if(remote == null){
    trackExecution("HangUp: remote is null. ");
  }else{
    remote.close();
    remote = null;
  }


  stopStreamedVideo(document.getElementById('sendVideo'));
  stopStreamedVideo(document.getElementById('receiveVideo'));

  //:COMMENT:GOVIN:2020-03-10:DataChannels are automatically closed with the RTCPeerConnection
  dataChannel1 = null;
  dataChannel2 = null;

}


function connectToSignalingServer(){

  trackExecution('CALL : connectToSignalingServer');
  //:TODO:GOVIN:2020-02-20:Manage spaming the "Connect To Signaling Server Button" or disconnection then reconnection to a new server

  //:COMMENT:GOVIN:2020-03-15:0	CONNECTING; 1 OPEN; 2	CLOSING	;3 CLOSED
  if(connSignalingServer != null && connSignalingServer.readyState != 3){

    if(connSignalingServer.readyState == 1)
      trackExecution("Already connected to a signaling server. ");
    return;
  }
  var address = document.getElementById("url").value;
  var port = document.getElementById("port").value;
  var username = document.getElementById("username").value;
  //Regex match
  if(!(address == null || address == "") && !(port == null || port == ""))
  {
    connSignalingServer = createConnectionToSignalingServer(address, port, username);
    connSignalingServer.onopen = e => {
      trackExecution('Socket connection opened properly');
      loginSignalingServer(username);
    }
  }else{
    trackExecution("Paramêtres manquants pour effectuer la connexion. ");
  }
}

function loginSignalingServer(username){
  var message = {
    type: "login",
    username: username
  };

  sendMessageToSignalingServer(message);
}
function createConnectionToSignalingServer(address, port, username){
  trackExecution('CALL : createConnectionToSignalingServer');
  trackExecution("Connection to "+ address +" on port "+ port +". ");
  var ws = new WebSocket("ws://"+address+":"+port)

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
      //:TODO:GOVIN:2020-02-20:Add the error message in a log file
    }

    switch (data.type) {

      case "offer":
        trackExecution("Offer : ");
        //console.log(data);
        //:GLITCH:GOVIN:2020-02-20:Better user management required
        console.log("Received offer from "+data.from);
        if(confirm(data.from + " vous appelle. Souhaitez-vous répondre ?")){
          currentOffer = data.offer;
          other_username = data.from;
          recipients.push(data.from.split("@")[1]);
          testDevices(receivedOffer, data.videoCall); //:TODO:JCAMY:2020-15-03:is video needed ?
        }
        else {
          var message = {
            type:"refuse",
            to:data.from
          }
          sendMessageToSignalingServer(message);
        }
        break;

      case "answer":
        trackExecution("Answer : ");
        //console.log(data);
        //:GLITCH:GOVIN:2020-02-20:Awful to change
        currentAnswer = data.answer;
        console.log("Received answer from "+data.from);
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
      //  console.log(data);
        //:GLITCH:GOVIN:2020-02-20:To change
        if(data.success){
          trackExecution("Login: Success when login. ");
        }else{
          trackExecution("Login: Error while trying to login. ");
          connSignalingServer.close();
          connSignalingServer == null;
        }

        break;

      case "leave":
        trackExecution("Leave : ");
        trackExecution(data);
        hangUp();
        break;

      case "refuse":
        window.alert("Votre correspondant a refusé l'appel");
        break;

      default:
        trackExecution("Default on message :");
        trackExecution(data);
        break;
    }
  };

  ws.onclose = function () {
    trackExecution("Connection closed...");
  };

  ws.onerror = function(err){
    console.error("Error while connecting to WebSocket : ", err);
  };

  return ws;
}
function sendMessageToSignalingServer(message){
  trackExecution('CALL : sendMessageToSignalingServer');
  if(connSignalingServer != null){
    connSignalingServer.send(JSON.stringify(message));
  }else{
    trackExecution("Error : No connection to signaling server. ");
  }

}

function sendOffer(offer, recipient){
  trackExecution('CALL : sendOffer');
  if(offer == null){
    trackExecution("Offer is null while trying to send it. ");
    return;
  }

  trackExecution("Sending offer through signaling server... ");
  var message = {
    type:"offer",
    to:recipient,
    offer: offer,
    videoCall: isAVideoCall
  }
  sendMessageToSignalingServer(message);
  recipients.push(recipient);
}

function sendAnswer(answer, recipient){
  trackExecution('CALL : sendAnswer');
  if(answer == null){
    trackExecution("Answer is null while trying to send it. ");
    return;
  }
  trackExecution("Sending answer through signaling server... ");
  var message = {
    type:"answer",
    to:recipient,
    answer: answer
  }
  sendMessageToSignalingServer(message);
}

var isNegotiating = false;
function initLocalEvent(){
  if(local == null){
    trackExecution("Local RTCPeerConnection is null. ");
    return;
  }
    local.onsignalingstatechange = (e) => {  // Workaround for Chrome: skip nested negotiations
    isNegotiating = (local.signalingState != "stable");
  }
  local.onicecandidate = function(e) {
    trackExecution('EVENT : local.onicecandidate : ' + local.localDescription);
    //console.log(e.candidate);
    if(e.candidate == null) {
      trackExecution("Offer done");
      //console.log(JSON.stringify(local.localDescription));
      currentOffer = JSON.stringify(local.localDescription);

      var recipient = document.getElementById("recipient").value;
      if(recipient == null){
        console.log("createOffer[local.onicecandidate]: recipient is null. ");
        return;
      }
      sendOffer(currentOffer, recipient);
    }
  };

  local.ontrack = function(e){
    trackExecution('EVENT : local.ontrack : ' + local.getTracks);
    var receiveVideo = document.getElementById('receiveVideo');
    var stream = null;

    if (e.streams && e.streams[0]) {
      trackExecution(e.streams[0]);
      trackExecution(e.streams[0].getTracks());
      stream = e.streams[0];
      bindVideoWithStream(receiveVideo, stream);
    }
  };

  local.onconnectionstatechange = function(e) {
    trackExecution('EVENT : local.onconnectionstatechange : ' + local.connectionState);
    // console.log(local.connectionState);
    if(local.connectionState === "connected"){
        trackExecution("Local connected");
    }

  };

  local.oniceconnectionstatechange = function(e) {
    trackExecution('EVENT : local.oniceconnectionstatechange : ' + local.iceConnectionState );
    // console.log(local.iceConnectionState);
    if(local.iceConnectionState === "connected")
      trackExecution("Local connected (ICE)");
  };
}

function initRemoteEvent(){
  if(remote == null){
    trackExecution("Remote RTCPeerConnection is null. ");
    return;
  }
  remote.ontrack = function(e){
    trackExecution('EVENT : remote.ontrack : ' + remote.getTracks);
    var receiveVideo = document.getElementById('receiveVideo');
    //var receiveVideo = $("#receiveVideo")[0];
    var stream = null;

    if (e.streams && e.streams[0]) {
      stream = e.streams[0];
    }
    bindVideoWithStream(receiveVideo, stream);
  };

  remote.onicecandidate = function(e) {
    trackExecution('EVENT : remote.onicecandidate : ' + remote.localDescription);
    //console.log(e.candidate);
    if(e.candidate == null)  {
      console.log("Answer done");
      //console.log(JSON.stringify(remote.localDescription));
      currentAnswer = JSON.stringify(remote.localDescription);
      //:TODO:GOVIN:2020-03-12:Manage many users
      sendAnswer(currentAnswer, recipients[0]);
    }
  };


  remote.onconnectionstatechange = function(e) {
    trackExecution('EVENT : remote.onconnectionstatechange : ' + remote.connectionState);
    // console.log(remote.connectionState);
    if(remote.connectionState === "connected"){
      trackExecution("Remote connected");
    }

  };


  remote.oniceconnectionstatechange = function(e) {
    trackExecution('EVENT : remote.oniceconnectionstatechange : ' + remote.iceConnectionState);
    // console.log(remote.iceConnectionState);
    if(remote.iceConnectionState === "connected")
      trackExecution("Remote connected (ice)");
  };
}

function bindVideoWithStream(video, stream){
  trackExecution('CALL : bindVideoWithStream');
  video.srcObject = stream;

  video.onloadedmetadata = function(e) {
    video.play();
  };
}

function stopStreamedVideo(videoElem) {
  if(videoElem == null){
    trackExecution("stopStreamedVideo: videoElem is null. ");
    return;
  }

  const stream = videoElem.srcObject;
  if(stream == null){
    trackExecution("stopStreamedVideo: no stream assigned to component. ");
  }else{
    const tracks = stream.getTracks();
    tracks.forEach(function(track) {
      track.stop();
    });
  }

  videoElem.srcObject = null;
}

function sendMessage(){
  trackExecution('CALL : sendMessage');
  var text = document.getElementById("textToSend").value;

  if(text != "") {
    showMessage(text, "username"); //TODO:JCAMY:Replace it with real username

    document.getElementById("textToSend").value = "";

    if (dataChannel1 != null) {
      dataChannel1.send(text);
    }
    if (dataChannel2 != null) {
      dataChannel2.send(text);
    }
  }
}

function showMessage(data, username) {
  trackExecution('CALL : showMessage');
  var date = new Date();
  var log = document.createElement('p');
  var logValue = document.createTextNode(username + "[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "] : " + data);

  log.appendChild(logValue);
  document.getElementById("chatbox").appendChild(log);
}

function testDevices(callback, videoNeeded) {
  trackExecution('CALL : testDevices');
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
  })
  .catch(function(err) {
    trackExecution("ERR : " + err.name + " : " + err.message);
  });
}

function setUpDataChannel(dataChannel, username){
  trackExecution('CALL : setUpDataChannel');
  dataChannel.onopen = function(event) {
    dataChannel.send(username + " connected to chatbox");
  }

  dataChannel.onmessage = function(event) {
    showMessage(event.data, "remote username");
  }

  dataChannel.onclose = function(event){
    showMessage("Has disconneted. ", username)
  }
}


function createOffer(isAudioAvailable, isVideoAvailable) {
  trackExecution('CALL : createOffer');

  if(isVideoAvailable){
    isVideoAvailable = "width: " + document.getElementById("width") + ", height: " + document.getElementById("height") + ", frameRate: { min:" + document.getElementById("minframeRate") + ", max: " + document.getElementById("maxframeRate") + "}}"
  }

  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable , video: isVideoAvailable }).then(function(stream) {
  // navigator.mediaDevices.getUserMedia({
  //   audio: {
  //     sampleSize: 16
  //   }
  // }).then(function(stream) {

    //Retrieve tracks
    tracks =  stream.getTracks();
    for (const track of stream.getTracks()) {
      local.addTrack(track, stream);
    }

    //::GOVIN:2020-02-20:Binding stream with sendVideo element
    var video = document.getElementById('sendVideo');
    //var video = $("#sendVideo")[0];
    video.srcObject = stream;

    video.onloadedmetadata = function(e) {
      video.play();
    };

    //Create datachannel
    dataChannel1 = local.createDataChannel("dc1", {negotiated: true, id: 0});
    setUpDataChannel(dataChannel1, "sender");


    //Create offer
    local.createOffer().then(function(offer) {
      return local.setLocalDescription(offer).catch(function (err) {
        trackExecution("ERR : " + err.name + " : " + err.message);
      });
    }).catch(function(err) {
      trackExecution("ERR : " + err.name + " : " + err.message);
    });

  }).catch(function(err) {
    trackExecution("ERR : " + err.name + " : " + err.message);
  });
}

function receivedOffer(isAudioAvailable, isVideoAvailable){
  trackExecution('CALL : receivedOffer');
  initPeers();
  var offer = currentOffer;

  if(isVideoAvailable){
    isVideoAvailable = "width: " + document.getElementById("width") + ", height: " + document.getElementById("height") + ", frameRate: { min:" + document.getElementById("minframeRate") + ", max: " + document.getElementById("maxframeRate") + "}}"
  }

  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable, video: isVideoAvailable }).then(function(stream) {
  // navigator.mediaDevices.getUserMedia({
  //   audio: {
  //     sampleSize: 16
  //   }
  // }).then(function(stream) {
    //Retrieve tracks

    tracks =  stream.getTracks();
    for (const track of stream.getTracks()) {
      remote.addTrack(track, stream);
    }

    //::GOVIN:2020-02-20:Binding stream with sendVideo element
    var sendVideo = document.getElementById('sendVideo');
    //var sendVideo = $("#sendVideo")[0];
    sendVideo.srcObject = stream;

    sendVideo.onloadedmetadata = function(e) {
      sendVideo.play();
    };

    //Create datachannel
    dataChannel2 = remote.createDataChannel("dc2", {negotiated: true, id: 0});
    setUpDataChannel(dataChannel2, "receiver");


    //Save remote offer
    remote.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer))).catch(function (err) {
      trackExecution("ERR : " + err.name + " : " + err.message);
    });

    //Create answer
    remote.createAnswer().then(function(answer) {
      remote.setLocalDescription(answer).catch(function (err) {
        trackExecution("ERR : " + err.name + " : " + err.message);
      });
    }).catch(function(err) {
      trackExecution("ERR : " + err.name + " : " + err.message);
    });

  }).catch(function(err) {
    trackExecution("ERR : " + err.name + " : " + err.message);
  });
}

function receivedAnswer(answer){
  trackExecution('CALL : receivedAnswer');

  local.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer))).catch(function (err) {
    trackExecution("ERR : " + err.name + " : " + err.message);
  });
}

function trackExecution(data)
{
  if(debug)
  {
    if(perf)
    {
      //:TODO:ROUX:2020-02-25:add some information about performance
    }
    console.log(getTimestamp()+"  "+data)
    jsonExec = jsonExec + '\n' + data
  }
}
function getTimestamp(){
  var timestamp = Date.now();
  var date = new Date(timestamp);
  var timestamp = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear()
  + " "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
  return timestamp;
}
