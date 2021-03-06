var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('notPlayer', 'assets/notPlayer.png');
    this.load.image('flag', 'assets/flag.png');
    this.load.image('background', 'assets/background.png');
    this.load.image('redBase', 'assets/redBase.png');
    this.load.image('blueBase', 'assets/blueBase.png');
}

function create() {
    var self = this;
    this.socket = io();
    this.BlueTeam = this.add.group();
    this.RedTeam = this.add.group();
    this.players = this.add.group();

    var background = this.add.image(800, 600, 'background');
    background.setOrigin(1, 1).setDisplaySize(800, 600);

    var redBase = this.add.image(90, 84, 'redBase');
    redBase.setOrigin(1,0.4).setDisplaySize(90, 84);

    var blueBase = this.add.image(90, 84, 'blueBase');
    blueBase.setOrigin(-7,-5).setDisplaySize(90, 84);

    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: 'blue' });
    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
    this.timerText = this.add.text(200, 16, '', { fontSize: '32px', fill: 'blue' });
    this.countText = this.add.text(200, 50, '', { fontSize: '32px', fill: 'black' });

    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                displayPlayers(self, players[id], 'player');
            } else {
                displayPlayers(self, players[id], 'notPlayer');
            }
        });
    });

    this.socket.on('newPlayer', function (playerInfo)
    {
        displayPlayers(self, playerInfo, 'notPlayer');
    });

    this.socket.on('disconnect', function (playerId) {
        self.players.getChildren().forEach(function (player) {
            if (playerId === player.playerId) {
                player.destroy();
            }
        });
    });

    this.socket.on('playerUpdates', function (players) {
        Object.keys(players).forEach(function (id) {
            self.players.getChildren().forEach(function (player) {
                if (players[id].playerId === player.playerId) {
                    player.setRotation(players[id].rotation);
                    player.setPosition(players[id].x, players[id].y);
                }
            });
        });
    });

    this.socket.on('updateScore', function (scores) {
        self.blueScoreText.setText('Blue: ' + scores.blue);
        self.redScoreText.setText('Red: ' + scores.red);
    });

    this.socket.on('playerCount', function (count)
    {
        count += 1;
        self.countText.setText('Count: ' + count);
    });

    this.socket.on('updateTimer', function (time) {
        self.timerText.setText('Countdown: ' + formatTime(time));
    });

    this.socket.on('moveBarriers', function (flagLocation) {
        //fix the below and uncomment
        //self.barriers..setPosition(100, 100);
    });

    this.socket.on('flagLocation', function (flagLocation) {
        if (!self.flag) {
            self.flag = self.add.image(flagLocation.x, flagLocation.y, 'flag');
        } else {
            self.flag.setPosition(flagLocation.x, flagLocation.y);
        }
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
    this.upKeyPressed = false;
    this.downKeyPressed = false;
}

function formatTime(seconds){
    // Minutes
    var minutes = Math.floor(seconds/60);
    // Seconds
    var partInSeconds = seconds%60;
    // Adds left zeros to seconds
    partInSeconds = partInSeconds.toString().padStart(2,'0');
    // Returns formatted time
    return `${minutes}:${partInSeconds}`;
}

function update() {
    const left = this.leftKeyPressed;
    const right = this.rightKeyPressed;
    const up = this.upKeyPressed;
    const down = this.downKeyPressed;

    if (this.cursors.left.isDown) {
        this.leftKeyPressed = true;
    } else if (this.cursors.right.isDown) {
        this.rightKeyPressed = true;
    } else {
        this.leftKeyPressed = false;
        this.rightKeyPressed = false;
    }

    if (this.cursors.up.isDown) {
        this.upKeyPressed = true;
    } else if (this.cursors.down.isDown) {
        this.downKeyPressed = true;
    } else {
        this.upKeyPressed = false;
        this.downKeyPressed = false;
    }

    if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down != this.downKeyPressed) {
        this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed });
    }
}

function displayPlayers(self, playerInfo, sprite) {
    const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5);
    //playerInfo.team = 'blue';
    //playerInfo.team: ? 'red' : 'blue';
    if (playerInfo.team === 'blue' )player.setTint(0x0000ff);
    else {player.setTint(0xff0000);}
    player.playerId = playerInfo.playerId;
    self.players.add(player);
}