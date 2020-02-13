//TODO bien mettre toutes les fonctions de gestion d'erreurs etc
//TODO uniformiser le code et les noms de variables
//TODO mettre des console.log à chaque étapes ?
var tracks = [];

var conf = {iceServers: [
              {url: "stun:stun.l.google.com:19302"}/*,
              {url: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}*/ //Uncomment only if necessary, usable for development purpose only
              ]
            };

var opt = {optional: [
            {DtlsSrtpKeyAgreement: true},
            {RtpDataChannels: true}
            ]
          };

//Pick up streams
function gotStream(stream) {
  tracks = stream.getTracks();
}

//Pick up medias
var promise = navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(gotStream);

function createRTCOffer() {
  //TODO Vérifier si plusieurs tracks.
  //TODO prendre le flux audio et le vidéo à part
  //Create a new RTC connection
  var connection = new RTCPeerConnection(conf, opt);
  connection.addTrack(tracks[0]);
  //TODO Créer un data channel (pour du textuel) ?
  //Create a new offer
  connection.createOffer().then(function(offer) {
    return connection.setLocalDescription(offer);
  });
  connection.onicecandidate = function(e) {
    if(e.candidate == null) {
	  console.log("Offer :");
      console.log(JSON.stringify(connection.localDescription));
    }
  }
}
