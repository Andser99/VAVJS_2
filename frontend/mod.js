var debug = false;


const GRID_WIDTH = 11;
const GRID_HEIGHT = 11;
const IMAGE_SIZE = 48;
const SCORE_PER_KILL = 10;

// Load images made by me, hosted on imgur

const ENEMY_IMAGE = document.createElement("img");
// ENEMY_IMAGE.src = "enemy.png";
ENEMY_IMAGE.src = "https://i.imgur.com/JOMp4gH.png";
// if (debug) ENEMY_IMAGE.src = "enemy_TEST.png";

const SHIP_IMAGE = document.createElement("img");
// SHIP_IMAGE.src = "ship.png";
SHIP_IMAGE.src = "https://i.imgur.com/K6n1F6y.png";
// if (debug) SHIP_IMAGE.src = "ship_TEST.png";

const MISSILE_IMAGE = document.createElement("img");
// MISSILE_IMAGE.src = "missile.png";
MISSILE_IMAGE.src = "https://i.imgur.com/ip6xnos.png";
// if (debug) MISSILE_IMAGE.src = "missile_TEST.png";

var score = 0;
var topscore = 0;

// Initialize canvas
let canvas = document.createElement("canvas");
canvas.style.background = "black";
document.getElementById("space").appendChild(canvas);
canvas.width = GRID_WIDTH * IMAGE_SIZE;
canvas.height = GRID_HEIGHT * IMAGE_SIZE;
let ctx = canvas.getContext("2d");
const table = document.getElementById("space").children[0];
// Move original table out of the screen to hide it
table.style.position = "fixed";
table.style.top = "-462px";

// Resets the game
const RESET_BUTTON = document.createElement("button");
RESET_BUTTON.innerText = "Reset";
document.body.appendChild(RESET_BUTTON);
RESET_BUTTON.addEventListener("click", (e) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.send(JSON.stringify({'state': 'ResetGame', 'gameid': gameID}));
    if (debug) console.log("game has been reset");
});

const CONNECT_CONTROL_P = document.createElement("p");
CONNECT_CONTROL_P.innerText = "Buttons for connect control";
document.body.appendChild(CONNECT_CONTROL_P);

const LEFT_BUTTON = document.createElement("button");
LEFT_BUTTON.innerText = "LEFT";
document.body.appendChild(LEFT_BUTTON);
LEFT_BUTTON.addEventListener("click", (e) => {
    checkKey(new KeyboardEvent('keypress',{'keyCode':'37'}));
});
const SPACE_BUTTON = document.createElement("button");
SPACE_BUTTON.innerText = "SHOOT";
document.body.appendChild(SPACE_BUTTON);
SPACE_BUTTON.addEventListener("click", (e) => {
    checkKey(new KeyboardEvent('keypress',{'keyCode':'32'}));
});
const RIGHT_BUTTON = document.createElement("button");
RIGHT_BUTTON.innerText = "RIGHT";
document.body.appendChild(RIGHT_BUTTON);
RIGHT_BUTTON.addEventListener("click", (e) => {
    checkKey(new KeyboardEvent('keypress',{'keyCode':'39'}));
});

// Toggle music
var soundPlaying = false;

const MUSIC_BUTTON = document.createElement("button");
MUSIC_BUTTON.innerText = "Music: off";
document.body.appendChild(MUSIC_BUTTON);

// Music source https://freemusicarchive.org/music/Nobara_Hayakawa/Trail_EP/Nobara_Hayakawa_-_Trail_EP_-_Trail
// Licensed under Creative Commons
const music = new Audio("https://freemusicarchive.org/track/Nobara_Hayakawa_-_Trail_EP_-_Trail/download");
MUSIC_BUTTON.addEventListener("click", (e) => {
    if (soundPlaying) music.pause();
    else music.play();
    soundPlaying = !soundPlaying;
    MUSIC_BUTTON.innerHTML = `Music: ${soundPlaying? "on" : "off"}`;
    if (debug) console.log("Music playback set to " + !soundPlaying);
});


// for (var x of document.querySelectorAll("td")) {
//     var coords = indexToCoords(parseInt(x.innerHTML));
//     x.innerHTML += `x${coords.x} y${coords.y}`
// }

// Converts object indexes to the corresponding canvas x and y coords
function indexToCoords(index) {
    return {"x": (index % (GRID_WIDTH)) * IMAGE_SIZE, "y": Math.floor(index / (GRID_HEIGHT)) * IMAGE_SIZE};
}

function checkTopScore() {
    if (currentUser != undefined && currentUser['topscore'] < topscore) {
        currentUser['topscore'] = topscore;
        socket.send(JSON.stringify({'state': 'Highscore','user': currentUser}));
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    checkTopScore();
    if (result == 'won') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "green";
        ctx.font = "40px Monospace";
        ctx.fillText(`LEVEL ${level} DONE`, IMAGE_SIZE * GRID_WIDTH / 4, IMAGE_SIZE * GRID_HEIGHT / 2);
        ctx.fillText(` SCORE ${score}`, IMAGE_SIZE * GRID_WIDTH / 4, IMAGE_SIZE * GRID_HEIGHT / 1.5);
        for (var x of ship) {
            let coords = indexToCoords(x);
            if (debug) console.log(`drawing ship at ${coords.x}:${coords.y}`);
            ctx.drawImage(SHIP_IMAGE, coords.x, coords.y, IMAGE_SIZE, IMAGE_SIZE);
        }
    }
    else if (result == 'lost') {
        ctx.fillStyle = "red";
        ctx.font = "40px Monospace";
        ctx.fillText("GAME OVER", IMAGE_SIZE * GRID_WIDTH / 4, IMAGE_SIZE * GRID_HEIGHT / 2);
        ctx.fillText(` SCORE ${score}`, IMAGE_SIZE * GRID_WIDTH / 4, IMAGE_SIZE * GRID_HEIGHT / 1.5);
        for (var x of ship) {
            let coords = indexToCoords(x);
            if (debug) console.log(`drawing ship at ${coords.x}:${coords.y}`);
            ctx.drawImage(SHIP_IMAGE, coords.x, coords.y, IMAGE_SIZE, IMAGE_SIZE);
        }
    }
    else {
        // Draw objects - aliens/missiles/ship
        for (var x of aliens) {
            let coords = indexToCoords(x);
            if (debug) console.log(`drawing enemy at ${coords.x}:${coords.y}`);
            ctx.drawImage(ENEMY_IMAGE, coords.x, coords.y, IMAGE_SIZE, IMAGE_SIZE);
        }
        for (var x of missiles) {
            let coords = indexToCoords(x);
            if (debug) console.log(`drawing rocket at ${coords.x}:${coords.y}`);
            ctx.drawImage(MISSILE_IMAGE, coords.x, coords.y, IMAGE_SIZE, IMAGE_SIZE);
        }
        for (var x of ship) {
            let coords = indexToCoords(x);
            if (debug) console.log(`drawing ship at ${coords.x}:${coords.y}`);
            ctx.drawImage(SHIP_IMAGE, coords.x, coords.y, IMAGE_SIZE, IMAGE_SIZE);
        }
        // Draw score and level
        ctx.fillStyle = "green";
        ctx.font = "20px Monospace";
        ctx.fillText(`LEVEL:${level} SCORE:${score}              TOP:${topscore}`, 5, 20);
    
        if (debug) console.log("Next animation frame");
    }
    
}

// Main animation frame loop

// Bind J and L to arrows
document.addEventListener('keydown', mapIJKL);
function mapIJKL(e) {
    e = e || window.event;
    if (e.keyCode == '74') {
        checkKey(new KeyboardEvent('keypress',{'keyCode':'37'}));
        if (debug) console.log(`dispatching ArrowLeft`);
    }
    else if (e.keyCode == '76') {
        checkKey(new KeyboardEvent('keypress',{'keyCode':'39'}));
        if (debug) console.log(`dispatching ArrowRight`);
    }
}