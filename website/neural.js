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
function draw() {
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
    line = []
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
        x += sliceWidth;
    });

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    requestAnimationFrame(draw);
}

// set debug <p> element to show the lowest frequency
const debug = document.getElementById('debug');

function debugLowestFrequency() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    let loudest = 0;
    let loudest_index = 0;
    // get max value in array
    dataArray.forEach((v, i) => {
        if (v > loudest) {
            loudest = v;
            loudest_index = i;
        }
    });
    debug.innerText = `
    Lowest frequency: ${loudest_index}
    Loudest frequency: ${loudest}
    `;
    volume = loudest;
    freq = loudest_index;
    requestAnimationFrame(debugLowestFrequency);
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


class Blob {
    constructor() {
        this.x = 100;
        this.y = 100;
        this.width = 50;
        this.height = 50;
    }

    draw() {
        game_ctx.fillStyle = 'red';
        game_ctx.beginPath();
        game_ctx.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
        game_ctx.fill();
    }

    move(){
    }
}
