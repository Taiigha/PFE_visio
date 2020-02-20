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


//Events
local.onicecandidate = function(e) {
  //console.log(e.candidate);
  if(e.candidate == null) {
    console.log("offer done");
    //console.log(JSON.stringify(local.localDescription));
    var offer = JSON.stringify(local.localDescription);
    document.getElementById("offer").value = offer;
  }
}

remote.onicecandidate = function(e) {
  //console.log(e.candidate);
  if(e.candidate == null)  {
    console.log("answer done");
    //console.log(JSON.stringify(remote.localDescription));
    var answer = JSON.stringify(remote.localDescription)
    document.getElementById("answer").value = answer;

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

function setUpAudio(peer) {
  peer.ontrack = function(e) {
    var audio = document.getElementById("audio");
    audio.srcObject = e.streams[0];
    audio.play();
  }
}

function createOffer(isAudioAvailable, isVideoAvailable) {
  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable, video: isVideoAvailable }).then(function(stream) {
    //Retrieve tracks
    tracks =  stream.getTracks();
    local.addTrack(tracks[0]); //TODO:JCAMY:Find if it is necessary to do differently with video balises : is there more than 1 tracks ? Then how to detect which one we want to use.

    //Create datachannel
    dataChannel1 = local.createDataChannel("dc1", {negotiated: true, id: 0});
    setUpDataChannel(dataChannel1, "sender");

    setUpAudio(local);

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
  var offer = document.getElementById("offer").value;

  navigator.mediaDevices.getUserMedia({ audio: isAudioAvailable, video: isVideoAvailable }).then(function(stream) {
    //Retrieve tracks
    tracks = stream.getTracks();
    remote.addTrack(tracks[0]);

    //Create datachannel
    dataChannel2 = remote.createDataChannel("dc2", {negotiated: true, id: 0});
    setUpDataChannel(dataChannel2, "receiver");

    setUpAudio(remote);

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
 var answer = document.getElementById("answer").value;

 local.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer))).catch(function (err) {
   console.log(err.name + " : " + err.message);
 });
}
