//TODO bien mettre toutes les fonctions de gestion d'erreurs etc
//TODO uniformiser le code et les noms de variables
//TODO mettre des console.log à chaque étapes ?
//TODO create data channel ?
//TODO Vérifier si plusieurs tracks.
//TODO prendre le flux audio et le vidéo à part
var tracks = [];

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

function gotStream(stream) {
  tracks = stream.getTracks();
}

//navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(gotStream);

peerConnection1.onicecandidate = function(e) {
  if(e.candidate == null) {
    console.log("peerConnection1 localDescription");
    console.log(JSON.stringify(peerConnection1.localDescription));
    document.getElementById("offer").value = JSON.stringify(peerConnection1.localDescription);
  }
}

peerConnection2.onicecandidate = function(e) {
  if(e.candidate == null)  {
    console.log("peerConnection2 localDescription");
    console.log(JSON.stringify(peerConnection2.localDescription));
    document.getElementById("answer").value = JSON.stringify(peerConnection2.localDescription);
  }
}

//DEBUG
peerConnection1.onconnectionstatechange = function(e) {
  console.log(peerConnection1.connectionState);
  if(e.connectionState === "connected")
    console.log("pc1 connected")
}

peerConnection2.onconnectionstatechange = function(e) {
  console.log(peerConnection2.connectionState);
  if(e.connectionState === "connected")
    console.log("pc2 connected")
}

peerConnection1.oniceconnectionstatechange = function(e) {
  console.log(peerConnection1.iceConnectionState);
  if(e.iceConnectionState === "connected")
    console.log("pc1 connected (ice)")
}

peerConnection2.oniceconnectionstatechange = function(e) {
  console.log(peerConnection2.iceConnectionState);
  if(e.iceConnectionState === "connected")
    console.log("pc2 connected (ice)")
}
//END DEBUG

function createOffer() {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
    peerConnection1.addStream(stream);
    peerConnection1.createOffer().then(function(offer) {
      return peerConnection1.setLocalDescription(offer);
    });
  });
  /*peerConnection1.addTrack(tracks[0]);
  peerConnection1.createOffer().then(function(offer) {
    return peerConnection1.setLocalDescription(offer);
  });*/
}

function receivedOffer(){
  var offer = document.getElementById("offer").value;

  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
    peerConnection2.addStream(stream);
    peerConnection2.setRemoteDescription(JSON.parse(offer));
    peerConnection2.createAnswer().then(function(answer) {
      peerConnection2.setLocalDescription(answer);
    });
  });
  /*peerConnection2.addTrack(tracks[0]);
  peerConnection2.setRemoteDescription(JSON.parse(offer));
  peerConnection2.createAnswer().then(function(answer) {
    peerConnection2.setLocalDescription(answer);
  });*/
}

function receivedAnswer(){
 var answer = document.getElementById("answer").value;

 peerConnection1.setRemoteDescription(JSON.parse(answer));
}
