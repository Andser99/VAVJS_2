const socket = new WebSocket(window.location.href.startsWith("https://spejsinvejder") ? "wss://spejsinvejder.herokuapp.com:8082" : "wss://localhost:8082");
var gameID = undefined;
var requestTimer;
var spectating = false;
var result = undefined;

function customAlert(text, backgroundColor) {
    document.getElementById("alert_text").innerHTML = text;
    var alertElement = document.getElementById("alert");
    alertElement.style.backgroundColor = backgroundColor;
    alertElement.style.display = "block";
    fadeOut(alertElement);
  }
  function fadeOut(element) {
    if (element.value != 'fading') {
      var op = 1;  // initial opacity
      element.value = 'fading';
      var timer = setInterval(function () {
        if (op <= 0.03) {
          clearInterval(timer);
          element.style.display = 'none';
          element.style.opacity = '1';
          element.value = '';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op / op / op / op / op / op * 0.005;
      }, 50);
    }
  }

socket.onopen = (event) => {
    console.log("opened socket on ws://localhost:8082 with ID: " + socket.id);
    console.log(event);
    requestTimer = setInterval(() => {
        if (gameID != undefined) {
            socket.send(JSON.stringify({'gameid': gameID, 'state': 'Request'}));
        }
    }, 100);
};
socket.onmessage = (msg) => {
    // console.log(msg);
    let response = JSON.parse(msg.data)
    if (response['gameid'] != undefined) {
        gameID = response["gameid"];
        console.log('Received gameid response: ' + response['gameid']);
    }
    if (response['game'] != undefined) {
        aliens = response['game']['aliens'] || [];
        missiles = response['game']['missiles'] || [];
        ship = response['game']['ship'] || [];
        score = response['game']['score'] || 0;
        level = response['game']['level'] || 1;
        result = response['game']['result'] || undefined;
        draw();
    }
    if (response['gamesList'] != undefined) {
        var idStr = '';
        for (var id of response['gamesList']) {
            idStr += id + ' ';
        }
        console.log(response['gamesList']);
        document.getElementById('gameIds').innerText = idStr;
    }
};

function initSpace() {
    var space = document.getElementById('space').querySelector('table');
    space.innerHTML = '';
    var p = 0;
    for(var i=0;i<11;i++) {
        var tr = document.createElement('tr');
        for(var j=0;j<11;j++) {
            var td = document.createElement('td');
            td.id = 'p'+p;
            td.innerHTML = p;
            tr.appendChild(td);
            p++;
        }
        space.appendChild(tr);
    }
}
initSpace();


var aliens = [];
var ship = [];
var missiles = [];


function checkKey(e) {
    e = e || window.event;
    if (!spectating && gameID != undefined) {
        socket.send(JSON.stringify({'key': e.keyCode, 'gameid': gameID}));
    }
}

document.addEventListener('keydown', checkKey);

document.getElementById('start').addEventListener('click',function(){
    socket.send(JSON.stringify({'state': 'GameStart'}));
    spectating = false;
});
document.getElementById('spectate').addEventListener('click',function(){
    var val = parseInt(document.getElementById('spectateInput').value);
    if (val != NaN && val >= 0) {
        socket.send(JSON.stringify({'state': 'Spectate', 'gameid': val}));
        spectating = true;
    }
    else {
        customAlert("Invalid PIN: " + val, 'orange');
    }
});
document.getElementById('refreshGames').addEventListener('click',function(e){
    socket.send(JSON.stringify({'state': 'RefreshGames'}));
});
document.getElementById('connect').addEventListener('click',function(e){
    var val = parseInt(document.getElementById('connectInput').value);
    if (val != NaN && val >= 0) {
        socket.send(JSON.stringify({'state': 'Connect', 'gameid': val}));
        spectating = false;
    }
    else {
        customAlert("Invalid PIN: " + val, 'orange');
    }
});
// document.getElementById('disconnect').addEventListener('keydown',function(e){
//     socket.close();
// });
