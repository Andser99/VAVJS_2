// Andrej Byrtus
const websocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const app = express();
const Game = require('./game.js');
app.use(express.static('frontend'));

const wss = new websocket.Server({ port: 8082 });
let WSList = {};

let Users = [];

let GameList = {};

let database = [];


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
                    if (json['gameid'] == undefined) {
                        pin = getFreeGamePIN(ws);
                        GameList[pin.id] = new Game(pin);
                        console.log('Sending pin ' + pin.id);
                        ws.send(JSON.stringify({'gameid': pin.id}));
                    }
                    else if (GameList[json['gameid']] != undefined) {
                        if (GameList[json['gameid']].running == false) {
                            if (!GameList[json['gameid'].running]) {
                                GameList[json['gameid']].resetGame();
                            }
                            GameList[json['gameid']].startGame();
                        }
                    }
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
                    break;
                case 'ResetGame':
                    if (GameList[json['gameid']] != undefined) {
                        GameList[json['gameid']].resetGame();
                    }
                    break;
                case 'Register':
                    let validationResult = validateRegistration(json['register']);
                    if (validationResult.length == 0) {
                        if (registerUser(json['register'])) {
                            ws.send(JSON.stringify({'alert': 'Successfully registered, please login.'}));
                        }
                    } else {
                        ws.send(JSON.stringify({'error': validationResult}));
                    }
                    break;
                case 'Login':
                    ws.send(JSON.stringify({'loginresult': loginUser(json['login'])}));
                    break;
                case 'Highscore':
                    console.log("Received highscore update for " + json['user']);
                    ws.send(JSON.stringify({'loginresult': updateHighScore(json['user'])}));
                    break;
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

function saveDatabase() {
    let data = JSON.stringify(database);
    fs.writeFile('./database.json', data, 'utf8', (err) => {
        if (err) {
            console.log(`Cannot write database: ${err}`);
        }
        else {
            console.log(`Database saved successfully`);
        }

    });
}

function loadDatabase() {
    fs.stat('./database.json', function(err, stat) {
        if(err == null) {
            console.log('Database file exists');
            fs.readFile('./database.json', 'utf8', (err, data) => {
                if (err) {
                    console.log(`Cannot load database: ${err}`);
                } 
                else {
                    try {
                        database = JSON.parse(data);
                    }
                    catch (error) {
                        console.log('Error while parsing database - ' + error);
                    }
                    console.log(data);
                }
            
            });
        } else if(err.code === 'ENOENT') {
            return; //database doesn't exist, no reason to load
        } else {
            console.log('Some other error: ', err.code);
        }
    });
}

function updateHighScore(credentials) {
    for (x of database) {
        if (x['login'] == credentials['login'] && x['password'] == credentials['password']) {
            x['topscore'] = credentials['topscore'];
            console.log("Updating high score for " + x['login'] + " to " + x['topscore']);
            saveDatabase();
            return x;
        }
    }
    return false;
}

function loginUser(credentials) {
    let passwordHash = getpasswordHash(credentials['password']);
    for (x of database) {
        if (x['login'] == credentials['login'] && x['password'] == passwordHash) {
            return x;
        }
    }
    return false;
}

function registerUser(credentials) {
    credentials['password'] = getpasswordHash(credentials['password']);
    credentials['topscore'] = 0;
    database.push(credentials);
    saveDatabase();
    return true;
}

function checkIfUserOrMailExists(login, email) {
    for (user of database) {
        if (user['email'] == email) return true;
        if (user['login'] == login) return true;
    }
    return false;
}

const requiredRegisterFields = ['login', 'email', 'password', 'name'];
function validateRegistration(credentials) {
    let result = [];
    for (x of requiredRegisterFields) {
        if (credentials[x] == undefined) result.push("Missing field: " + x);
    }
    if (credentials.Length > 0) return result;
    if (checkIfUserOrMailExists(credentials['login'], credentials['email'])) {
        result.push("Username or Email already in use");
    }
    if (credentials['login'].match(/[^a-z]/i)) {
        result.push("Username can only contain letters");
    }
    if (credentials['email'].match(/\S+@\S+\.\S+/) == null) {
        result.push("Invalid email format");
    }
    if (credentials['password'].length < 8) {
        result.push("Password has to be atleast 8 characters long");
    }
    if (credentials['name'].length < 4) {
        result.push("Name has to have atleast 2 characters for first and last name and has to be space separated");

    }
    else {
        splitName = credentials['name'].split(' ');
        if (splitName.length < 2) {
            result.push("Name has to be space separated");
        } 
        else {
            if (splitName[0][0].toLowerCase() == splitName[0][0]) {
                result.push("First name has to begin with uppercase");
            }
            if (splitName[1][0].toLowerCase() == splitName[1][0]) {
                result.push("Last name has to begin with uppercase");
            }
            if (splitName[0].length < 2) {
                result.push("First name has to have at least 2 characters");
            }
            if (splitName[1].length < 2) {
                result.push("Last name has to have at least 2 characters");
            }
        }
    }
    return result;
}

function getpasswordHash(raw) {
  return crypto.createHash('sha1').update(raw).digest('hex');
}

app.get('/test', (req, res) => {
    var val;
    console.log("request on /test");
    res.send("asdf");
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`App listening on port ${process.env.PORT || 8080}!`);
    loadDatabase();
});