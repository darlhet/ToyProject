const myCanvas = document.getElementById("myCanvas");
const ctx = myCanvas.getContext("2d");

const PADDING = 50

var windowHeight = window.innerHeight
var windowWidth = window.innerWidth
//sets canvas resolution( !canvas size)
myCanvas.setAttribute("width", windowWidth)
myCanvas.setAttribute("height", windowHeight)



const PADDLE_SPEED = 1
let movingUp = false
let movingDown = false

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
    update(dt) {
        if (movingUp) {
            this.posY -= dt * PADDLE_SPEED
        }
        if (movingDown) {
            this.posY += dt * PADDLE_SPEED
        }
        //CHECK BOUNDARY CONDITION
        this.posY = Math.min(Math.max(this.posY, PADDING), windowHeight - PADDING - this.height)

    }

}

class Ball {
    constructor(posX, posY, r) {
        this.speedX = -1
        this.speedY = 1
        this.posX = posX
        this.posY = posY
        this.r = r
        this.posX_in = posX
        this.posY_in = posY
        this.speedX_in = -1
        this.speedY_in = 1
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
        //if(PADDING> this.posX > windowWidth - PADDING) --> condition
        this.posX = this.posX_in
        this.posY = this.posY_in

    }

}

class GameManager {
    constructor() {
        this.ball = new Ball(windowWidth / 2, windowHeight / 2, 10)
        this.paddle1 = new Paddle(2 * PADDING, windowHeight / 2 - PADDING, 10, 100)
        this.paddle2 = new Paddle(windowWidth - 2 * PADDING, windowHeight / 2, 10, 100)
        this.lastTime = 0
        this.score1 = 0
        this.score2 = 0
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
        this.paddle1.draw()
        this.paddle2.draw()
        this.drawScore()
    }
    drawScore() {
        ctx.fillStyle = 'white'
        ctx.font = "bold 48px serif";
        ctx.fillText(`${this.score1} : ${this.score2}`, PADDING, PADDING)
    }

    update(dt) {
        this.paddle1.update(dt)
        //this.paddle2.update(dt)
        this.ball.update(dt)
        //bounce su e giu
        if (this.ball.posY < PADDING + this.ball.r || this.ball.posY > windowHeight - PADDING - this.ball.r) {
            this.ball.speedY = -(this.ball.speedY)
            this.ball.posY += 2 * dt * (this.ball.speedY)
        }
        if (PADDING > this.ball.posX) {
            this.score2++
            this.ball.reset()
        }
        if (this.ball.posX > this.paddle2.posX + PADDING) {
            this.score1++
            this.ball.reset()
        }
        //bounce sul puddle
        if (this.ball.posX < this.paddle1.posX + this.paddle1.width + this.ball.r &&
            (this.paddle1.posY < this.ball.posY + this.ball.r && this.ball.posY < this.ball.r + this.paddle1.posY + this.paddle1.height)) {
            this.ball.speedX = -(this.ball.speedX)
            this.ball.posX += 2 * dt * (this.ball.speedX)
        }
        if (this.ball.posX > this.paddle2.posX - this.ball.r &&
            (this.paddle2.posY < this.ball.posY + this.ball.r && this.ball.posY < this.ball.r + this.paddle2.posY + this.paddle2.height)) {
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
}

/**
 * 
 * @param {Event} event 
 */
function handleUserInput(event) {
    switch (event.type) {
        case "keydown":
            switch (event.code) {
                case "KeyW":
                    if (!movingUp) {
                        socket.emit("input", "up",)
                        movingUp = true
                    }
                    break
                case "KeyS":
                    if (!movingDown) {
                        socket.emit("input", "down")
                        movingDown = true
                    }
                    break
            }
            break
        case "keyup":
            switch (event.code) {
                case "KeyW":
                    if (movingUp) {
                        socket.emit("input", "none")
                        movingUp = false
                    }
                    break
                case "KeyS":
                    if (movingDown) {
                        socket.emit("input", "none")
                        movingDown = false
                    }
                    break
            }
            break
    }
}


var game = new GameManager()
game.start()
