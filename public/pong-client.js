const myCanvas = document.getElementById("myCanvas");
const ctx = myCanvas.getContext("2d");

const PADDING = 50

var windowWidth = 1000
var windowHeight = 600
//sets canvas resolution( !canvas size)
myCanvas.setAttribute("width", windowWidth)
myCanvas.setAttribute("height", windowHeight)



const PADDLE_SPEED = 1
const BALL_SPEED = 0.5


class Paddle {
    constructor(posX, posY, width, height) {
        this.posX = posX
        this.posY = posY
        this.width = width
        this.height = height
    }
    draw() {
        ctx.fillStyle = "white"
        ctx.fillRect(this.posX, this.posY, this.width, this.height)
    }
    update(playerIsMovingUp, playerIsMovingDown, dt) {
        if (playerIsMovingUp) {
            this.posY -= dt * PADDLE_SPEED
        }
        if (playerIsMovingDown) {
            this.posY += dt * PADDLE_SPEED
        }
        //CHECK BOUNDARY CONDITION
        this.posY = Math.min(Math.max(this.posY, PADDING), windowHeight - PADDING - this.height)
    }
}

class Ball {
    constructor(posX, posY, r) {
        this.speedX = BALL_SPEED * -1
        this.speedY = BALL_SPEED * 1
        this.posX = posX
        this.posY = posY
        this.r = r
        this.initialPosX = posX
        this.initialPosY = posY
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = "white"
        ctx.arc(this.posX, this.posY, this.r, 0, Math.PI * 2)
        ctx.fill()
    }
    update(dt) {
        this.posX += dt * this.speedX
        this.posY += dt * this.speedY
    }
    reset() {
        this.posX = this.initialPosX
        this.posY = this.initialPosY
    }

}

class PlayerState {
    constructor(playerId, posX) {
        this.playerId = playerId
        this.isMovingUp = false
        this.isMovingDown = false
        this.score = 0
        this.paddle = new Paddle(posX, windowHeight / 2 - PADDING, 10, 100)
    }

    draw() {
        this.paddle.draw()
    }

    update(dt) {
        this.paddle.update(this.isMovingUp, this.isMovingDown, dt)
    }
}

class GameManager {
    constructor() {
        this.ball = new Ball(windowWidth / 2, windowHeight / 2, 10)
        this.lastTime = 0
        this.player = 0
        this.paused = true
        this.players = [
            null,
            new PlayerState(1, 2 * PADDING),
            new PlayerState(2, windowWidth - 2 * PADDING),
        ]

        socket.on("assign-player", (player) => {
            console.log(`Playing as player ${player} | socket id ${socket.id}.`);
            this.player = player
        });

        socket.on("pause-update", paused => {
            this.paused = paused
        })
    }

    isPaused() {
        return this.paused;
    }

    board() {
        ctx.fillStyle = "green"
        ctx.fillRect(0, 0, windowWidth, windowHeight);
        ctx.strokestyle = "white"
        ctx.strokeRect(PADDING, PADDING, windowWidth - 2 * PADDING, windowHeight - 2 * PADDING)
    }

    draw() {
        this.board()
        this.ball.draw()
        this.players[1].draw()
        this.players[2].draw()
        this.drawScore()
    }

    drawScore() {
        ctx.fillStyle = 'white'
        ctx.font = "bold 48px serif";
        ctx.fillText(`${this.players[1].score} : ${this.players[2].score}`, PADDING, PADDING)
    }

    update(dt) {
        if (this.isPaused())
            return;

        this.players[1].update(dt)
        this.players[2].update(dt)
        this.ball.update(dt)
        // Bounce on sides 
        if (this.ball.posY < PADDING + this.ball.r || this.ball.posY > windowHeight - PADDING - this.ball.r) {
            this.ball.speedY = -(this.ball.speedY)
            this.ball.posY += 2 * dt * (this.ball.speedY)
        }
        // Score bounce
        if (PADDING > this.ball.posX) {
            this.ball.reset()
        }
        // Score bounce
        if (this.ball.posX + this.ball.r > windowWidth - PADDING) {
            this.ball.reset()
        }
        //bounce sul puddle
        if (this.ball.posX < this.players[1].paddle.posX + this.players[1].paddle.width + this.ball.r &&
            (this.players[1].paddle.posY < this.ball.posY + this.ball.r && this.ball.posY < this.ball.r + this.players[1].paddle.posY + this.players[1].paddle.height)) {
            this.ball.speedX = -(this.ball.speedX)
            this.ball.posX += 2 * dt * (this.ball.speedX)
        }
        if (this.ball.posX > this.players[2].paddle.posX - this.ball.r &&
            (this.players[2].paddle.posY < this.ball.posY + this.ball.r && this.ball.posY < this.ball.r + this.players[2].paddle.posY + this.players[2].paddle.height)) {
            this.ball.speedX = -(this.ball.speedX)
            this.ball.posX += 2 * dt * (this.ball.speedX)
        }
    }

    start(time = 0) {
        this.update(time - this.lastTime)
        this.draw()
        this.lastTime = time
        window.requestAnimationFrame(t => this.start(t))
    }

    onLocalPlayerInput(type, code) {
        const player = this.players[this.player];
        if (!player)
            return;

        switch (type) {
            case "keydown":
                switch (code) {
                    case "KeyW":
                        if (!player.isMovingUp) {
                            socket.emit("input", "start-up", player.paddle.posY)
                            player.isMovingUp = true
                        }
                        break
                    case "KeyS":
                        if (!player.isMovingDown) {
                            socket.emit("input", "start-down", player.paddle.posY)
                            player.isMovingDown = true
                        }
                        break
                }
                break
            case "keyup":
                switch (code) {
                    case "KeyW":
                        if (player.isMovingUp) {
                            socket.emit("input", "end-up", player.paddle.posY)
                            player.isMovingUp = false
                        }
                        break
                    case "KeyS":
                        if (player.isMovingDown) {
                            socket.emit("input", "end-down", player.paddle.posY)
                            player.isMovingDown = false
                        }
                        break
                }
                break
        }
    }

    onRemotePlayerInput(playerId, direction, posY) {
        if (playerId === this.player) {
            return;
        }
        const player = this.players[playerId];
        if (!player) {
            console.error("Player", playerId, "is invalid")
            return
        }
        switch (direction) {
            case "start-up":
                player.isMovingUp = true
                break
            case "end-up":
                player.isMovingUp = false
                break
            case "start-down":
                player.isMovingDown = true
                break
            case "end-down":
                player.isMovingDown = false
                break
            default:
                throw `Unknown direction ${direction}`
        }
        player.paddle.posY = posY
    }

    onRemoteBallUpdate(posX, posY, speedX, speedY) {
        this.ball.posX = posX
        this.ball.posY = posY
        this.ball.speedX = speedX
        this.ball.speedY = speedY
    }

    onScoreUpdate(scores1, scores2) {
        this.players[1].score = scores1
        this.players[2].score = scores2
    }
}


var game = new GameManager()
game.start()

