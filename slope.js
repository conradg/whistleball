// make canvas red
const canvas = document.getElementById('audio');
const ctx = canvas.getContext('2d');

// get audio context
let audioCtx;
let analyser;
const fftSize = 1024;
const max_freq = 2000;
const min_freq = 900;
let freq = 0;
let volume = 0;
const smoothingTimeConstant = 0.99;
let score = 0;
let lifes = 3;
let game_over = false;
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
        // calculate points
        const bucket_frequency_size = audioCtx.sampleRate / analyser.fftSize;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const bins_shown = (max_freq - min_freq) / bucket_frequency_size;
        const sliceWidth = canvas.width * 1.0 / bins_shown;
        let x = 0;
        let line = [];
        dataArray.forEach((v, i) => {
            let frequency = i * bucket_frequency_size;
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
        this.blobs = [];
        this.line = new Line();
        this.debug_points = [];
    }

    move() {
        this.blobs.forEach(blob => {
            blob.move();
        })
        this.line.calculate_line();
    }

    draw() {
        clear_canvas();
        this.line.draw();
        this.blobs.forEach(blob => {
            blob.draw();
        })
    }

    garbage_collect_blobs() {
        this.blobs.forEach(blob => {
                if (blob.x > canvas.width) {
                    score = score + 1;
                    document.getElementById('score').innerText = `Score: ${score}`
                }
            }
        )
        this.blobs.forEach(blob => {
                if (blob.x < 0) {
                    lifes = lifes - 1;
                    if (lifes == 0) {
                        //show audio screen
                        let audioScreen = document.getElementById('audioScreen');
                        audioScreen.style.display = "block";
                        document.getElementById("instruction").innerText = "Game Over - click to try again";
                        game_over = true;
                    }
                    let str = "❤️".repeat(lifes)
                    document.getElementById('lifes').innerText = `Lifes: ${str}`
                }
            }
        )
        this.blobs = this.blobs.filter(blob => {
            return blob.y < canvas.height && blob.x < canvas.width && blob.x > 0 && blob.y > 0;
        })
    }
}


function clear_canvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

}


game = new Game();

function loop() {
    game.move();
    game.draw();
    game.garbage_collect_blobs()
    if (game_over){
        return;
    }
    requestAnimationFrame(loop);
}

// get microphone input

let game_inited = false;

document.onclick = function (event) {
    // const x = event.x - 8
    // const y = event.y - 8
    // const blob = new Blob(x, y)
    // game.blobs.push(blob)
    // blob.draw()
    if (!game_inited) {
        // hide audioScreen
        const audioScreen = document.getElementById('audioScreen');
        audioScreen.style.display = 'none';

        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then(function (stream) {
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    loop();
                    // debugLowestFrequency();
                    // showBlobCount();
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
    score = 0;
    lifes = 3;
    document.getElementById('score').innerText = `Score: ${score}`
    let str = "❤️".repeat(lifes)
    document.getElementById('lifes').innerText = `Lifes: ${str}`
    game_over = false;
    let audioScreen = document.getElementById('audioScreen');
    audioScreen.style.display = "none";
    loop();
}

function add_blobs(difficulty) {
    setTimeout(() => {
        const blob = new Blob(400, 100)
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

        this.debug_points.forEach(([x, y, color]) => {
            this.draw_debug_point(x, y, color)
        })
        this.debug_points = [];
    }

    move() {
        this.y_speed += 0.05
        this.y += this.y_speed
        this.x += this.x_speed

        // line collision logic
        for (let i = 0; i < game.line.points.length - 1; i++) {
            const [x, y] = game.line.points[i];
            const [nx, ny] = game.line.points[i + 1];


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
                // this.add_debug_point(this.x - normal.x * 10, this.y - normal.y * 10)
                // this.add_debug_point(this.x + this.x_speed * 10, this.y + this.y_speed * 10, 'green')


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


class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    unit() {
        const length = this.length()
        return new Vector(this.x / length, this.y / length)
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }

    dot_product(vector) {
        return this.x * vector.x + this.y * vector.y
    }
}
