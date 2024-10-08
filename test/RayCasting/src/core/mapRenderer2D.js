import { Shader } from "./shader.js";
import { createEBO, createVBO } from "./arrayBuffer.js";
import { Mat4 } from "../math/mat4.js";
const vertexShaderSource = `
attribute vec3 position;
attribute vec4 color;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec4 v_color;
void main() {
    v_color = color;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1);
}`;
const fragmentShaderSource = `
precision mediump float;

varying vec4 v_color;
void main() {
    gl_FragColor = v_color;
}`;
class Vertex {
    position;
    color;
    texCoord = [0, 0];
    constructor(pos = [0, 0], col = [0, 0, 0, 1], tex = [0, 0]) {
        this.position = pos;
        this.color = col;
        this.texCoord = tex;
    }
    getData() {
        return [...this.position, ...this.color];
    }
    static Size() {
        return Float32Array.BYTES_PER_ELEMENT * 3 * 4 * 2;
    }
}
const createQuad = (x, y, c) => {
    let size = 1;
    return [
        ...new Vertex([x, y], c).getData(),
        ...new Vertex([x + size, y], c).getData(),
        ...new Vertex([x + size, y + size], c).getData(),
        ...new Vertex([x, y + size], c).getData(),
    ];
};
class MapRenderer2D {
    #canvas;
    #gl;
    #error = "";
    #scale = 1;
    #tilePosition;
    #indices;
    #vbo;
    #ibo;
    #shader;
    #row;
    #col;
    #fpsStart;
    #fps = 0;
    constructor() {
        this.#canvas = document.createElement("canvas");
    }
    get domElement() { return this.#canvas; }
    init() {
        // does the browser supports canvas
        if (!this.domElement) {
            this.#error = "Your browser seems not to support the html5 canvas";
            return false;
        }
        this.#gl = this.domElement.getContext("webgl");
        // is there a webgl support
        if (!this.#gl) {
            this.#error = "Failed to initialise webgl1.0 rendering context";
            return false;
        }
        this.#shader = new Shader(this.#gl, vertexShaderSource, fragmentShaderSource);
        this.setClearColor(0, 0, 0, 0);
        this.#vbo = createVBO(this.#gl, null, 1000 * Vertex.Size(), this.#gl.DYNAMIC_DRAW);
        this.#ibo = createEBO(this.#gl, null, 1000 * Vertex.Size(), this.#gl.DYNAMIC_DRAW);
        return true;
    }
    getWidth() {
        return parseFloat(getComputedStyle(this.domElement).getPropertyValue("width"));
    }
    getHeight() {
        return parseFloat(getComputedStyle(this.domElement).getPropertyValue("height"));
    }
    setClearColor(r, g, b, a = 1) {
        this.#gl.clearColor(r, g, b, a);
    }
    setError(msg) { this.#error = msg; }
    getError() { return this.#error; }
    setScale(s) {
        this.#scale = s;
    }
    setMinimap(t, color = {}) {
        this.#tilePosition = [];
        this.#indices = [];
        this.#row = t.row;
        this.#col = t.col;
        let k = 0;
        for (let i = 0; i < t.row; i++) {
            for (let j = 0; j < t.col; j++) {
                const id = t.map[i * t.col + j];
                let c = color[String(id)];
                if (c) {
                    let data = [
                        j, i, ...c,
                        j + 1, i, ...c,
                        j + 1, i + 1, ...c,
                        j, i + 1, ...c
                    ];
                    this.#tilePosition.push(...data);
                    let d = [k, k + 1, k + 2, k, k + 2, k + 3];
                    this.#indices.push(...d);
                    k += 4;
                }
            }
        } // for i ends
        const gl = this.#gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.#vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.#tilePosition));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(this.#indices));
    }
    draw() {
        const gl = this.#gl;
        const W = this.getWidth();
        const H = this.getHeight();
        this.#canvas.width = W;
        this.#canvas.height = H;
        gl.viewport(0, 0, W, H);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // let q = [
        //     0, 0, 0, 0, 1, 1,
        //     1, 0, 0, 0, 1, 1,
        //     1, 1, 0, 0, 1, 1,
        //     0, 1, 0, 0, 1, 1,
        // ]
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.#vbo);
        // gl.bufferSubData(gl.ARRAY_BUFFER, 2 * Float32Array.BYTES_PER_ELEMENT, new Float32Array(q));
        const projectionMatrix = Mat4.ortho(0, this.#canvas.width, this.#canvas.height, 0, 1, -1);
        let viewMatrix = Mat4.identity();
        // viewMatrix = Mat4.scale(viewMatrix, 0.2, 0.2, 0);
        let modelMatrix = Mat4.identity();
        modelMatrix = Mat4.scale(modelMatrix, this.#scale, this.#scale, 0);
        this.#shader.use();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        this.#shader.enableAttributes({
            position: { buffer: this.#vbo, size: 2, type: gl.FLOAT, offset: 0, stride: 6 * Float32Array.BYTES_PER_ELEMENT },
            color: { buffer: this.#vbo, size: 4, type: gl.FLOAT, offset: 2 * Float32Array.BYTES_PER_ELEMENT,
                stride: 6 * Float32Array.BYTES_PER_ELEMENT }
        });
        this.#shader.uniformSetters({
            projectionMatrix, viewMatrix, modelMatrix
        });
        gl.drawElements(gl.TRIANGLES, this.#indices.length, gl.UNSIGNED_SHORT, 0);
        gl.drawElements(gl.LINE_LOOP, this.#indices.length, gl.UNSIGNED_SHORT, 0);
    }
    getFps() { return this.#fps; }
    start() {
        const loop = () => {
            const fpsNow = performance.now();
            this.#fps = (fpsNow - this.#fpsStart) * 0.001;
            this.#fpsStart = fpsNow;
            this.draw();
            requestAnimationFrame(loop);
        };
        this.#fpsStart = performance.now();
        requestAnimationFrame(loop);
    }
}
export { MapRenderer2D };
//# sourceMappingURL=mapRenderer2D.js.map