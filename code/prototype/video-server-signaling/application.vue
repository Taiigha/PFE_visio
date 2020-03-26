<b-container>
    <h1>WebRTC Visioconference</h1>
    <div id="connectToSignalingServer">
      <b-container fluid>
      <b-row class="my-1">
        <b-col sm="2">
          <label for="input-small">Nom d'utilisateur : </label>
        </b-col>
        <b-col sm="10">
          <b-form-input id="username" placeholder="Votre nom d'utilisateur"></b-form-input>
        </b-col>
      </b-row>

      <b-row class="my-1">
        <b-col sm="2">
          <label for="input-default">URL : </label>
        </b-col>
        <b-col sm="10">
          <b-form-input id="url" placeholder="Entrer l'IP ou l'URL" value="127.0.0.1" ></b-form-input>
        </b-col>
      </b-row>

      <b-row class="my-1">
        <b-col sm="2">
          <label for="input-large">Port : </label>
        </b-col>
        <b-col sm="10">
          <b-form-input id="port"  placeholder="Entrer le port" value="9090"></b-form-input>
        </b-col>
      </b-row>
    </b-container>

    <b-button block variant="outline-dark" id="connectToSignalingServerButton"  onclick="connectToSignalingServer()">Connexion au serveur signaling </b-button>
    </div>

    <div id="call">

      <div id="configuration">
        <b-container fluid>
        <b-row class="my-1">
          <b-col sm="2">
            <label for="input-small">Largeur : </label>
          </b-col>
          <b-col sm="10">
            <b-form-input name="width" id="width" placeholder="Largeur" value="1920"></b-form-input>
          </b-col>
        </b-row>

        <b-row class="my-1">
          <b-col sm="2">
            <label for="input-default">Hauteur : </label>
          </b-col>
          <b-col sm="10">
            <b-form-input name="height" id="height" placeholder="Hauteur" value="1080" ></b-form-input>
          </b-col>
        </b-row>

        <b-row class="my-1">
          <b-col sm="2">
            <label for="input-large">Images par seconde max : </label>
          </b-col>
          <b-col sm="10">
            <b-form-input id="port" placeholder="Images par seconde maximum" value="60"></b-form-input>
          </b-col>
        </b-row>

        <b-row class="my-1">
          <b-col sm="2">
            <label for="input-large">Images par seconde min : </label>
          </b-col>
          <b-col sm="10">
            <b-form-input name="minframeRate" id="minframeRate" placeholder="Images par seconde minimum" value="20" ></b-form-input>
          </b-col>
        </b-row>

        <b-row class="my-1">
          <b-col sm="2">
            <label for="input-large">ip de la cible : </label>
          </b-col>
          <b-col sm="10">
            <b-form-input name="recipient" id="recipient" placeholder="192.168.0.0"></b-form-input>
          </b-col>
        </b-row>
      </b-container>
      </div>
      </br>
      <div id="buttons" >
          <b-button variant="success" id="audioCallButton" onclick="call(false)">Appel audio</b-button>
          <b-button variant="success" id="videoCallbutton" onclick="call(true)">Appel vidéo</b-button>

      </div>
      </br>
    </div>

    <div id="inCommunication" >
    <b-button variant="danger" id="hangUpButton" onclick="wantToHangUp()">Raccrocher</b-button>
    <div class="text-info" id="chatbox" style="height:350px; overflow:auto; border: 2px solid #dedede;">
        <p> This is a chat box. </p>
    </div>
    <input type="text" id="textToSend">
    <b-button variant="primary" type="submit" id="sendText" class="btn" onclick="sendMessage()">Envoyer</b-button>

    <div id="send">
        <h2>Send </h2>
        <video id="sendVideo" muted>
        </video>
    </div>

    <div id="receive">
        <h2>Receive</h2>
        <video id="receiveVideo">
        </video>
    </div>

  </div>
</b-container>
