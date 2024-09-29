
//@ts-nocheck
import {createProgram, createShader, setImageData, drawImage} from "./util.js";
import {m4} from "./mat4.js";
import { randRange } from "../../lib/mathUtil.js";

let gl: any, sprite: any, lastTime: any;

const gravity = 10;
const programs: any[] = [];
const minimum_fps = 0.016666666666666666;
const aspectRatioHeight = 0.5568627450980392;


const audio: any = {
    init() {
        this.die = document.getElementById("die-aud");
        this.hit = document.getElementById("hit-aud");
        this.wing = document.getElementById("wing-aud");
        this.point = document.getElementById("point-aud");
    }
}

const game: any = {
    sx: 0,  // use for manipulating texture for day and night toggle
    buffer: null,
    pipes: [],
    timeOut: 5.5,   // timeout untill the first pipe is spawn
    stateMode: {
        OVER: "Game is over",
        ACTIVE: "Game is running",
        IDLE: "Splash is playing"
    },

    restart() {
        this.isFirstRun = true;
        this.score = 0;
        this.pipes = [];
        bird.velocity = {x: 0, y: 0};
        bird.rotation = 0;
        Pipe.COUNTER = 0;
        bird.translation.y = (Pipe.HEIGHT + Pipe.SPACING) * 0.5 - bird.height * 0.5;
        this.state = this.stateMode.ACTIVE;
        floor.speed = floor.lastSpeed;
        lastTime = Date.now();
        this.sx = [0, 146][Math.floor(Math.random() * 2)];
    },

    set score(s) {
        this._score = s;
        if(this.state == this.stateMode.ACTIVE)
            this.scoreEl.innerHTML = Math.floor(s / 2);
        else 
            this.scoreEl.innerHTML = "";
    },

    get score() { return this._score },

    init() {
        this.scoreEl = document.getElementById("score");
        this.buffer = gl.createBuffer();
        this.data = setImageData(sprite, 0, 0, 144, 260, gl.canvas.width);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.data), gl.DYNAMIC_DRAW);
        floor.init();
        bird.init();
        this.state = this.stateMode.IDLE;
    },

    /**
     * This method comes in handy while drawing everything when 
     * game is idle and/or over... 
     * 
     * it's like setImageData 
     * 
     * @param {WebGLProgram} program program
     * @param {number} sx source begin
     * @param {number} sy source begin on the y-axis
     * @param {number} sw source width
     * @param {number} sh source height
     * @param {number} w destination width
     * @param {number} x translation x
     * @param {number} y translation y
     */
    drawAt(program, sx, sy, sw, sh, w, x = 0, y = 0) {
        let mTransformed = m4.translation(x, y, 0);
        gl.uniformMatrix4fv(program.uniforms.model, false, mTransformed);
        let data = setImageData(sprite, sx, sy, sw, sh, w);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.data), gl.DYNAMIC_DRAW);
        drawImage(gl, this.buffer, program.attributes.pos, program.attributes.tex);
    }
}


const floor: any = {
    array: [],
    lastSpeed: 100,
    speed: 100,

    init() {

        this.data = setImageData(sprite, 300, 0, 155, 55, gl.canvas.width);
        this.y = gl.canvas.height - this.data.height;
        this.array.push({x: 0, y: this.y});
        this.array.push({x: gl.canvas.width, y: this.y});

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.data), gl.STATIC_DRAW);

        Pipe.SPACING = this.y * 0.2;
        Pipe.HEIGHT = this.y - Pipe.SPACING;
    },

    update(deltaTime) {
        this.array.forEach(data => {
            data.x -= this.speed * deltaTime;
            if(data.x < -gl.canvas.width) {
                data.x = gl.canvas.width - 4;
            }
        });
    },

    draw(program) {
        this.array.forEach(data => {
            const modelMatrix = m4.translation(data.x, data.y, 0);
            gl.uniformMatrix4fv(program.uniforms.model, false, modelMatrix);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            drawImage(gl, this.buffer, program.attributes.pos, program.attributes.tex);
        });
    }

}


class Pipe {

    public translation: any;
    public data: any;
    public width: any;
    public height: any;

    public buffer;
    public _hasPassed: boolean = false;

    constructor(w: number, h: number, type: string = "up" ) {
        this.translation = {x: gl.canvas.width, y: 0};
        const sx = type === "up" ? 56 : 84;
        this.data = setImageData(sprite, sx, 324, 26, 160, w, h); 
        this.width = this.data.width;
        this.height = this.data.height;

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.data), gl.DYNAMIC_DRAW);
        this._hasPassed = false;
    }

    update(dt: number) {
        this.translation.x -= floor.speed * dt;

        // AABB collision check
        if(this.translation.x + this.width > bird.translation.x && 
            bird.translation.x + bird.width > this.translation.x && 
            this.translation.y + this.height > bird.translation.y && 
            bird.translation.y + bird.height > this.translation.y
        ) {
            floor.speed = 0;
            audio.hit.play();
        }

        // check if pipe is offscreen and delete it
        if(this.translation.x < -this.width) {
            game.pipes.splice(game.pipes.indexOf(this), 1);
            gl.deleteBuffer(this.buffer);
        }

        // check if the bird flap successfully past the pipe
        if(this.translation.x + this.width < bird.translation.x) {
            if(!this._hasPassed) {
                game.score++;
                this._hasPassed = true;
                audio.point.play();
            }
        }
    }

    draw(program: any) {
        let mTransformed = m4.translation(this.translation.x, this.translation.y, 0);
        gl.uniformMatrix4fv(program.uniforms.model, false, mTransformed);
        gl.bindBuffer(gl.ARRAY_BUFFER, game.buffer);
        drawImage(gl, this.buffer, program.attributes.pos, program.attributes.tex);
    }

    static create() {
        // top pipe
        let height = randRange(Pipe.HEIGHT * 0.1, Pipe.HEIGHT);
        const width = gl.canvas.width * 0.15;
        let pipe = new Pipe(width, height);
        game.pipes.push(pipe);

        // bottom pipe
        height = Pipe.HEIGHT - height;
        pipe = new Pipe(width, height, "down");
        pipe.translation.y = floor.y - height;
        game.pipes.push(pipe);
    }

}


Object.defineProperties(Pipe, {
    // sumation of both pipe heights
    HEIGHT: {
        value: 0, 
        writable: true
    },
    // spacing between both pipes
    SPACING: {
        value: 0, 
        writable: true
    },
    // timeout untill new pipe is spawn
    TIMEOUT: {
        value: 3,
        writable: true
    },
    // timeout counter
    COUNTER: {
        value: 0, 
        writable: true
    }
});


const bird: any = {

    jumpForce: 290,

    init() {
        this.width = Pipe.SPACING * 0.25;
        this.height = this.width;
        this.translation = {x: gl.canvas.width * 0.2, y: 0};
        this.velocity = {x: 0, y: 0};
        this.data = setImageData(sprite, 30, 500, 18, 14, this.width, this.height);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.data), gl.STATIC_DRAW);
        this.animationFrame = [2, 30, 58];
        this._animationCounter = 0;
        this._animationIndex = 0;
        this.rotation = 0;
    },

    update(dt: number) {
        this.velocity.y += gravity;
        this.translation.y += this.velocity.y * dt;
        this._animationCounter += dt;

        if(this.velocity.y > 0) {
            // bird is falling
            this._animationIndex = 0;
            this.rotation += dt * 0.8;
            if(this.rotation > Math.PI / 6) {
                this.rotation = Math.PI / 6;
            }
        } else {
            // make bird flap
            this.rotation = 0;
            if(this._animationCounter >= 0.15) {
                this._animationCounter = 0;
                this._animationIndex++;
                if(this._animationIndex >= this.animationFrame.length) 
                    this._animationIndex = 0;
            }
        }

        if(this.translation.y < 0)  {
            this.translation.y = 0;
            this.velocity.y *= 0.8;
        }
        if(this.translation.y + this.height >= floor.y) {
            this.translation.y = floor.y - this.height;
            game.state = game.stateMode.OVER;
            audio.die.play();
        }

    },

    draw(program: any) {
        let modelMatrix = m4.translation(this.translation.x, this.translation.y, 0);
        modelMatrix = m4.rotate(modelMatrix, this.rotation);
        const sx = this.animationFrame[this._animationIndex];
        this.data = setImageData(sprite, sx, 490, 18, 14, this.width, this.height);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.data), gl.STATIC_DRAW);
        gl.uniformMatrix4fv(program.uniforms.model, false, modelMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        drawImage(gl, this.buffer, program.attributes.pos, program.attributes.tex);
    }

}


const setupCanvas = () => {
    const gameArea = document.getElementById("game-area") as HTMLDivElement;
    const windowWidth = Math.min(Math.min(400, innerHeight), innerWidth);
    gameArea.style.width = windowWidth + "px";
    gameArea.style.height = windowWidth / aspectRatioHeight + "px";

    const canvas = document.getElementById("gl") as HTMLCanvasElement;
    canvas.width = parseFloat(window.getComputedStyle(canvas).getPropertyValue("width"));
    canvas.height = parseFloat(window.getComputedStyle(canvas).getPropertyValue("height"));
    if(!canvas) {
        alert("Your Browser does not support HTML5 Canvas: That's a weird browser");
        throw new Error("Canvas Element not supported");
    }

    // initialise webgl
    gl = canvas.getContext("webgl", {
        depth: false,
        premultipliedAlpha: false,
        antialias: false,
        alpha: false });

    if(!gl) {
        alert("Failed to created Webgl1.0 rendering context");
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}


const setupPrograms = () => {
    const vertexShaderSource = (document.getElementById("vertex-shader") as HTMLScriptElement).textContent;
    const fragmentShaderSource = (document.getElementById("fragment-shader")as HTMLScriptElement).textContent;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource as string) as WebGLShader;
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource as string) as WebGLShader;
    const program = createProgram(gl, vertexShader, fragmentShader);
    programs.push({
        program,
        attributes: {
            position: gl.getAttribLocation(program, "aPos"),
            tex: gl.getAttribLocation(program, "aTexCoord")
        },
        uniforms: {
            projection: gl.getUniformLocation(program, "uProjectionMatrix"),
            model: gl.getUniformLocation(program, "uModelMatrix")
        }
    });
}


const update = (deltaTime: number) => {
    events.onActive();
    if(game.state == game.stateMode.ACTIVE) {
        bird.update(deltaTime);
        game.pipes.forEach((pipe: any) => pipe.update(deltaTime));
        floor.update(deltaTime);
    
        // update pipe 
        //@ts-ignore
        Pipe.COUNTER += deltaTime;  //@ts-ignore
        if(game.isFirstRun) {
            if(Pipe.COUNTER >= game.timeOut) {
                Pipe.create();
                game.isFirstRun = false;
                Pipe.COUNTER = 0;
            }
        } else {
            if(Pipe.COUNTER >= Pipe.TIMEOUT) {
                Pipe.create();
                Pipe.COUNTER = 0;
            }
        }
    }

    events.active = null;
}

const draw = () => {
    let program;
    gl.clear(gl.COLOR_BUFFER_BIT);
    program = programs[0];
    gl.useProgram(program.program);

    const mProjection = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
    gl.uniformMatrix4fv(program.uniforms.projection, false, mProjection);
    gl.uniformMatrix4fv(program.uniforms.model, false, m4.identity());


    // draw background image
    game.drawAt(program, game.sx, 0, 144, 260, gl.canvas.width);
    floor.draw(program);
    game.pipes.forEach((pipe: any) => pipe.draw(program));

    if(game.state == game.stateMode.IDLE) {
        // idle
        game.drawAt(program, 345, 90, 100, 26, gl.canvas.width, 0, gl.canvas.height * 0.05);
        game.drawAt(program, 290, 58, 100, 26, gl.canvas.width * 0.7, 
            gl.canvas.width * 0.5 - gl.canvas.width * 0.35, gl.canvas.height * 0.3);
        game.drawAt(program, 300, 90, 40, 20, gl.canvas.width * 0.4, 
        gl.canvas.width * 0.5 - gl.canvas.width * 0.2, gl.canvas.height * 0.5);
        game.drawAt(program, 290, 120, 60, 38, gl.canvas.width * 0.8, 
            gl.canvas.width * 0.5 - gl.canvas.width * 0.4, gl.canvas.height * 0.7);

    } else if(game.state == game.stateMode.OVER) {
        // over
        game.drawAt(program, 390, 58, 105, 28, gl.canvas.width * 0.7, 
            gl.canvas.width * 0.5 - gl.canvas.width * 0.35, gl.canvas.height * 0.2);
        game.drawAt(program, 350, 116, 60, 32, gl.canvas.width * 0.4, 
            gl.canvas.width * 0.5 - gl.canvas.width * 0.2, gl.canvas.height * 0.35);
        bird.draw(program);
    } else {
        // active
        bird.draw(program);
    }
}

const animate = () => {
    const now = Date.now();
    let deltaTime = (now - lastTime) * 1e-3;
    while(deltaTime > minimum_fps) {
        deltaTime -= minimum_fps;
        update(minimum_fps);
    }
    update(deltaTime);
    lastTime = Date.now();
    draw();
    requestAnimationFrame(animate);
}


const events: any = {
    active: null,
    onActive() {
        switch(this.active) {
            case "space":
                switch(game.state) {
                    case game.stateMode.OVER:
                        game.score = 0;
                        game.state = game.stateMode.IDLE;
                        break;
                    case game.stateMode.IDLE:
                        game.state = game.stateMode.ACTIVE;
                        game.restart();
                        break;
                    case game.stateMode.ACTIVE:
                        if(floor.speed > 0) {
                            bird.velocity.y = -bird.jumpForce;
                            audio.wing.play();
                        }
                        break;
                }   
                break;
        }
    }
}


const eventHandler = () => {
    window.addEventListener("keyup", e => {
        switch(e.key) {
            case " ":
                events.active = "space";
                break;
        }
    });
    window.addEventListener("touchend", e => {
        events.active = "space";
    });

}


const main = () => {
    setupCanvas();
    setupPrograms();

    audio.init();

    sprite = new Image();
    sprite.crossOrigin = "Anonymous";
    sprite.src = "../../assets/images/flappybird.png";   

    // wait for image to load
    sprite.addEventListener("load", () => {
        const tex = gl.createTexture();
        // let assume all images are not power of 2
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sprite);

        setTimeout(() => {
            (document.getElementById("splash") as HTMLDivElement).style.opacity = "0";
            eventHandler();
            game.init();
            requestAnimationFrame(animate);
        }, 3000);
    });
    
    sprite.addEventListener("error", (e: any) => {
        console.log(e);
    });
}

addEventListener("load", main);