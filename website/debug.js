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


// show blob count on screen
function showBlobCount() {
    const blobCount = document.getElementById('blobCount');
    blobCount.innerText = game.blobs.length;
    requestAnimationFrame(showBlobCount);
}

