# PFE_visio# PFE_visio
PFE_visio is an end of studie's project which permit to do videoconference using WebRTC.

## Instructions
Our webapp can only function if a SIGNALING server is working.

In order to use our SIGNALING server implementation you need to install some dependencies :
```bash
npm install bufferutil utf-8-validate ws
```
Then, to launch the server enter the following command
```bash 
nodejs path/to/server-http.js
```
To use the webapp, open the file code/index.html in your browser. You can also generate an Electron executable by entering the following command in the code/prototype/PFE_elec/ directory.
```bash
cordova build
```
You will then be asked to enter informations about the SIGNALING server you want to use. After this step you can enter the IP address of the person you want to call.

You can also build an Cordova app but it is not fully functional (you can only connecto SIGNALING server) by entering the same commande as above in the code/prototype/cordova_mobile/ directory or directly install the apk foundable in code/exec/.

## Content :
### code/ 
It contains all definitive and prototype code. 

code/css/ contains style sheet

code/exec/ contains an .apk of the webapp using Cordova

code/js contains JavaScript client-side and server-side code

code/prototype/ contains prototype code like older versions.

### test/
It contains all code use for the tests. 

In order to launch the tests you need to have a working SIGNALING server. This server must have to be launched before you open the file server-message-test.html on your browser, or refresh the page if it's not the case.

Then click on "Begin Test".

## Tree
.
├── code
│   ├── css
│   │   └── main.css
│   ├── exec
│   │   └── app-debug.apk
│   ├── index.html
│   ├── js
│   │   ├── adapter.js
│   │   ├── jquery-min.js
│   │   ├── main.js
│   │   └── server-http.js
│   └── prototype
│       ├── cordova_mobile
│       │   └── ...
│       ├── PFE_elec
│       │   └── ...
│       ├── piegon-server.html
│       ├── pigeon.html
│       ├── pigeon.js
│       ├── pigeon-server.js
│       ├── server-https.js
│       └── video-server-signaling
│           ├── adapter.js
│           ├── jquery-min.js
│           ├── video-server-signaling.html
│           └── video-server-signaling.js
├── README.md
├── test
│   ├── adapter.js
│   ├── jquery-min.js
│   ├── server-http-for-test.js
│   ├── server-http.js
│   ├── server-message-test
│   │   ├── server-message-test.css
│   │   ├── server-message-test.html
│   │   └── server-message-test.js
│   ├── video-server-signaling.html
│   └── video-server-signaling.js
