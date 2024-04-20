const PORT = 3003

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const { GameManager } = require("./pong-server")

//const assignPlayerEvent = player => ({ player })
//const ballEvent = (posX, posY, speedX, speedY) => ({ pos: { x: posX, y: posY }, speed: { x: speedX, y: speedY } })
//const scoreUpdateEvent = (score1, score2) => ({ score1, score2 })

var game = new GameManager();

game.onBallUpdate = (posX, posY, speedX, speedY) => {
    io.emit("ball-update", posX, posY, speedX, speedY);
}


game.onPlayerScored = (score1, score2) => {
    io.emit("score-update", score1, score2);
}

const VALID_DIRECTIONS = new Set(["start-up", "end-up", "start-down", "end-down"])

io.on("connection", (socket) => {
    console.log(`connect ${socket.id}`);

    const playerId = game.tryToAssignSocket(socket);

    if (playerId) {
        socket.emit("assign-player", playerId);
        io.emit("pause-update", game.isPaused());
    }

    socket.on("disconnect", (reason) => {
        game.tryToDisconnectSocket(socket);
        io.emit("pause-update", game.isPaused());
        console.log(`disconnect ${socket.id} due to ${reason}`);
    });

    socket.on("input", (direction, posY) => {
        if (!VALID_DIRECTIONS.has(direction))
            throw "Invalid input direction " + JSON.stringify(direction);
        const player = game.getPlayerFromSocket(socket);
        if (player) {
            game.onRemotePlayerInput(player.playerId, direction, posY);
            io.emit("player-input", player.playerId, direction, posY);
        } else {
            console.error("Received input event from a non-player");
        }
    });
});


app.use(express.static('public'))

server.listen(PORT, () => {
    console.log(`Pong listening on port ${PORT}`)
    game.start()
})

