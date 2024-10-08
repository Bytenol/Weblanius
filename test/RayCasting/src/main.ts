import {Shader} from "./core/shader.js";
import {Mat4} from "./math/mat4.js";
import {createVBO} from "./core/arrayBuffer.js";

let W = 0;
let H = 0;

const evt = "";

const vertexShader = `
attribute vec2 position;
attribute vec2 texCoord;
attribute vec4 color;
attribute float texId;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
varying vec4 v_color;
varying vec2 v_texCoord;
varying float v_texId;
void main() {
    v_color = color;
    v_texId = texId;
    v_texCoord = texCoord;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision mediump float;
uniform sampler2D image;
varying vec4 v_color;
varying vec2 v_texCoord;

void main() {
    int y = int(4.5);
    gl_FragColor = texture2D(image, v_texCoord) * v_color;
}
`;

let shader: Shader;

const textures = {
    all: { },
    getByName(name: string): Texture {
        return <Texture>this.all[name];
    },
    getAsArray(){
        let textures = [];
        for(const name in this.all) {
            textures.push(this.all[name].texture);
        }
        return textures;
    }
};

let wallBuffer: WebGLBuffer;

class Vertex {
    constructor(
        public position: vec2,
        public texCoord: vec2,
       public color: vec4,
        public texId: number
    ) {}

    getData(){ return [...this.position, ...this.texCoord, ...this.color, this.texId]; }

    static getSize(){ return Float32Array.BYTES_PER_ELEMENT * (4 + 2 + 2 + 1) }

}

addEventListener("load", () => {
    const cnv1 = <HTMLCanvasElement>document.getElementById("cvs1");
    const cnv2 = <HTMLCanvasElement>document.getElementById("cvs2");

    W = cnv1.width = cnv2.width = tile.size * tile.col;
    H = cnv1.height = cnv2.height = tile.size * tile.row;

    const gl = <WebGLRenderingContext>cnv1.getContext("webgl");
    const ctx2 = <CanvasRenderingContext2D>cnv2.getContext("2d");

    shader = new Shader(gl, vertexShader, fragmentShader);
    shader.use();

    let lineSize = W * Vertex.getSize() * 2;
    wallBuffer = createVBO(gl, null, lineSize * 3, gl.DYNAMIC_DRAW);

    const imageSrc = ["walls", "pillar"];

    loadAllImage(gl, ...imageSrc).then(e => {
        gl.bindTexture(gl.TEXTURE_2D, textures.getByName("walls").texture);
        startLoop(gl, ctx2);
    });
})

const map = [
    1,1,1,1,1,1,1,1,
    1,0,0,0,0,0,0,1,
    1,0,0,1,0,0,0,1,
    1,0,0,1,1,0,0,1,
    1,0,0,0,0,0,0,1,
    1,0,0,1,0,1,0,1,
    1,0,0,0,0,1,0,1,
    1,1,1,1,1,1,1,1,
];

const tile = {
    col: 8,
    row: 8,
    size: 64
};

const player = {
    x: 128, y: 170,
    vx: 0, vy: 0,
    a: -90, s: 0,
    rays: [],
    fov: 60,
    height: 32,
};

const startLoop = (gl: WebGLRenderingContext, ctx2: CanvasRenderingContext2D) => {
    const loop = () => {
        update(gl,1/60);
        drawCastedRay(gl);
        drawMipMap(ctx2);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

class Ray {
    angle: number;
    relAngle: number;
    endPos = [0, 0];
    hyp: number = 0;
    color: vec4 = [0, 0, 0, 1];
    sx: number;
    constructor(a: number) {
        this.relAngle = degToRad(player.a + a);
        this.angle = degToRad(a);
    }

    #getHorizontalCollision() {
        let hyp: number = 0;
        const isUp = -1 * Math.sin(this.relAngle) >= 0;
        const isLeft = -1 * Math.cos(this.relAngle) >= 0;

        const fLeft = isLeft ? -1 : 1;
        const fUp = isUp ? -1 : 1;

        let px: number, py: number;
        py = ~~(player.y / tile.size);
        const firstY = py * tile.size + (isUp ? 0 : tile.size);

        let yA = Math.abs(firstY - player.y) * fUp;
        let xA = Math.abs(yA / Math.tan(this.relAngle)) * fLeft;

        let ny = player.y + yA;
        let nx = player.x + xA;

        let isHit = false;
        let id: number;

        while(!isHit) {
            px = ~~(nx / tile.size);
            py = ~~(ny / tile.size) - (isUp ? 1 : 0);
            id = map[py * tile.col + px];
            hyp = Math.hypot(player.x - nx, player.y - ny);
            if(id > 0 || typeof id !== "number") break;
            let opp = tile.size * fUp;
            let adj = Math.abs(opp / Math.tan(this.relAngle)) * fLeft;
            nx += adj;
            ny += opp;
        }
        return {hyp, pos: [nx, ny], id};
    }

    #getVerticalCollision() {
        let hyp: number = 0;
        const isUp = -1 * Math.sin(this.relAngle) >= 0;
        const isLeft = -1 * Math.cos(this.relAngle) >= 0;

        const fLeft = isLeft ? -1 : 1;
        const fUp = isUp ? -1 : 1;

        let py: number, px: number;
        px = ~~(player.x / tile.size);
        const firstX = px * tile.size + (isLeft ? 0 : tile.size);

        let xA = Math.abs(firstX - player.x) * fLeft;
        let yA = Math.abs(xA * Math.tan(this.relAngle)) * fUp;

        let nx = player.x + xA;
        let ny = player.y + yA;

        let isHit = false;
        let id: number;

        while(!isHit) {
            px = ~~(nx / tile.size) - (isLeft ? 1 : 0);
            py = ~~(ny / tile.size);
            id = map[py * tile.col + px];
            hyp = Math.hypot(player.x - nx, player.y - ny);
            if(id > 0 || typeof id !== "number") break;
            let adj = tile.size * fLeft;
            let opp = Math.abs(adj * Math.tan(this.relAngle)) * fUp;
            nx += adj;
            ny += opp;
        }

        return {hyp, pos: [nx, ny], id};
    }

    update() {
        const h1 = this.#getHorizontalCollision();
        const h2 = this.#getVerticalCollision();
        if(h1.hyp < h2.hyp) {
            this.color = [1, 1, 1, 1]//[0.35, 0.35, 0.35, 1]; //#fff
            this.endPos = h1.pos;
            this.hyp = h1.hyp;
            this.sx = h1.pos[0] % 64;
        } else {
            this.color = [1, 1, 1, 1];
            this.endPos = h2.pos;
            this.hyp = h2.hyp;
            this.sx = h2.pos[1] % 64;
        }
    }

}


const update = (gl: WebGLRenderingContext, dt: number) => {
    player.s = tile.size;
    player.x += player.vx;
    player.y += player.vy;

    player.rays = [];
    let vertices = [];
    const incA = player.fov / W;
    const hfov = player.fov / 2;

    let j = 0;
    for(let  i = -hfov; i < hfov; i += incA, j++) {
        const ray = new Ray(i);
        ray.update();
        player.rays.push(ray);

        let ox = player.x;
        let oy = player.y;

    }

    // wall casting
    for(let j = 0; j < W; j++) {
        const ray = player.rays[j];
        const h1 = ray.hyp * Math.cos(ray.angle);
        let h = tile.size / h1 * 277;
        const md = H * 0.5;
        const rayStart = md - h * 0.5;
        let rayEnd = rayStart + h;

        // walls
        let texCoordStart: vec2 = [(ray.sx / 64)/8 + 1/8, 0];
        let texCoordEnd: vec2 = [(ray.sx / 64)/8 + 1/8, 1];
        const texId = 0;

        let v1 = new Vertex([j, rayStart], texCoordStart, ray.color, texId).getData();
        let v2 = new Vertex([j, rayEnd], texCoordEnd, ray.color, texId).getData();
        vertices.push(...v1, ...v2);

        for(let row; row < H; row++) {

        }

    }

    gl.bindBuffer(gl.ARRAY_BUFFER, wallBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertices));

}

const drawCastedRay = (gl: WebGLRenderingContext) => {
    gl.viewport(0, 0, W, H);
    // gl.clearColor(1, 1, 1, 1);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const projectionMatrix = Mat4.ortho(0, W, H, 0, 1, -1);
    const viewMatrix = Mat4.identity();
    let modelMatrix = Mat4.identity();
    // modelMatrix = Mat4.scale(modelMatrix, 64, 64, 1);
    shader.use();
    let stride = 9 * Float32Array.BYTES_PER_ELEMENT;
    shader.enableAttributes({
        position: { buffer: wallBuffer, size: 2, type: gl.FLOAT, stride, offset: 0 },
        texCoord: { buffer: wallBuffer, size: 2, type: gl.FLOAT, stride, offset: 2 * Float32Array.BYTES_PER_ELEMENT },
        color: { buffer: wallBuffer, size: 4, type: gl.FLOAT, stride, offset: 4 * Float32Array.BYTES_PER_ELEMENT },
        texId: { buffer: wallBuffer, size: 1, type: gl.FLOAT, stride, offset: 8 * Float32Array.BYTES_PER_ELEMENT },
    });
    shader.uniformSetters({ projectionMatrix, viewMatrix, modelMatrix });
    gl.drawArrays(gl.LINES, 0, W * 6);
}

const drawMipMap = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // draw map
    for (let i = 0; i < tile.row; i++) {
        for(let j = 0; j < tile.col; j++) {
            const px = ~~(j * tile.size);
            const py = ~~(i * tile.size);
            const id = map[i * tile.col + j];
            ctx.fillStyle = id === 1 ? "#f00" : "#fff";
            ctx.strokeStyle = "#222";
            ctx.fillRect(px, py, tile.size, tile.size);
            ctx.strokeRect(px, py, tile.size, tile.size);
        }
    }

    ctx.fillStyle = "#35f";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.s * 0.25, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#2ea";
    player.rays.forEach(ray => {
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x + Math.cos(ray.relAngle) * ray.hyp, player.y + Math.sin(ray.relAngle) * ray.hyp);
        ctx.closePath();
        ctx.stroke();
    });

}


addEventListener("keydown", e => {
    const s = 1;
    switch (e.key.toLowerCase()) {
        case "arrowleft":
            player.a -= s;
            //console.log(player.a);
            break;
        case "arrowright":
            player.a += s;
            break;
        case "arrowup":
            player.vx = Math.cos(degToRad(player.a));
            player.vy = Math.sin(degToRad(player.a));
            break;
        case "arrowdown":
            player.vx = -Math.cos(degToRad(player.a));
            player.vy = -Math.sin(degToRad(player.a));
    }
})

addEventListener("keyup", e => {
    player.vx = 0;
    player.vy = 0;
})

const key = () => {
    // document.getElementById("fw-btn")
}

const degToRad = (n: number): number => n * Math.PI / 180;

class Texture {

    unit : number;
    texture: WebGLTexture;

    constructor(gl: WebGLRenderingContext, public image: any, c: boolean = false) {
        this.unit = Texture.unit;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if(c) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                image);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        Texture.unit++;
    }

    static unit = 0;

}

const loadAllImage = (gl: WebGLRenderingContext, ...data: string[]) => {

    let d: number[] = [];
    for(let i = 0; i < 64 * 64; i++) {
        d.push(1, 0, 0, 1);
    }
    textures.all["white"] = new Texture(gl, new Uint8Array(d), true);

    const promises = [];
    for(let d of data) {
        const img = new Image();
        img.src = "./assets/" + d + ".png";
        img.crossOrigin = 'anonymous';
        const promise = new Promise((resolve, reject) => {
            img.addEventListener("load", e => {
                textures.all[d] = new Texture(gl, img);
                resolve(e);
            });
            img.addEventListener("error", e => reject(e));
        });
        promises.push(promise);
    }
    return Promise.all(promises);
}