import {ObjParser} from "./objParser.js";
import {createVBO} from "./arrayBuffer.js";

export class Mesh {

    #data = [];
    #gl = null;
    vbo = null;
    constructor(gl, vertices = [], uvs = [], normals = []) {
        this.vertices = vertices;
        this.uvs = uvs;
        this.normals = normals;
        this.#gl = gl;

        this.#data = [...this.vertices, ...this.uvs, ...this.normals];
        this.vbo = createVBO(gl, this.#data);
    }

    // length() { return this.#data.length; }

}

// import glMatrix from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'