// import { WebSocketServer } from 'ws';
const websocket = require('ws');
const express = require('express');
// const { json } = require('express');
const app = express();
const Game = require('./game.js')
app.use(express.static('frontend'));

const wss = new websocket.Server({ port: 8082 });
let WSList = {};

let Users = [];

let GameList = {};


function getFreeGamePIN(socket) {
    let maxpins = 0;
    if (Users.length == 0) {
        let newPin = {"id": 0, "free": false, "socket": socket};
        Users.push(newPin);
        return newPin;
    }
    for (let i of Users) {
        if (i.id > maxpins) maxpins = i.id;
        if (i.free) {
            i.free = false;
            i.socket = socket;
            return i;
        }
    }
    let newPin = {"id":  maxpins + 1, "free": false, "socket": socket};
    Users.push(newPin);
    return newPin;

}

wss.on('connection', (ws) => {
    console.log(`connected: ${ws}`);
    let state = "";
    var pin = "";
    ws.onmessage = (message) => {
        json = JSON.parse(message.data);
        if (json['state'] != undefined) {
            state = json['state'];
            switch (state) {
                case 'GameStart':
                    pin = getFreeGamePIN(ws);
                    GameList[pin.id] = new Game(pin);
                    console.log('Sending pin ' + pin.id);
                    ws.send(JSON.stringify({'gameid': pin.id}));
                    break;
                case 'Connect':
                    ws.send(JSON.stringify({'gameid': json['gameid']}));
                    break;
                case 'Request':
                    ws.send(JSON.stringify({'game': GameList[json['gameid']].getJson()}));
                    break;
                case 'Spectate':
                    if (GameList[json['gameid']] != undefined) {
                        ws.send(JSON.stringify({'gameid': json['gameid']}));
                    }
                    else {
                        ws.send(JSON.stringify({'gameid': -1}));
                    }
                    break;
                case 'RefreshGames':
                    let list = [];
                    console.log("refresh games request");
                    for (var u of Users) {
                        list.push(u.id);
                    }
                    ws.send(JSON.stringify({'gamesList': list}));
            }
        }
        if (json['key'] != undefined) {
            GameList[json['gameid']].handleKey(json['key']);
        }
    };

    ws.onclose = (event) => {
        console.log("closing websocket");
        pin.free = true;
        pin.socket = undefined;
    };
});

app.get('/test', (req, res) => {
    var val;
    console.log("request on /test");
    res.send("asdf");
});

app.listen(process.env.PORT || 8080, () => console.log(`App listening on port ${process.env.PORT || 8080}!`))