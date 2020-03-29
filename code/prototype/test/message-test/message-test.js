const IP_ADDRESS = "127.0.0.1";
const PORT = 9090;

var ws = new WebSocket("ws://"+IP_ADDRESS+":"+PORT);

const USERNAME = "Me";
const RECIPIENT = "127.0.0.1"
const SERVER_NAME = "Server Signaling";
const SELF = USERNAME+"@"+IP_ADDRESS;

const ERROR_ID = "error";

const UNKNOWN_RECIPIENT = "192.168.0.0";
const ERROR_NOT_CONNECTED_MESSAGE = "Error: "+UNKNOWN_RECIPIENT+" is not connected to the server. ";
const ERROR_NULL_OFFER_MESSAGE = "Error: The offer you sent is null. ";
const ERROR_NULL_ANSWER_MESSAGE = "Error: The answer you sent is null. ";

var beginButton = document.getElementById("beginTestButton");
beginButton.onclick = beginTest;

ws.onmessage = function(evt){
  var data;

  try {
    data = JSON.parse(evt.data);
  } catch (e) {
    trackExecution("ERR : Invalid JSON");
    data = {};
    return;
  }

  switch(data.type){
      case "login":
        loginTestAnswer(data);
      break;

      case "offer":
        if(leaveTestNumber == 0){
          leaveTestNumber++;
          leaveTest();
        }else{
          offerTestAnswer(data);
        }
      break;

      case "answer":
        answerTestAnswer(data);
      break;

      case "leave":
        leaveTestAnswer(data);
      break;

      case "refuse":
        refuseTestAnswer(data);
      break;

      case "error":
        switch(data.errorType){

          case OFFER_ID:
            offerTestAnswer(data);
          break;

          case ANSWER_ID:
            answerTestAnswer(data);
          break;

          default:
            defaultTestAnswer(data);
            break;
        }
      break;

      default:
      //  defaultTest(data);
      break;
  }
}

function beginTest(){
  loginTest();
  offerTest();
  answerTest();
  leaveTest();
  refuseTest();
  defaultTest();
}

/*
 * Refuse
 */
var defaultTestNumber = 0;
const DEFAULT_ID = "default";
const WRONG_DATA_TYPE = "ezrubioze_";
const COMMAND_NOT_FOUND_MESSAGE = "Command not found: ";
const DEFAULT_MESSAGE = {
  type: WRONG_DATA_TYPE
}
function defaultTestAnswer(data){
  writeResult(REFUSE_ID, "Start test Default :");
  writeResult(REFUSE_ID, "Test " + defaultTestNumber + " : (type is error)", (data.type === ERROR_ID));
  defaultTestNumber++;
  writeResult(REFUSE_ID, "Test " + defaultTestNumber + " : (message command not found)", (data.message === (COMMAND_NOT_FOUND_MESSAGE+WRONG_DATA_TYPE)));
  defaultTestNumber++;
  writeResult(REFUSE_ID, "Start test Default :");

}
function defaultTest(){
  sendMessageToSignalingServer(JSON.stringify(DEFAULT_MESSAGE));
}

/*
 * Refuse
 */
var refuseTestNumber = 0;
const REFUSE_ID = "refuse";

const REFUSE_MESSAGE = {
  type: "refuse",
  to: RECIPIENT
}

function refuseTestAnswer(data){
  writeResult(REFUSE_ID, "Start test Refuse :");
  writeResult(REFUSE_ID, "Test " + refuseTestNumber + " : (type is refuse)", (data.type === REFUSE_ID));
  refuseTestNumber++;
  writeResult(REFUSE_ID, "Test " + refuseTestNumber + " : (recipient is self)", (data.from === SELF));
  refuseTestNumber++;
  writeResult(REFUSE_ID, "Test " + refuseTestNumber + " : (sender is self)", (data.to === SELF));
  refuseTestNumber++;
  writeResult(REFUSE_ID, "End test Refuse. ");
}

function refuseTest(){
  sendMessageToSignalingServer(JSON.stringify(REFUSE_MESSAGE));
}
/*
 * Answer
 */

 var answerTestNumber = 0;
 var numberOfReceivedAnswer = 0;
 var numberOfGoodReceivedAnswer = 0;

 const ANSWER_ID = "answer";
 const FAKE_ANSWER = "fake_answer";
 const NUMBER_OF_FAKE_ANSWER_SEND = 1;

 var ANSWER_TEST_8_DIV = null;

 var ANSWER_MESSAGE = {
   type: ANSWER_ID,
   to: RECIPIENT,
   answer: FAKE_ANSWER
 }

 function answerTestAnswer(data){
   switch(answerTestNumber){
     case 0:
     writeResult(ANSWER_ID, "Start test Answer :");
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (type is offer)", (data.type === ANSWER_ID));
     answerTestNumber++;
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (sender is self)", (data.from === SELF));
     answerTestNumber++;
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (recipient is SELF)", (data.from === SELF));
     answerTestNumber++;
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (answer is fake_answer)", (data.answer === FAKE_ANSWER));
     answerTestNumber++;
     writeResult(ANSWER_ID, "");
     answerTest();
     break;

     case 4:
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (answer failed error type)", (data.type === ERROR_ID));
     answerTestNumber++;
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (answer failed error errorType)", (data.errorType === ANSWER_ID));
     answerTestNumber++;
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (answer failed error message)", (data.errorMessage === ERROR_NOT_CONNECTED_MESSAGE));
     answerTestNumber++;
     writeResult(ANSWER_ID, "");
     answerTest();
     break;

     case 7:
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (answer sent is null error type)", (data.type === ERROR_ID));
     answerTestNumber++;
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (answer sent is null error errorType)", (data.errorType === ANSWER_ID));
     answerTestNumber++;
     writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (answer sent is null error message)", (data.errorMessage === ERROR_NULL_ANSWER_MESSAGE));
     answerTestNumber++;
     writeResult(ANSWER_ID, "");
     answerTest();
     break;

     case 10:
       numberOfGoodReceivedOffer += (data.to === SELF && data.from === SELF && data.offer === FAKE_OFFER?1:0);
       numberOfReceivedOffer++;
       if(numberOfGoodReceivedOffer == NUMBER_OF_FAKE_OFFER_SEND){
         writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (receive "+NUMBER_OF_FAKE_OFFER_SEND+" offer)", (numberOfReceivedOffer === NUMBER_OF_FAKE_OFFER_SEND));
       }
       else if(numberOfReceivedOffer == NUMBER_OF_FAKE_OFFER_SEND){
         writeResult(ANSWER_ID, "Test " + answerTestNumber + " : (receive "+NUMBER_OF_FAKE_OFFER_SEND+" offer)", (numberOfReceivedOffer === NUMBER_OF_FAKE_OFFER_SEND));
         answerTestNumber++;
       }
       writeResult(ANSWER_ID, "End test Answer. ");
     break;
   }

 }

 function answerTest(){
   if(answerTestNumber == 0){
     sendMessageToSignalingServer(JSON.stringify(ANSWER_MESSAGE));
     return;
   }

   if(answerTestNumber == 4){
     ANSWER_MESSAGE.to = UNKNOWN_RECIPIENT;
     sendMessageToSignalingServer(JSON.stringify(ANSWER_MESSAGE));
     return;
   }

   if(answerTestNumber == 7){
     ANSWER_MESSAGE.to = RECIPIENT;
     ANSWER_MESSAGE.answer = null;
     sendMessageToSignalingServer(JSON.stringify(ANSWER_MESSAGE));
     return;
   }

   if(answerTestNumber == 10){
     ANSWER_MESSAGE.answer = FAKE_ANSWER;
     for(var i = 0; i < NUMBER_OF_FAKE_ANSWER_SEND; i++){
       sendMessageToSignalingServer(JSON.stringify(ANSWER_MESSAGE));
     }
     return;
   }
 }

/*
 * Offer
 */
var offerTestNumber = 0;
var numberOfReceivedOffer = 0;
var numberOfGoodReceivedOffer = 0;

const OFFER_ID = "offer";
const IS_VIDEO_CALL = true;
const FAKE_OFFER = "fake_offer";
const NUMBER_OF_FAKE_OFFER_SEND = 1;


var OFFER_TEST_8_DIV = null;

var OFFER_MESSAGE = {
  type: OFFER_ID,
  to: RECIPIENT,
  offer: FAKE_OFFER,
  videoCall: IS_VIDEO_CALL
}

function offerTestAnswer(data){
  switch(offerTestNumber){
    case 0:
    writeResult(OFFER_ID, "Start test Offer :");
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (type is offer)", (data.type === OFFER_ID));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (sender is self)", (data.from === SELF));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (recipient is SELF)", (data.from === SELF));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (videoCall true)", (data.videoCall == IS_VIDEO_CALL));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (offer is fake_offer)", (data.offer === FAKE_OFFER));
    offerTestNumber++;
    writeResult(OFFER_ID, "");
    offerTest();
    break;

    case 5:
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (offer failed type)", (data.type === ERROR_ID));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (offer failed error type)", (data.errorType === OFFER_ID));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (offer failed error message)", (data.errorMessage === ERROR_NOT_CONNECTED_MESSAGE));
    offerTestNumber++;
    writeResult(OFFER_ID, "");
    offerTest();
    break;

    case 8:
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (offer is null type)", (data.type === ERROR_ID));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (offer is null error type)", (data.errorType === OFFER_ID));
    offerTestNumber++;
    writeResult(OFFER_ID, "Test " + offerTestNumber + " : (offer is null error message)", (data.errorMessage === ERROR_NULL_OFFER_MESSAGE));
    offerTestNumber++;
    writeResult(OFFER_ID, "");
    offerTest();
    break;

    case 11:
      numberOfGoodReceivedOffer += (data.to === SELF && data.from === SELF && data.offer === FAKE_OFFER?1:0);
      numberOfReceivedOffer++;
      if(numberOfGoodReceivedOffer == NUMBER_OF_FAKE_OFFER_SEND){
        writeResult(OFFER_ID, "Test " + offerTestNumber + " : (receive "+NUMBER_OF_FAKE_OFFER_SEND+" offer)", (numberOfGoodReceivedOffer === NUMBER_OF_FAKE_OFFER_SEND));
        writeResult(OFFER_ID, "End test Offer. ");
      }
      else if(numberOfReceivedOffer == NUMBER_OF_FAKE_OFFER_SEND){
        writeResult(OFFER_ID, "Test " + offerTestNumber + " : (receive "+NUMBER_OF_FAKE_OFFER_SEND+" offer)", (numberOfGoodReceivedOffer === NUMBER_OF_FAKE_OFFER_SEND));
        offerTestNumber++;
        writeResult(OFFER_ID, "End test Offer. ");
      }
    break;
  }

}

function offerTest(){
  if(offerTestNumber == 0){
    sendMessageToSignalingServer(JSON.stringify(OFFER_MESSAGE));
    return;
  }

  if(offerTestNumber == 5){
    OFFER_MESSAGE.to = UNKNOWN_RECIPIENT;
    sendMessageToSignalingServer(JSON.stringify(OFFER_MESSAGE));
    return;
  }

  if(offerTestNumber == 8){
    OFFER_MESSAGE.to = RECIPIENT;
    OFFER_MESSAGE.offer = null;
    sendMessageToSignalingServer(JSON.stringify(OFFER_MESSAGE));
    return;
  }

  if(offerTestNumber == 11){
    OFFER_MESSAGE.offer = FAKE_OFFER;
    for(var i = 0; i < NUMBER_OF_FAKE_OFFER_SEND; i++){
      sendMessageToSignalingServer(JSON.stringify(OFFER_MESSAGE));
    }
    return;
  }
}
/*
 * Leave
 */

var leaveTestNumber = 0;

const LEAVE_ID = "leave";
const LEAVE_MESSAGE_COMMENT = "Votre correspondant a raccroché.";
const LEAVE_MESSAGE = {
  type: "leave",
  to: RECIPIENT,
  comment: LEAVE_MESSAGE_COMMENT
}

function leaveTest(){
  if(leaveTestNumber == 0){
    sendMessageToSignalingServer(JSON.stringify(OFFER_MESSAGE));
    return;
  }else if(leaveTestNumber == 1){
    sendMessageToSignalingServer(JSON.stringify(LEAVE_MESSAGE));
    return;
  }
}

function leaveTestAnswer(data){
  switch(leaveTestNumber){
    case 1:
    writeResult(LEAVE_ID, "Start test Leave");
    writeResult(LEAVE_ID, "Test "+leaveTestNumber+" : (data type is leave)", (data.type == LEAVE_ID));
    leaveTestNumber++;
    writeResult(LEAVE_ID, "Test "+leaveTestNumber+" : (sender is self)", (data.from == SELF));
    leaveTestNumber++;
    writeResult(LEAVE_ID, "Test "+leaveTestNumber+" : (recipient is self)", (data.to == SELF));
    leaveTestNumber++;
    writeResult(LEAVE_ID, "End test Leave");
    break;
  }
}
/*
 * Login
 */
var loginTestNumber = 0;

const MAX_LOGIN_TEST_NUMBER = 4;
const LOGIN_MESSAGE = {
    type: "login",
    username: USERNAME
  };
const ALREADY_CONNECTED_COMMENT = "You are already connected. ";
const LOGIN_ID = "login";

function loginTestAnswer(data){
  switch(loginTestNumber){
    //:COMMENT:2020-03-29:Connection success
    case 0:
      writeResult(LOGIN_ID, "Start test Login :");
      writeResult(LOGIN_ID, "Test " + loginTestNumber + " : (connection success)", (data.success == true));
      loginTestNumber++;
      writeResult(LOGIN_ID, "Test " + loginTestNumber + " : (Server name check)", (data.from === SERVER_NAME));
      loginTestNumber++;
      writeResult(LOGIN_ID, "Test " + loginTestNumber + " : (username check)", (getUsername(data.to) === USERNAME));
      loginTestNumber++;
      writeResult(LOGIN_ID, "Test " + loginTestNumber + " : (address ip check)", (getIpAddress(data.to) === IP_ADDRESS));
      loginTestNumber++;
      writeResult(LOGIN_ID, "");
      loginTest();
      break;
    //:COMMENT:2020-03-29:Connection failed
    case 4:
      writeResult(LOGIN_ID, "Test " + loginTestNumber + " : (connection failure success false)", (data.success == false));
      loginTestNumber++;
      writeResult(LOGIN_ID, "Test " + loginTestNumber + " : (connection failure same login)", (data.comment === ALREADY_CONNECTED_COMMENT));
      loginTestNumber++;
      writeResult(LOGIN_ID, "End test Login. ");
      break;
  }
}

function loginTest(){
  if(loginTestNumber <= MAX_LOGIN_TEST_NUMBER){
    sendMessageToSignalingServer(JSON.stringify(LOGIN_MESSAGE));
    return;
  }
}


/*
 * UTIL
 */

function getUsername(data){
   if(data == null){
     return null;
   }
   return data.split("@")[0];
}

function getIpAddress(data){
   if(data == null){
     return null;
   }
   return data.split("@")[1];
}

function writeResult(id, message, result){
   if(message === undefined, message === undefined){
     return;
   }
   var parent = document.getElementById(id);
   var child = document.createElement("div");

   if(result){
     child.style.backgroundColor = "green";
   }else{
     child.style.backgroundColor = "red";
   }

   var formatted_message = message;

   if(result !== undefined){
     formatted_message += (" => " + result);
   }else{
     child.style.backgroundColor = "";
     child.classList.add("title");
   }

   child.innerHTML += formatted_message;

   parent.appendChild(child);
   return child;
}

function getTimestampedMessage(message){
  return getTimestamp()+" "+message;
}

function getTimestamp(){
  var timestamp = Date.now();
  var date = new Date(timestamp);
  var timestamp = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear()
  + " "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
  return timestamp;
}

function sendMessageToSignalingServer(message) {
  if(ws != null)
    ws.send(message);
  else
    console.error("Connection : No connection to signaling server");
}
