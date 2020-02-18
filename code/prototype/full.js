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
            {DtlsSrtpKeyAgreement: true}
            ]
          };

var peerConnection1 = new RTCPeerConnection(conf, opt);
var peerConnection2 = new RTCPeerConnection(conf, opt);

var dataChannel1 = null, isDataChannel1Open = false;
var dataChannel2 = null, isDataChannel2Open = false;

function gotStream(stream) {
  console.log(stream.getTracks());
  tracks = stream.getTracks();
}

navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(gotStream); //TODO à retirer intelligement

peerConnection1.onicecandidate = function(e) {
  console.log(e.candidate);
  if(e.candidate == null) {
    console.log("peerConnection1 localDescription");
    console.log(JSON.stringify(peerConnection1.localDescription));
    document.getElementById("offer").value = JSON.stringify(peerConnection1.localDescription);
  }
}

peerConnection2.onicecandidate = function(e) {
  console.log(e.candidate);
  if(e.candidate == null)  {
    console.log("peerConnection2 localDescription");
    console.log(JSON.stringify(peerConnection2.localDescription));
    document.getElementById("answer").value = JSON.stringify(peerConnection2.localDescription);
  }
}

//DEBUG
peerConnection1.onconnectionstatechange = function(e) {
  // console.log(peerConnection1.connectionState);
  if(peerConnection1.connectionState === "connected")
    console.log("pc1 connected")
}

peerConnection2.onconnectionstatechange = function(e) {
  // console.log(peerConnection2.connectionState);
  if(peerConnection2.connectionState === "connected")
    console.log("pc2 connected")
}

peerConnection1.oniceconnectionstatechange = function(e) {
  // console.log(peerConnection1.iceConnectionState);
  if(peerConnection1.iceConnectionState === "connected")
    console.log("pc1 connected (ice)")
}

peerConnection2.oniceconnectionstatechange = function(e) {
  // console.log(peerConnection2.iceConnectionState);
  if(peerConnection2.iceConnectionState === "connected")
    console.log("pc2 connected (ice)")
}
//END DEBUG

function createOffer() { //DIFF Datachannel
  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
    var audio = document.getElementById('audio');
    audio.srcObject = stream;
    audio.play();
    peerConnection1.addTrack(tracks[0]);
    dataChannel1 = peerConnection1.createDataChannel("dc1", {negotiated: true, id: 0});
    dataChannel1.onopen= function(event) {
      dataChannel1.send('Hi you!');
      isDataChannel1Open = true;
    }
    dataChannel1.onmessage = function(event) {
      console.log(event.data);
      showMessage(event.data, "pc2");
    }
    peerConnection1.createOffer().then(function(offer) {
      return peerConnection1.setLocalDescription(offer);
    });
  });
}

function receivedOffer(){
  var offer = document.getElementById("offer").value;

  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
    var audio = document.getElementById('audio');
    audio.srcObject = stream;
    audio.play();
    peerConnection2.addTrack(tracks[0]);
    dataChannel2 = peerConnection2.createDataChannel("dc2", {negotiated: true, id: 0});
    dataChannel2.onopen= function(event) {
      dataChannel2.send('Hi you!');
      isDataChannel2Open = true;
    }
    dataChannel2.onmessage = function(event) {
      console.log(event.data);
      showMessage(event.data, "pc2");
    }
    peerConnection2.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
    peerConnection2.createAnswer().then(function(answer) {
      peerConnection2.setLocalDescription(answer);
    });
  });
}

function receivedAnswer(){
 var answer = document.getElementById("answer").value;

 peerConnection1.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
}

function sendMessage(){
  showMessage(document.getElementById("textToSend").value, "pc1");
  if (isDataChannel1Open) { //Peut on envoyer sur un seul channel ?
    dataChannel1.send(document.getElementById("textToSend").value);
  }
  if (isDataChannel2Open) {
    dataChannel2.send(document.getElementById("textToSend").value);
  }
}

function showMessage(data, pc) {
  var date = new Date();
  var log = document.createElement('p');
  var logValue = document.createTextNode(pc + "[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "] : " + data);
  log.appendChild(logValue);
  document.getElementById("chatbox").appendChild(log);
}
