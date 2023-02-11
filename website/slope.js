// make canvas red
const canvas = document.getElementById('audio');
const ctx = canvas.getContext('2d');

// get audio context
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 4096;
const bucket_frequency_size = audioCtx.sampleRate / analyser.fftSize;

const max_freq = 500;
const min_freq = 60;
let freq = 0;
let volume = 0;
analyser.smoothingTimeConstant = 0.99;

// show analyser contents in canvas
function draw_slope() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    // clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    const bins_shown = (max_freq - min_freq) / bucket_frequency_size;
    const sliceWidth = canvas.width * 1.0 / bins_shown;
    let x = 0;
    game_state.line = [];
    dataArray.forEach((v, i) => {
        let frequency = i * bucket_frequency_size;
        if (frequency > max_freq || frequency < min_freq) {
            return;
        }
        const y = v / 128.0 * canvas.height / 2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        game_state.line.push([x,y])
        x += sliceWidth;
    });

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

function draw_blobs() {
    game_state.blobs.forEach(blob => {
        blob.draw();
        blob.move();
    })
}

game_state = {
    blobs: []
}

function draw() {
    draw_slope();
    draw_blobs();
    requestAnimationFrame(draw);
}

// get microphone input
navigator.mediaDevices.getUserMedia({audio: true, video: false})
    .then(function (stream) {
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            draw();
            debugLowestFrequency()
        }
    );

document.onclick = function (event) {
    const x = event.x - 8
    const y = event.y - 8
    const blob = new Blob(x, y)
    game_state.blobs.push(blob)
    blob.draw()
    console.log(x,y)
}


class Blob {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 5;
        this.speed = 0;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
        ctx.fill();
    }

    move(){
        this.speed += 0.05
        this.y += this.speed
        for (let i = 0; i < game_state.line.length -1; i++){
            const [x,y] = game_state.line[i];
            const [nx, ny] = game_state.line[i+1];

            if (this.x > x && this.x < nx){
                const m = (ny-y)/(nx-x)
                const slope_angle = Math.atan(m)
                const dx = this.x - x
                const dy = m * dx
                const y_offset = y + dy
                const y_ball_dist = y_offset - this.y
                const ball_offset = y_ball_dist * Math.cos(slope_angle)
                const ux = this.x - ball_offset * Math.sin(slope_angle)
                const uy = this.y + ball_offset * Math.cos(slope_angle)

                this.debug_point(this.x, y_offset, 'blue')
                this.debug_point(ux, uy)
                console.log(ball_offset)
                if (ball_offset < this.width && this.speed > 0){
                    this.y = y_offset - this.width
                    this.speed = -this.speed
                }
            }
        }
    }

    debug_point(x, y, colour = 'red') {
    // draw a line from the centre of the ball to the point
        ctx.moveTo(this.x, this.y)
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.lineTo(x, y)
        ctx.stroke();
    }
}



