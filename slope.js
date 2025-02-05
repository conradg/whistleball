const canvas = document.getElementById('audio');
canvas.width = window.innerWidth;
const ctx = canvas.getContext('2d');

// get audio context
let audioCtx;
let analyser;
const fftSize = 1024;
const max_freq = 2000;
const min_freq = 900;
const DEBUG = false;

let game;

// This determines how quickly the line snaps back to y=0
const smoothingTimeConstant = 0.5;

let score = 0;
let lifes = 3;
let game_over = false;

// The number of seconds between each ball dropping
// once the list is exhausted, it stays on 500
// TODO: maybe make it exponential?
const difficulty = [
    3000, 5000, 5000, 5000, 5000, 5000, 5000,
    4000, 4000, 4000, 4000, 4000, 4000, 4000,
    3000, 3000, 3000, 3000, 3000, 3000, 3000,
    2000, 2000, 2000, 2000, 2000, 2000, 2000,
    1000, 1000, 1000, 1000, 1000, 1000, 1000,
    500, 500, 500, 500, 500, 500, 500,
]


class Line {
    constructor() {
        this.points = [];
    }

    draw() {
        // render
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        this.points.forEach(([x, y], i) => {
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        })
        ctx.stroke();
    }

    calculate_line() {
        // how wide each bucket is in terms of Hz range
        const bucket_width = audioCtx.sampleRate / analyser.fftSize;
        const bins_shown = (max_freq - min_freq) / bucket_width;
        const sliceWidth = canvas.width / bins_shown;
        let x = 0;
        let line = []; // store the coordinates of each line segment in this array
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        dataArray.forEach((v, i) => {
            let frequency = i * bucket_width;
            if (frequency > max_freq || frequency < min_freq) {
                return;
            }
            const y = v / 128.0 * canvas.height / 2 + 13;
            line.push([x, y])
            x += sliceWidth;
        });
        this.points = line;
        // test line
        // this.points = [[0,13], [1920,13]]
    }
}

class Game {
    constructor() {
        this.lifes = lifes
        this.score = score
        this.blobs = [];
        this.line = new Line();
        this.debug_points = [];
        this.ctx = ctx;
    }

    clear_canvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    }

    move() {
        this.blobs.forEach(blob => {
            blob.move(this.line);
        })
        this.line.calculate_line();
    }

    draw() {
        this.clear_canvas();
        this.line.draw();
        this.blobs.forEach(blob => {
            blob.draw(this.ctx);
        })
    }

    check_blobs() {
        this.blobs.forEach(blob => {
            // If blob has exited to the right, increment score.
            if (blob.x > canvas.width) {
                this.increment_score();
                document.getElementById('score').innerText = `Score: ${this.score}`
            }
        })
        this.blobs.forEach(blob => {
            // If blob has exited to the right, lose a life!
            if (blob.x < 0) {
                this.lose_life();
                if (this.lifes == 0) {
                    show_screen("Game Over - Click to try again \n"+
                        "Score: " + this.score)
                    game_over = true;
                }
                let str = "❤️".repeat(this.lifes)
                document.getElementById('lifes').innerText = `Lifes: ${str}`
            }
        })
        this.blobs = this.blobs.filter(blob => {
            return blob.y < canvas.height && blob.x < canvas.width && blob.x > 0 && blob.y > 0;
        })
    }

    add_blob(blob) {
        this.blobs.push(blob);
    }


    lose_life() {
        this.lifes = this.lifes - 1;
    }

    increment_score() {
        this.score = this.score + 1;
    }

    loop() {
        this.move();
        this.draw();
        this.check_blobs()
        if (game_over) {
            return false;
        }
    }
}

let audio_context_initialised = false;
document.onclick = function (event) {
    if (!audio_context_initialised) {
        // initialise audio context
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;

        // get Microphone input
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then(function (stream) {
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    reset_game()
                }
            );
        audio_context_initialised = true;
    }

    if (game_over) {
        reset_game();
    }
}

function reset_game() {
    game = new Game();
    document.getElementById('score').innerText = `Score: ${game.score}`
    document.getElementById('lifes').innerText = `Lifes: ${"❤️".repeat(game.lifes)}`
    game_over = false;
    let audioScreen = document.getElementById('audioScreen');
    audioScreen.style.display = "none";
    game_loop();
    add_blobs(difficulty)
}

function add_blobs(difficulty) {
    setTimeout(() => {
        game.add_blob(new Ball(canvas.width * 0.25, 4))
        game.draw()
        if (game_over) {
            return
        }
        add_blobs(difficulty.slice(1, difficulty.length))
    }, difficulty[0] || 500)
}

function game_loop() {
    if (game.loop() === false) {
        return false;
    }
    requestAnimationFrame(game_loop);
}

function show_screen(text)
{
    let audioScreen = document.getElementById('audioScreen');
    audioScreen.style.display = "block";
    document.getElementById("instruction").innerText = text;
}


window.onload = function () {
    show_screen("Click to enable audio")
}
