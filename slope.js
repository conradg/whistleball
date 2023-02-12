// make canvas red
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

// This determines how quickly the line snaps back to y=0
const smoothingTimeConstant = 0.99;

let score = 0;
let lifes = 3;
let game_over = false;

// The number of seconds between each ball dropping
// once the list is exhausted, it stays on 500
// TODO: maybe make it exponential?
const difficulty = [
    5000, 5000, 5000, 5000, 5000, 5000, 5000,
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
            const y = v / 128.0 * canvas.height / 2;
            line.push([x, y])
            x += sliceWidth;
        });
        this.points = line;
        // test line
        // this.points = [[0,300], [1920,0]]
    }
}

class Game {
    constructor() {
        this.lifes = lifes
        this.score = score
        this.blobs = [];
        this.line = new Line();
        this.debug_points = [];
    }

    move() {
        this.blobs.forEach(blob => {
            blob.move(this.line);
        })
        this.line.calculate_line();
    }

    clear_canvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

    }

    draw() {
        this.clear_canvas();
        this.line.draw();
        this.blobs.forEach(blob => {
            blob.draw();
        })
    }

    check_blobs() {
        this.blobs.forEach(blob => {
            // If blob has exited to the right, increment score.
            if (blob.x > canvas.width) {
                this.increment_score();
                document.getElementById('score').innerText = `Score: ${score}`
            }
        })
        this.blobs.forEach(blob => {
            // If blob has exited to the right, lose a life!
            if (blob.x < 0) {
                this.lose_life();
                if (lifes == 0) {
                    this.show_screen("Game Over - click to try again")
                    game_over = true;
                }
                let str = "❤️".repeat(lifes)
                document.getElementById('lifes').innerText = `Lifes: ${str}`
            }
        })
        this.blobs = this.blobs.filter(blob => {
            return blob.y < canvas.height && blob.x < canvas.width && blob.x > 0 && blob.y > 0;
        })
    }

    show_screen(text) {
        let audioScreen = document.getElementById('audioScreen');
        audioScreen.style.display = "block";
        document.getElementById("instruction").innerText = text;
    }

    lose_life() {
        this.lifes = this.lifes - 1;
    }

    increment_score() {
        this.score = this.score + 1;
    }
}


game = new Game();

function loop() {
    game.move();
    game.draw();
    game.check_blobs()
    if (game_over) {
        return;
    }
    requestAnimationFrame(loop);
}

let game_inited = false;

document.onclick = function (event) {
    if (!game_inited) {
        // hide audioScreen
        const audioScreen = document.getElementById('audioScreen');
        audioScreen.style.display = 'none';

        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;

        // get Microphone input
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then(function (stream) {
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    loop();
                }
            );
        game_inited = true;
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
    loop();
    add_blobs(difficulty)
}

function add_blobs(difficulty) {
    setTimeout(() => {
        const blob = new Blob(canvas.width * 0.25, 100)
        game.blobs.push(blob)
        if (game_over) {
            return
        }
        add_blobs(difficulty.slice(1, difficulty.length))
    }, difficulty[0] || 500)
}

add_blobs(difficulty)


class Blob {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 5;
        this.y_speed = 0;
        this.x_speed = 0;
        this.debug_points = [];
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        if (DEBUG) {
            this.debug_points.forEach(([x, y, color]) => {
                this.draw_debug_point(x, y, color)
            });
        }
        this.debug_points = [];
    }

    move(line) {
        this.y_speed += 0.05
        this.y += this.y_speed
        this.x += this.x_speed

        // line collision logic
        for (let i = 0; i < line.points.length - 1; i++) {
            const [x, y] = line.points[i];
            const [nx, ny] = line.points[i + 1];


            if (this.x > x && this.x < nx) {
                // explanation of the collision logic in collision.png
                const m = (ny - y) / (nx - x)
                const slope_angle = Math.atan(m)
                const dx = this.x - x
                const dy = m * dx
                const y_offset = y + dy
                const y_ball_dist = y_offset - this.y
                const ball_offset = y_ball_dist * Math.cos(slope_angle)

                const normal_x = ball_offset * Math.sin(slope_angle)
                const normal_y = -ball_offset * Math.cos(slope_angle)

                const normal = new Vector(
                    normal_x,
                    normal_y
                )
                const velocity = new Vector(
                    this.x_speed,
                    this.y_speed
                )

                this.add_debug_point(this.x - normal.x * 10, this.y - normal.y * 10)
                this.add_debug_point(this.x + this.x_speed * 10, this.y + this.y_speed * 10, 'green')

                // Reflect the ball if it hits the line
                // this was basically just prompted by CoPilot...
                if (ball_offset < this.width) {
                    this.y = y_offset - this.width
                    const normal_vector_unit = normal.unit()
                    const normal_vector_unit_dot_product = normal_vector_unit.dot_product(velocity)
                    const normal_vector_unit_dot_product_x = normal_vector_unit_dot_product * normal_vector_unit.x
                    const normal_vector_unit_dot_product_y = normal_vector_unit_dot_product * normal_vector_unit.y
                    const tangent_vector = new Vector(
                        this.x_speed - normal_vector_unit_dot_product_x,
                        this.y_speed - normal_vector_unit_dot_product_y
                    )
                    const tangent_vector_unit = tangent_vector.unit()
                    const tangent_vector_unit_dot_product = tangent_vector_unit.dot_product(velocity)

                    const tangent_vector_unit_dot_product_x = tangent_vector_unit_dot_product * tangent_vector_unit.x
                    const tangent_vector_unit_dot_product_y = tangent_vector_unit_dot_product * tangent_vector_unit.y
                    const normal_vector_unit_dot_product_x_new = -normal_vector_unit_dot_product_x
                    const normal_vector_unit_dot_product_y_new = -normal_vector_unit_dot_product_y

                    this.x_speed = normal_vector_unit_dot_product_x_new + tangent_vector_unit_dot_product_x
                    this.y_speed = normal_vector_unit_dot_product_y_new + tangent_vector_unit_dot_product_y
                    this.y_speed *= 0.99
                    this.x_speed *= 0.99
                }
            }
        }
    }

    add_debug_point = function (x, y, colour = 'red') {
        this.debug_points.push([x, y, colour])
    }

    draw_debug_point(x, y, colour = 'red') {
        // draw a line from the centre of the ball to the point
        ctx.strokeStyle = colour;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y)
        ctx.lineWidth = 2;
        ctx.lineTo(x, y)
        ctx.stroke();
    }
}


window.onload = function () {
    game.show_screen("Click to enable audio")
}
