//TODO bien mettre toutes les fonctions de gestion d'erreurs etc
//TODO uniformiser le code et les noms de variables
//TODO mettre des console.log à chaque étapes ?
//TODO create data channel ?
//TODO Vérifier si plusieurs tracks.
//TODO prendre le flux audio et le vidéo à part
var tracks = [];

//https://webrtc.github.io/samples/src/content/peerpeerConnection1/trickle-ice/ pour tester les serveurs stun et turn
var conf = {iceServers: [
              {url: "stun:stun.l.google.com:19302"}/*,
              {url: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}*/
              ]
            };
var opt = {optional: [
            {DtlsSrtpKeyAgreement: true},
            {RtpDataChannels: true}
            ]
          };

var peerConnection1 = new RTCPeerConnection(conf, opt);
var peerConnection2 = new RTCPeerConnection(conf, opt);
//var signalingChannel = new XMLHttpRequest();

function gotStream(stream) {
  tracks = stream.getTracks();
}

function gotResponse(response) {
  console.log(response);
  /*if(response.sdp)
    console.log(response.sdp);
  else if(response.candidate)
    console.log(response.candidate);*/
}

var promise = navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(gotStream);

peerConnection1.onicecandidate = function(e) {
  if(e.candidate == null) {
    console.log("peerConnection1 localDescription");
    console.log(JSON.stringify(peerConnection1.localDescription));
    document.getElementById("offer").value = JSON.stringify(peerConnection1.localDescription);
    /*if (signalingChannel.readyState === 1) {
      signalingChannel.send(JSON.stringify(peerConnection1.localDescription));
    }*/
  }
}

peerConnection2.onicecandidate = function(e) {
  if(e.candidate == null)  {
    console.log("peerConnection2 localDescription");
    console.log(JSON.stringify(peerConnection2.localDescription));
    document.getElementById("answer").value = JSON.stringify(peerConnection2.localDescription);
    /*if (signalingChannel.readyState === 1) {
      signalingChannel.send(JSON.stringify(peerConnection1.localDescription));
    }*/
  }
}

peerConnection1.onconnection = function(e) {
  console.log("pc1 connected")
}

peerConnection2.onconnection = function(e) {
  console.log("pc2 connected")
}

function createOffer() {
  peerConnection1.addTrack(tracks[0]);
  peerConnection1.createOffer().then(function(offer) {
    return peerConnection1.setLocalDescription(offer);
  });
  /*signalingChannel.open("POST", "http://localhost:8000/"); //TODO fermer la connexion
  signalingChannel.setRequestHeader("Access-Control-Allow-Origin", "*");
  signalingChannel.setRequestHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  signalingChannel.setRequestHeader("Access-Control-Allow-Headers", "Origin, Content-Type, X-Auth-Token");*/
}

function receivedOffer(){
  var offer = document.getElementById("offer").value;

  peerConnection2.addTrack(tracks[0]);
  peerConnection2.setRemoteDescription(JSON.parse(offer));
  peerConnection2.createAnswer().then(function(answer) {
    peerConnection2.setLocalDescription(answer);
  });
}

function receivedAnswer(){
 var answer = document.getElementById("answer").value;

 peerConnection1.setRemoteDescription(JSON.parse(answer));
}
/*
signalingChannel.onreadystatechange = function() {
  console.log(signalingChannel.readyState);
  if (signalingChannel.readyState === 4 && signalingChannel.responseText != "") {
      gotResponse(JSON.parse(signalingChannel.responseText));
    }
}*/
