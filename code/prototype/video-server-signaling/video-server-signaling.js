var tracks = [];

var conf = {iceServers: [
  {urls: "stun:stun.l.google.com:19302"}/*,
  {url: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}*/ //TURN Server, uncomment if necessary. Usable for development purpose only.
]
};

var opt = {optional: [
  {DtlsSrtpKeyAgreement: true}
]
};

var local = new RTCPeerConnection(conf, opt);
var remote = new RTCPeerConnection(conf, opt);

var dataChannel1 = null;
var dataChannel2 = null;

var connSignalingServer = null;
//:GLITCH:GOVIN:2020-02-20:Awfull usernames management to change
var other_username = "You";
var my_username = "Me";
//:GLITCH:GOVIN:2020-02-20:
var currentAnswer = null, currentOffer = null;
//:GLITCH:GOVIN:2020-02-20:To avoid putting manually all the information for the tests.
//:GLITCH:GOVIN:2020-02-20:Using JQuery to procceed because the dom is not loaded to link with the button
$(document).ready(e => {
  $("#username").val("Me");
  $("#url").val("192.168.0.15");
  $("#port").val("9090");

  //:COMMENT:GOVIN:2020-02-20:Link the #id button on click event with a function
  $("#connectToSignalingServerButton").on("click", connectToSignalingServer);

  $("#callButton").on("click", e => {
    testDevices(createOffer);
  })
});



function connectToSignalingServer(){

  //:TODO:GOVIN:2020-02-20:Manage spaming the "Connect To Signaling Server Button" or disconnection then reconnection to a new server
  if(connSignalingServer != null){
    console.log("Already connected to a signaling server. ");
    return;
  }
  var address = $("#url").val();
  var port = $("#port").val();
  var username = $("#username").val();
  //Regex match
  if(!(address == null || address == "") && !(port == null || port == "")
  && !(username == null || username == "")
  ){
    connSignalingServer = createConnectionToSignalingServer(address, port, username);
    connSignalingServer.onopen = e => {
      console.log('socket connection opened properly');
      var message = {
        type: "login",
        username: username
      };

      sendMessageToSignalingServer(message);
    }
  }else{
    console.log("Paramêtres manquants pour effectuer la connexion. ");
  }
}

function createConnectionToSignalingServer(address, port, username){
  console.log("Connexion à "+ address +" au port "+ port +". ");
  var ws = new WebSocket("ws://"+address+":"+port)

  ws.onmessage = function (evt) {
    console.log("[Before Processing] Message received = "+evt.data);
    var data;
    //:COMMENT:GOVIN:2020-02-20:message shall contain {"type":"something"} and shall be in JSON format
    try {
      data = JSON.parse(evt.data);
      //:TODO:GOVIN:2020-02-20:Add the message in a log file
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
      //:TODO:GOVIN:2020-02-20:Add the error message in a log file
    }

    switch (data.type) {

      case "offer":
        console.log("Offer : ");
        //console.log(data);
        //:GLITCH:GOVIN:2020-02-20:Awful to change
        currentOffer = data.offer;
        other_username = data.from;
        testDevices(receivedOffer);
        break;

      case "answer":
        console.log("Answer : ");
        //console.log(data);
        //:GLITCH:GOVIN:2020-02-20:Awful to change
        currentAnswer = data.answer;
        receivedAnswer();
        break;

      case "candidate":
        console.log("Candidate : "+data);
        break;

      case "comment":
        console.log("comment : "+data);
        break;

      case "login":
        console.log("login : ");
      //  console.log(data);
        //:GLITCH:GOVIN:2020-02-20:To change
        if(data.success){
          my_username = data.to;
        }

        break;

      default:
        console.log("Default on message :");
        console.log(data);
        break;
    }
  };

  ws.onclose = function () {
    console.log("Connection closed...");
  };

  ws.onerror = function(err){
    console.error("Erreur lors de la connection à la WebSocket : ", err);
  }

  return ws;
}
function sendMessageToSignalingServer(message){
  if(connSignalingServer != null){
    connSignalingServer.send(JSON.stringify(message));
  }else{
    console.log("Error : No connection to signaling server. ");
  }

}

function sendOffer(offer){
  if(offer == null){
    console.log("Offer is null while trying to send it. ");
    return;
  }

  console.log("Sending offer through signaling server... ");
  var message = {
    type:"offer",
    to:other_username,
    offer: offer
  }
  sendMessageToSignalingServer(message);
}

function sendAnswer(answer){
  if(answer == null){
    console.log("Answer is null while trying to send it. ");
    return;
  }
  console.log("Sending answer through signaling server... ");
  var message = {
    type:"answer",
    to:other_username,
    answer: answer
  }
  sendMessageToSignalingServer(message);
}

//Events
local.onicecandidate = function(e) {
  //console.log(e.candidate);
  if(e.candidate == null) {
    console.log("offer done");
    //console.log(JSON.stringify(local.localDescription));
    currentOffer = JSON.stringify(local.localDescription);

    sendOffer(currentOffer);
  }
}

function bindVideoWithStream(video, stream){
  video.srcObject = stream;

  video.onloadedmetadata = function(e) {
    video.play();
  };
}

remote.ontrack = function(e){
  var receiveVideo = $("#receiveVideo")[0];
  var stream = null;

  if (e.streams && e.streams[0]) {
    console.log("COUCOU");
    console.log(e.streams[0]);
    console.log(e.streams[0].getTracks());
    stream = e.streams[0];
    bindVideoWithStream(receiveVideo, stream);
  }
}

remote.onicecandidate = function(e) {
  //console.log(e.candidate);
  if(e.candidate == null)  {
    console.log("answer done");
    //console.log(JSON.stringify(remote.localDescription));
    currentAnswer = JSON.stringify(remote.localDescription);
    sendAnswer(currentAnswer);
  }
}

local.onconnectionstatechange = function(e) {
  // console.log(local.connectionState);
  if(local.connectionState === "connected")
  console.log("pc1 connected")
}

remote.onconnectionstatechange = function(e) {
  // console.log(remote.connectionState);
  if(remote.connectionState === "connected")
  console.log("pc2 connected")
}

local.oniceconnectionstatechange = function(e) {
  // console.log(local.iceConnectionState);
  if(local.iceConnectionState === "connected")
  console.log("pc1 connected (ice)")
}

remote.oniceconnectionstatechange = function(e) {
  // console.log(remote.iceConnectionState);
  if(remote.iceConnectionState === "connected")
  console.log("pc2 connected (ice)")
}
//END Events

function sendMessage(){
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
  var date = new Date();
  var log = document.createElement('p');
  var logValue = document.createTextNode(username + "[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "] : " + data);

  log.appendChild(logValue);
  document.getElementById("chatbox").appendChild(log);
}

function testDevices(callback) {
  var isAudioAvailable = false, isVideoAvailable = false;
  //Test if audio and video devices are availables
  navigator.mediaDevices.enumerateDevices().then(function(devices) {
    devices.forEach(function(device) {
      if(device.kind === "audioinput")
      isAudioAvailable = true;
      if(device.kind === "videoinput")
      isVideoAvailable = true;
    });
    callback(isAudioAvailable, isVideoAvailable);
  })
  .catch(function(err) {
    console.log(err.name + " : " + err.message);
  });
}

function setUpDataChannel(dataChannel, username){
  dataChannel.onopen= function(event) {
    dataChannel.send(username + " connected to chatbox");
  }

  dataChannel.onmessage = function(event) {
    showMessage(event.data, username);
  }
}


function createOffer(isAudioAvailable, isVideoAvailable) {
  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable, video: isVideoAvailable }).then(function(stream) {
    //Retrieve tracks
    tracks =  stream.getTracks();
    for (const track of stream.getTracks()) {
      local.addTrack(track, stream);
    }
    //local.addTrack(tracks); //TODO:JCAMY:Find if it is necessary to do differently with video balises : is there more than 1 tracks ? Then how to detect which one we want to use.

    //::GOVIN:2020-02-20:Binding stream with sendVideo element
    var video = $("#sendVideo")[0];
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
        console.log(err.name + " : " + err.message);
      });
    }).catch(function(err) {
      console.log(err.name + " : " + err.message);
    });

  }).catch(function(err) {
    console.log(err.name + " : " + err.message);
  });
}

function receivedOffer(isAudioAvailable, isVideoAvailable){
  var offer = currentOffer;

  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable, video: isVideoAvailable }).then(function(stream) {
    //Retrieve tracks

    tracks =  stream.getTracks();
    for (const track of stream.getTracks()) {
      local.addTrack(track, stream);
    }

    //::GOVIN:2020-02-20:Binding stream with sendVideo element
    var sendVideo = $("#sendVideo")[0];
    sendVideo.srcObject = stream;

    sendVideo.onloadedmetadata = function(e) {
      sendVideo.play();
    };

    //Create datachannel
    dataChannel2 = remote.createDataChannel("dc2", {negotiated: true, id: 0});
    setUpDataChannel(dataChannel2, "receiver");


    //Save remote offer
    remote.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer))).catch(function (err) {
      console.log(err.name + " : " + err.message);
    });

    //Create answer
    remote.createAnswer().then(function(answer) {
      remote.setLocalDescription(answer).catch(function (err) {
        console.log(err.name + " : " + err.message);
      });
    }).catch(function(err) {
      console.log(err.name + " : " + err.message);
    });

  }).catch(function(err) {
    console.log(err.name + " : " + err.message);
  });
}

function receivedAnswer(){
  var answer = currentAnswer;
  local.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer))).catch(function (err) {
    console.log(err.name + " : " + err.message);
  });
}
