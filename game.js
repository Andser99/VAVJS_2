class Game {
    static aliens1 = [1,3,5,7,9,23,25,27,29,31];
    static aliens2 = [1,3,5,7,9,13,15,17,19,23,25,27,29,31];
    static aliens3 = [1,5,9,23,27,31];
    static aliens4 = [45,53];
    static SCORE_PER_KILL = 10;
    constructor(id) {
        this.id = id;
        this.running = false;
        this.level = 1;
        this.speed = 512;
        this.a = 0;
        this.aliens = [...Game.aliens1];
        this.ship = [104,114,115,116];
        this.missiles = [];
        this.result = undefined;
        this.score = 0;
        this.direction = 1;
        this.json = {};
        this.json["aliens"] = this.aliens;
        this.json["missiles"] = this.missiles;
        this.json["ship"] = this.ship;
        this.json["result"] = this.result;
        this.json["score"] = this.score;
        this.json["level"] = this.level;
        this.json["topscore"] = 0; 
        this.startGame();
    }

    resetGame() {
        if (this.loop1 != undefined) {
            clearInterval(this.loop2);
        }
        if (this.loop2 != undefined) {
            clearInterval(this.loop1);
        }
        this.running = false;
        this.level = 1;
        this.speed = 512;
        this.a = 0;
        this.aliens = [...Game.aliens1];
        this.ship = [104,114,115,116];
        this.missiles = [];
        this.result = undefined;
        this.score = 0;
        this.direction = 1;
        this.json["aliens"] = this.aliens;
        this.json["missiles"] = this.missiles;
        this.json["ship"] = this.ship;
        this.json["result"] = this.result;
        this.json["score"] = this.score;
        this.json["level"] = this.level;
    }

    getJson() {
        this.json["aliens"] = this.aliens;
        this.json["missiles"] = this.missiles;
        this.json["ship"] = this.ship;
        this.json["result"] = this.result;
        this.json["score"] = this.score;
        this.json["level"] = this.level;
        return this.json;
    }
    
    startGame() {
        this.result = undefined;
        this.running = true;
        this.loop1 = setInterval(() => {
            this.moveAliens();
            this.moveMissiles();
            this.checkCollisionsMA();
            if(this.a%4==3) this.lowerAliens();
            if(this.RaketaKolidujeSVotrelcom()) {
                this.running = false;
                clearInterval(this.loop2);
                clearInterval(this.loop1);
                this.missiles = [];
                this.lose();
            }
            this.a++;
        },this.speed);
        this.loop2 = setInterval(() => {
            if(this.aliens.length === 0) {
                this.running = false;
                clearInterval(this.loop2);
                clearInterval(this.loop1);
                this.missiles = [];
                this.win();
                setTimeout(() => {
                    this.nextLevel();
                }, 1000);
            }
        }, this.speed / 2);
    }
    nextLevel() {
        this.result = undefined;
        this.level++;
        console.log(`gameid=${this.id} level=${this.level}`);
        if(this.level==1) this.aliens = [...Game.aliens1];
        if(this.level==2) this.aliens = [...Game.aliens2];
        if(this.level==3) this.aliens = [...Game.aliens3];
        if(this.level==4) this.aliens = [...Game.aliens4];
        if(this.level > 4) {
            this.level = 1;
            this.aliens = [...Game.aliens1];
            this.speed = this.speed / 2;
        }
        this.startGame();
    }

    win() {
        this.result = "won";
    }

    lose() {
        this.result = "lost";
    }
    
    moveAliens() {
        var i = 0;
        for(i = 0; i < this.aliens.length; i++) {
            this.aliens[i] = this.aliens[i]+ this.direction;
        }
        this.direction *= -1;
    }
    
    lowerAliens() {
        var i = 0;
        for(i = 0; i < this.aliens.length; i++) {
            this.aliens[i] += 11;
        }
    }
    
    moveMissiles() {
        var i = 0;
        for(i = 0; i < this.missiles.length; i++) {
            this.missiles[i] -= 11 ;
            if(this.missiles[i] < 0) this.missiles.splice(i, 1);
        }
    }
    checkCollisionsMA() {
        for(var i=0; i < this.missiles.length; i++) {
            if(this.aliens.includes(this.missiles[i])) {
                var alienIndex = this.aliens.indexOf(this.missiles[i]);
                this.aliens.splice(alienIndex, 1);
                this.score += Game.SCORE_PER_KILL;
                if (this.score > this.json["topscore"]) this.json["topscore"] = this.score;
                this.missiles.splice(i, 1);
            }
        }
    }
    
    RaketaKolidujeSVotrelcom() {
        for(var i=0; i < this.aliens.length; i++) {
            if(this.aliens[i]>98) {
                return true;
            }
        }
        return false;
    }
    
    

    addPlayer(ws) {
        this.playerList.push(ws);
    }

    handleKey(e) {
        if (!this.running) return;
        if (this.result != undefined) {
            return;
        }
        if (e == '37') {
            if(this.ship[0] > 100) {
                var i=0;
                for(i=0;i<this.ship.length;i++) {
                    this.ship[i]--;
                }
            }
        }
        else if (e == '39' && this.ship[0] < 108) {
            var i=0;
            for(i=0;i<this.ship.length;i++) {
                this.ship[i]++;
            }
        }
        else if (e == '32') {
            this.missiles.push(this.ship[0]-11);
        }
    }
}

module.exports = Game