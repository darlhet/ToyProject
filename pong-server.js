
const PADDING = 50

var windowWidth = 1000
var windowHeight = 600

const UPDATE_SPEED = 10

const PADDLE_SPEED = 1
const BALL_SPEED = 0.5

class Paddle {
    constructor(posX, posY, width, height) {
        this.posX = posX
        this.posY = posY
        this.width = width
        this.height = height
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
        this.socket = null
    }

    update(dt) {
        this.paddle.update(this.isMovingUp, this.isMovingDown, dt)
    }
}

class GameManager {
    constructor() {
        this.ball = new Ball(windowWidth / 2, windowHeight / 2, 10)
        this.lastTime = 0
        this.players = [
            null,
            new PlayerState(1, 2 * PADDING),
            new PlayerState(2, windowWidth - 2 * PADDING),
        ];
        this.onBallUpdate = null
        this.onPlayerScored = null
    }

    isPaused() {
        return !this.players[1].socket || !this.players[2].socket
    }

    update(dt) {
        if (this.isPaused())
            return;

        this.players[1].update(dt)
        this.players[2].update(dt)
        this.ball.update(dt)

        //bounce su e giu
        if (this.ball.posY < PADDING + this.ball.r || this.ball.posY > windowHeight - PADDING - this.ball.r) {
            this.ball.speedY = -(this.ball.speedY)
            this.ball.posY += 2 * dt * (this.ball.speedY)
            this.triggerBallUpdate()
        }
        if (PADDING > this.ball.posX) {
            this.ball.reset()
            this.triggerBallUpdate()
            this.triggerScoreUpdate(2)
        }
        if (this.ball.posX + this.ball.r > windowWidth - PADDING) {
            this.ball.reset()
            this.triggerBallUpdate()
            this.triggerScoreUpdate(1)
        }
        //bounce sul puddle
        if (this.ball.posX < this.players[1].paddle.posX + this.players[1].paddle.width + this.ball.r &&
            (this.players[1].paddle.posY < this.ball.posY + this.ball.r && this.ball.posY < this.ball.r + this.players[1].paddle.posY + this.players[1].paddle.height)) {
            this.ball.speedX = -(this.ball.speedX)
            this.ball.posX += 2 * dt * (this.ball.speedX)
            this.triggerBallUpdate()
        }
        if (this.ball.posX > this.players[2].paddle.posX - this.ball.r &&
            (this.players[2].paddle.posY < this.ball.posY + this.ball.r && this.ball.posY < this.ball.r + this.players[2].paddle.posY + this.players[2].paddle.height)) {
            this.ball.speedX = -(this.ball.speedX)
            this.ball.posX += 2 * dt * (this.ball.speedX)
            this.triggerBallUpdate()
        }
    }

    triggerScoreUpdate(playerId) {
        this.players[playerId].score++
        if (this.onPlayerScored) {
            this.onPlayerScored(this.players[1].score, this.players[2].score);
        }
    }

    triggerBallUpdate() {
        if (this.onBallUpdate) {
            this.onBallUpdate(this.ball.posX, this.ball.posY, this.ball.speedX, this.ball.speedY)
        }
    }

    getPlayerFromSocket(socket) {
        if (socket.id === this.players[1].socket)
            return this.players[1]
        if (socket.id === this.players[2].socket)
            return this.players[2]
        return null
    }

    tryToAssignSocket(socket) {
        const player = this.getPlayerFromSocket(socket)
        if (!player) {
            if (!this.players[1].socket) {
                this.players[1].socket = socket.id
                return 1
            }
            if (!this.players[2].socket) {
                this.players[2].socket = socket.id
                return 2
            }
        }
        return 0
    }

    tryToDisconnectSocket(socket) {
        const player = this.getPlayerFromSocket(socket)
        if (player) {
            player.socket = null
        }
    }

    start() {
        this.lastTime = Date.now()
        return setInterval(() => {
            const now = Date.now()
            this.update(now - this.lastTime)
            this.lastTime = now
        }, UPDATE_SPEED);
    }

    onRemotePlayerInput(playerId, direction, posY) {
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
}

exports.GameManager = GameManager

