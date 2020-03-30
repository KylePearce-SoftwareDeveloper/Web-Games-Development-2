const players = {};

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    autoFocus: false
};

function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('flag', 'assets/flag.png');
    this.load.image('redBase', 'assets/redBase.png');
    this.load.image('blueBase', 'assets/blueBase.png');
}

function create() {
    const self = this;
    this.players = this.physics.add.group();

    this.scores = {
        blue: 0,
        red: 0
    };

    this.flag = this.physics.add.image(800/2, 600/2, 'flag');
    this.physics.add.collider(this.players);

    this.physics.add.overlap(this.players, this.flag, function (flag, player) {
        self.flag.setPosition(player.x, player.y);
        io.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
    });

    this.blueBase = this.physics.add.image(800, 600, 'blueBase');
    this.physics.add.collider(this.blueBase);

   this.physics.add.overlap(this.flag, this.blueBase, function (flag, blueBase) {
        self.flag.setPosition(800/2, 600/2);
        //if (players[player.playerId].team === 'blue') {
            self.scores.blue += 1;
        //}
        io.emit('updateScore', self.scores);
        io.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
    });

    this.redBase = this.physics.add.image(50, 50, 'redBase');
    this.physics.add.collider(this.redBase);

    this.physics.add.overlap(this.flag, this.redBase, function (flag, redBase) {
        self.flag.setPosition(800/2, 600/2);
        //if (players[player.playerId].team === 'blue') {
        self.scores.red += 1;
        //}
        io.emit('updateScore', self.scores);
        io.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
    });


    io.on('connection', function (socket) {
        console.log('a user connected');
        // create a new player and add it to our players object
        players[socket.id] = {
            rotation: 0,
            //x: Math.floor(Math.random() * 700) + 50,
           // y: Math.floor(Math.random() * 500) + 50,
            playerId: socket.id,
           // team: (Math.floor(Math.random() * 2) == 0, 1.1) ? 'red' : 'blue',
            input: {
                left: false,
                right: false,
                up: false
            }
        };
        // add player to server
        addPlayer(self, players[socket.id]);
        // send the players object to the new player
        socket.emit('currentPlayers', players);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);

        // send the flag object to the new player
        socket.emit('flagLocation', { x: self.flag.x, y: self.flag.y });
        // send the current scores
        socket.emit('updateScore', self.scores);

        socket.on('disconnect', function () {
            console.log('user disconnected');
            // remove player from server
            removePlayer(self, socket.id);
            // remove this player from our players object
            delete players[socket.id];
            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id);
        });
        // when a player moves, update the player data
        socket.on('playerInput', function (inputData) {
            handlePlayerInput(self, socket.id, inputData);
        });
    });
}

function update() {
    this.players.getChildren().forEach((player) => {
        const input = players[player.playerId].input;
        player.setCollideWorldBounds(true).setDrag(600, 600);
        if (input.left) {
            player.setAngularVelocity(-300);
        } else if (input.right) {
            player.setAngularVelocity(300);
        } else {
            player.setAngularVelocity(0);
        }

        if (input.up) {
            this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration);
        } else {
            player.setAcceleration(0);
        }

        players[player.playerId].x = player.x;
        players[player.playerId].y = player.y;
        players[player.playerId].rotation = player.rotation;
    });
    io.emit('playerUpdates', players);
}

function randomPosition(max) {
    return Math.floor(Math.random() * max) + 50;
}

function handlePlayerInput(self, playerId, input) {
    self.players.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
            players[player.playerId].input = input;
        }
    });
}

function addPlayer(self, playerInfo) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'player');
    player.x = 650;
    player.y = 550;
    player._rotation = -35;
    player.setDrag(100);
    player.setAngularDrag(100);
    player.setMaxVelocity(200);
    player.playerId = playerInfo.playerId;
    self.players.add(player);
}

function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
            player.destroy();
        }
    });
}

const game = new Phaser.Game(config);
window.gameLoaded();