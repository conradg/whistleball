// make canvas red
const canvas = document.getElementById('audio');
const ctx = canvas.getContext('2d');

// get audio context
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 4096;
const bucket_frequency_size = audioCtx.sampleRate / analyser.fftSize;

const max_freq = 180;
const min_freq = 60;
let freq = 0;
let volume = 0;
analyser.smoothingTimeConstant = 0.99;


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
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }

    calculate_line() {
        // calculate points
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
        line.push([canvas.width, canvas.height / 2])
        this.points = line;
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
    requestAnimationFrame(loop);
}

// get microphone input
navigator.mediaDevices.getUserMedia({audio: true, video: false})
    .then(function (stream) {
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            loop();
            debugLowestFrequency();
            showBlobCount();
        }
    );

document.onclick = function (event) {
    const x = event.x - 8
    const y = event.y - 8
    const blob = new Blob(x, y)
    game.blobs.push(blob)
    blob.draw()
    console.log(x, y)
}


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
                this.add_debug_point(this.x - normal.x*10, this.y - normal.y*10)
                this.add_debug_point(this.x + this.x_speed * 10, this.y + this.y_speed * 10, 'green')

                if (ball_offset < this.width) {
                    this.y = y_offset - this.width
                    const normal_vector_length = Math.sqrt(normal_x ** 2 + normal_y ** 2)
                    const normal_vector_unit = [normal_x / normal_vector_length, normal_y / normal_vector_length]
                    const normal_vector_unit_x = normal_vector_unit[0]
                    const normal_vector_unit_y = normal_vector_unit[1]
                    const normal_vector_unit_dot_product = normal_vector_unit_x * this.x_speed + normal_vector_unit_y * this.y_speed
                    const normal_vector_unit_dot_product_x = normal_vector_unit_dot_product * normal_vector_unit_x
                    const normal_vector_unit_dot_product_y = normal_vector_unit_dot_product * normal_vector_unit_y
                    const tangent_vector = [this.x_speed - normal_vector_unit_dot_product_x, this.y_speed - normal_vector_unit_dot_product_y]
                    const tangent_vector_length = Math.sqrt(tangent_vector[0] ** 2 + tangent_vector[1] ** 2)
                    const tangent_vector_unit = [tangent_vector[0] / tangent_vector_length, tangent_vector[1] / tangent_vector_length]
                    const tangent_vector_unit_x = tangent_vector_unit[0]
                    const tangent_vector_unit_y = tangent_vector_unit[1]
                    const tangent_vector_unit_dot_product = tangent_vector_unit_x * this.x_speed + tangent_vector_unit_y * this.y_speed
                    const tangent_vector_unit_dot_product_x = tangent_vector_unit_dot_product * tangent_vector_unit_x
                    const tangent_vector_unit_dot_product_y = tangent_vector_unit_dot_product * tangent_vector_unit_y
                    const normal_vector_unit_dot_product_x_new = -normal_vector_unit_dot_product_x
                    const normal_vector_unit_dot_product_y_new = -normal_vector_unit_dot_product_y

                    this.x_speed = normal_vector_unit_dot_product_x_new + tangent_vector_unit_dot_product_x
                    this.y_speed = normal_vector_unit_dot_product_y_new + tangent_vector_unit_dot_product_y
                    // this.y_speed *= 0.9
                    // this.x_speed *= 0.9
                    return
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

    normalised() {
        const length = this.length()
        return new Vector(this.x / length, this.y / length)
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }
}
