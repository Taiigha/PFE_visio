
<template>
  <f7-page name="index">
    <h1>WebRTC Visioconference</h1>
    <div>
    	<label for="username">Username: </label>
    	<input type="text" name="url" id="username" required="">

    	<label for="url">URL: </label>
    	<input type="text" name="url" id="url" required="">

    	<label for="port">Port: </label>
    	<input type="text" name="port" id="port" required="">


    	<button id="connectToSignalingServerButton" onclick="connectToSignalingServer()">Connect to Signaling Server</button>
    </div>

    <div id="buttons">
    	<button id="callButton"  onclick="call()">Appeler</button>
    	<button id="hangUpButton" onclick="wantToHangUp()" disabled>Raccrocher</button>
    </div>


    <div class="text-info" id="chatbox" style="height:350px; overflow:auto; border: 2px solid #dedede;">
      <p> This is a chat box. </p>
    </div>
    <input type="text" id="textToSend">
    <button type="submit" id="sendText" class="btn" onclick="sendMessage()">Envoyer</button>

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
    </f7-page>
  </template>
