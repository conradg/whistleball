// render a circle in the middle of the canvas

const game_ctx = document.getElementById('game').getContext('2d');
game_state = {}

function init_game(){
    game_state.pipe = new Pipe()
    game_state.blob = new Blob()
}




class Pipe {
    constructor() {
        this.x = 100;
        this.y = 100;
        this.width = 50;
        this.height = 50;
    }

    draw() {
        game_ctx.fillStyle = 'green';
        game_ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(){
        this.x += 1
    }
}

function game_loop() {
    // game logic

    const {blob, pipe} = game_state
    pipe.move()
    // render
    // clear canvas
    game_ctx.fillStyle = 'white';
    game_ctx.fillRect(0, 0, game_ctx.canvas.width, game_ctx.canvas.height);

    game_state.blob.draw();
    game_state.pipe.draw()
    requestAnimationFrame(game_loop);
}

window.onload = function () {
    init_game()
    game_loop();
}


