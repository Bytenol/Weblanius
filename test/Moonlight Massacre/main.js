import * as glm from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'
import {Shader} from "./src/shader.js";
import {createEBO, createVBO} from "./src/arrayBuffer.js";
import {Mesh} from "./src/mesh.js";
import {Texture} from "./src/texture.js";
import {GUI} from "./src/dat.gui.module.js";

let gl, ctx, ibo;
// let player;
let gameWorldMesh, dynamicEntityMesh;

const tileSize = 1;
const images = { };
const textures = { };

const player = {
    pos: glm.vec3.fromValues(tileSize * 1.5, tileSize * 0.25, -tileSize * 1.5),
    vel: glm.vec3.create(),
    speed: 40,
    target: glm.vec3.create(),
    angle: 0,
}

let rotation = 0;

const gui = new GUI();
const y = gui.addFolder("playerPos");
// y.add(player.pos[0],  null,0, 30);

const onUpdate = dt => {
    const playerRa = glm.glMatrix.toRadian(player.angle);
    let px = Math.sin(playerRa) * 10;
    let pz = Math.cos(playerRa) * -10;
    player.target[0] = player.pos[0] + px;
    player.target[1] = player.pos[1];
    player.target[2] = player.pos[2] + pz;
    rotation += 50 * dt;
    player.pos = glm.vec3.scaleAndAdd(glm.vec3.create(), player.pos, player.vel, dt);


    // console.log(px, pz);
    // throw "";
    // dts.push(dt);
    // let d = dts.reduce((a, b) => a + b) / dts.length;
    // console.log(d);
    // console.log(dt);
    // $("#debugInfo").innerHTML = `
    // <b>dt:</b> ${dt} <br>
    // `;
}


const draw3D = () => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    player.pos[1] = tileSize * 0.5;
    let dp = player.pos; //glm.vec3.fromValues(-player.pos[2], player.pos[1], -player.pos[0]);
    let t = glm.vec3.create();
    t[0] = dp[0];
    t[1] = dp[1];
    t[2] = -15;

    ShaderManager.use("basic");
    let projectionMatrix = glm.mat4.perspective(glm.mat4.create(), glm.glMatrix.toRadian(45), gl.canvas.width/gl.canvas.height, 0.1, 300);
    let viewMatrix = glm.mat4.lookAt(glm.mat4.create(), dp, t, glm.vec3.fromValues(0, 1, 0));
    // let viewMatrix = glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(2, 0.5, -7), glm.vec3.fromValues(2, 0.5, -8), glm.vec3.fromValues(0, 1, 0));
    // let viewMatrix = glm.mat4.create();
    // viewMatrix = glm.mat4.translate(glm.mat4.create(), viewMatrix, glm.vec3.fromValues(player.pos[2], -tileSize, player.pos[0]));
    const lightColor = glm.vec3.fromValues(1, 1, 1);
    const lightPos = glm.vec3.fromValues(player.pos[0], tileSize + 10, player.pos[2]);
    ShaderManager.setUniform({ projectionMatrix, viewMatrix, lightColor, lightPos });

    // drawing the game world
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    textures.walls.bind();

    ShaderManager.enableAttributes({
        position: { buffer: gameWorldMesh.vbo, size: 3 },
        texCoord: { buffer: gameWorldMesh.vbo, size: 2, offset: gameWorldMesh.vertices.length * Float32Array.BYTES_PER_ELEMENT },
        normal: { buffer: gameWorldMesh.vbo, size: 3, offset: (gameWorldMesh.vertices.length + gameWorldMesh.uvs.length) * Float32Array.BYTES_PER_ELEMENT }
    });

    let modelMatrix = glm.mat4.scale(glm.mat4.create(), glm.mat4.create(), glm.vec3.fromValues(tileSize, tileSize , tileSize));
    let normalMatrix = glm.mat4.invert(glm.mat4.create(), modelMatrix);
    normalMatrix = glm.mat4.transpose(glm.mat4.create(), normalMatrix);
    ShaderManager.setUniform({ modelMatrix, normalMatrix });
    gl.enable(gl.CULL_FACE);
    gl.drawElements(gl.TRIANGLES, gameWorldMesh.vertices.length / 2, gl.UNSIGNED_SHORT, 0);

    // drawing dynamic entities
    ShaderManager.enableAttributes({
        position: { buffer: dynamicEntityMesh.vbo, size: 3 },
        texCoord: { buffer: dynamicEntityMesh.vbo, size: 2, offset: dynamicEntityMesh.vertices.length * Float32Array.BYTES_PER_ELEMENT },
        normal: { buffer: dynamicEntityMesh.vbo, size: 3, offset: (dynamicEntityMesh.vertices.length + dynamicEntityMesh.uvs.length) * Float32Array.BYTES_PER_ELEMENT }
    });
    modelMatrix = glm.mat4.create();
    modelMatrix = glm.mat4.scale(glm.mat4.create(), modelMatrix, glm.vec3.fromValues(tileSize * 0.5, tileSize * 0.5 , tileSize * 0.5));
    normalMatrix = glm.mat4.invert(glm.mat4.create(), modelMatrix);
    normalMatrix = glm.mat4.transpose(glm.mat4.create(), normalMatrix);
    ShaderManager.setUniform({ modelMatrix, normalMatrix });
    gl.disable(gl.CULL_FACE);
    gl.drawElements(gl.TRIANGLES, dynamicEntityMesh.vertices.length / 2, gl.UNSIGNED_SHORT, 0);

}

const draw2D = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // ctx.save();
    // ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
    // ctx.rotate(-90 * Math.PI/180);
    let sc = 1 * 32;
    // draw map wall

    const map = LevelManager.getWallLayer().data;
    for(let i = 0; i < 10; i++) {
        for(let j = 0; j < 7; j++) {
            let id = map[i * LevelManager.getWidth() + j];
            const px = j * tileSize * sc //- ctx.canvas.width/2;
            const py = i * tileSize * sc //- ctx.canvas.height/2;
            if(id > 0) {
                ctx.fillStyle = "red";
                ctx.strokeStyle = "#222";
                ctx.fillRect(px, py, tileSize * sc, tileSize  * sc);
                ctx.strokeRect(px, py, tileSize  * sc, tileSize  * sc);
            } else {
                ctx.strokeStyle = "#222";
                ctx.strokeRect(px, py, tileSize  * sc, tileSize  * sc);
            }
        }
    }

    //sc = ;

    // draw player
    {
        let px = player.pos[0] * sc //- ctx.canvas.width/2;
        let pz = Math.abs(player.pos[2]) * sc //- ctx.canvas.height/2;
        let sz = 8;
        let mag = 10;
        ctx.fillStyle = "#00f";
        ctx.beginPath();
        ctx.arc(px, pz, sz, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        let rA = glm.glMatrix.toRadian(player.angle);
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(px, pz);
        ctx.lineTo(px + Math.cos(rA) * mag, pz - Math.sin(rA) * mag);
        ctx.stroke();
    }

    ctx.restore();

}

const onDraw = () => {
    draw3D();
    draw2D();
}


const animate = () => {
    onUpdate(1/60);
    onDraw();
    requestAnimationFrame(animate);
}


const eventHandler = () => {
    window.addEventListener("keydown", e => {
        const rA = glm.glMatrix.toRadian(player.angle);
        switch (e.key.toLowerCase()) {
            case "arrowleft":
                // player.angle--;
                player.pos[2]++;
                break;
            case "arrowright":
                // player.angle++;
                player.pos[2]--;
                break;
            case "arrowup":
                // player.vel[0] = Math.cos(rA) * player.speed;
                // player.vel[2] = Math.sin(rA) * player.speed;
                player.pos[0]++;
                break;
            case "arrowdown":
                // player.vel[0] = Math.cos(rA) * -player.speed;
                // player.vel[2] = Math.sin(rA) * -player.speed;
                player.pos[0]--;
                break;
            case "a":
                player.angle--;
                break;
            case "d":
                player.angle++;
                break;
        }
    });

    window.addEventListener("keyup", e => {
        player.vel[0] = 0;
        player.vel[2] = 0;
    });
}

// onlyFace = ["front", "back"]
const generateCubeVertexData = (u = [], onlyFace = []) => {
    const data = {
        front: [
            [-1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,],  // position
            [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,],  // normal
            [...u]
        ],
        back: [
            [-1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,],
            [0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,],
            [...u]
        ],
        top: [
            [-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,],
            [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,],
            [...u]
        ],
        bottom: [
            [-1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,],
            [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,],
            [...u]
        ],
        right: [
            [1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,],
            [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,],
            [...u]
        ],
        left: [
            [-1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,],
            [-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,],
            [...u]
        ]
    };

    // ["front", "back", "top", "bottom", "right", "left"]

    let vertices = [];
    let normals = [];
    let _uvs = [];

    if(onlyFace.length > 0) {
        onlyFace.forEach(face => {
            vertices.push(...data[face][0]);
            normals.push(...data[face][1]);
            _uvs.push(...data[face][2]);
        });
    } else {
        for(const face in data) {
            vertices.push(...data[face][0]);
            normals.push(...data[face][1]);
            _uvs.push(...data[face][2]);
        }
    }
    const c_vert = [...vertices];
    vertices = Array.from({length: c_vert.length}, (i, j) => {
        if(c_vert[j] < 0) return 0;
        return c_vert[j];
    });

    return { vertices, normals, uvs: _uvs };

}

const loadImage = (id, path) => {
    const img = new Image();
    img.src = path;
    return new Promise((resolve, reject) => {
        img.addEventListener("load", () => resolve({id, img}));
        img.addEventListener("error", e => reject(e));
    });
}

// data = [...[id, path]]
const loadAllImages = (data) => {
    let promises = [];
    data.forEach(d => {
        let promise = loadImage(d[0], d[1]);
        promises.push(promise);
    });
    return Promise.all(promises).then(e => {
        e.forEach(d => images[d.id] = d.img);
    });
}


const ShaderManager = (() => {

    let currentShader = null;
    const shaders = { };

    const add = (name, value) => {
        if(!(value instanceof Shader)) throw new Error("SHADER_MANAGER_ERROR: Can only add an instance of shader");
        shaders[name] = value;
    }

    const use = name => {
        if(!shaders.hasOwnProperty(name)) throw new Error("SHADER_MANAGER_USE_ERROR: this shader does not exist");
        const shader = shaders[name];
        if(currentShader !== shader) {
            currentShader = shader;
            currentShader.use();
        }
    }

    const setUniform = params => {
        if(!(currentShader instanceof Shader)) return;
        currentShader.setUniform(params);
    }

    const enableAttributes = params => {
        if(!(currentShader instanceof Shader)) return;
        currentShader.enableAttributes(params);
    }

    return { add, use, setUniform, enableAttributes };
})();


const LevelManager = (() => {

    const worldEntity = { vertices: [], uvs: [], normals: [] };
    const dynamicEntity = { vertices: [], uvs: [], normals: [] };

    let dataJson;
    let width, height, wallLayer;
    let floorLayer;

    const loadGameWorld = async(path) => {
        await fetchTextFile(path).then(e => {
            let res = JSON.parse(e);
            width = res.width;
            height = res.height;
            const tileLayer = res.layers.filter(i => i.type === "tilelayer");
            const objectLayer = res.layers.filter(i => i.type === "objectgroup");
            initEnvironment(tileLayer, width, height);
            initDynamicObject(objectLayer, width, height);
            initIndexBuffer(10000);
            wallLayer = res.layers.filter(i => i.name === "wall")[0];
            floorLayer = res.layers.filter(i => i.name === "floor")[0];
            return true;
        });
    }



    /**
     * This function update the vertex datas [vertices, uvs, normals] by appending the data to the main array [vertices, normals, uvs]
     * @param _vertices {Array} The vertices data to be added
     * @param _uvs {Array} The uv data to be added
     * @param _normals {Array} The normal data to be added
     * @param tx {Number} The x translation value
     * @param ty {Number} The y translation value
     * @param tz {Number} The z translation value
     */
    const putWorldData = (obj, _vertices, _uvs, _normals, tx, ty, tz) => {
        for(let k = 0; k < _vertices.length; k += 3) {
            obj.vertices.push(_vertices[k] + tx);
            obj.vertices.push(_vertices[k + 1] + ty);
            obj.vertices.push(_vertices[k + 2] - tz);
        }
        obj.uvs.push(..._uvs);
        obj.normals.push(..._normals);
    }


    const initIndexBuffer = length => {
        let indices = [];
        for(let i = 0; i < length; i++) {
            let s = i * 4;
            indices.push(s, s + 1, s + 2, s, s + 2, s + 3);
        }
        ibo = createEBO(gl, indices);
    }


    /***
     * This function initialises the vertex data for the environment for all static world data
     * @param layers {Object} The tilelayer object
     * @param width {Number} is the width of the map
     * @param height {Number} is the height of the map
     */
    const initEnvironment = (layers, width, height) => {
        let uvSrcx, uvSrcY, cubeVerticesData, uvData;
        const uvStride = 12.5 / 100;  // 64px as 12% of 512px then to unit value

        // loop through all layers
        for(let z = 0; z < height; z++) {
            for(let x = 0; x < width; x++) {
                 layers.forEach((layer, i) => {
                     const id = layer.data[z * width + x];
                     if(id > 0) {
                         uvSrcx = ((id - 1) % 8) * 64 / 512;
                         uvSrcY = (~~((id - 1) / 8)) * 64 / 512;
                         uvData = [uvSrcx, uvSrcY, uvSrcx + uvStride, uvSrcY, uvSrcx + uvStride, uvSrcY + uvStride, uvSrcx, uvSrcY + uvStride];
                         switch(layer.name) {
                             case "wall":
                                 cubeVerticesData = generateCubeVertexData(uvData, ["front", "back", "right", "left"]);
                                 putWorldData(worldEntity, cubeVerticesData.vertices, cubeVerticesData.uvs, cubeVerticesData.normals, x, 0, z);
                                 break;
                             case "floor":
                                 putWorldData(worldEntity, [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0], uvData, [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,], x, 0, z);
                                 break
                             case "ceiling":
                                 putWorldData(worldEntity, [0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,], uvData, [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,], x, 0, z);
                                 break;
                         }    // switch layer.name ends

                     }  // if id > 0 ends

                 });    // layers.forEach() ends
            }   // for
        }   // for let z ends

        gameWorldMesh = new Mesh(gl, worldEntity.vertices, worldEntity.uvs, worldEntity.normals);
    }


    const initDynamicObject = (layers, width, height) => {
        let uvSrcx, uvSrcY, cubeVerticesData, uvData;
        const uvStride = 12.5 / 100;  // 64px as 12% of 512px then to unit value
        let id;
        console.log(layers);
        layers.forEach((layer, i) => {
            layer.objects.forEach((obj, j) => {
                switch(layer.name) {
                    case "dynamic_entity":
                        id = 26;
                        uvSrcx = ((id - 1) % 8) * 64 / 512;
                        uvSrcY = (~~((id - 1) / 8)) * 64 / 512;
                        uvData = [uvSrcx, uvSrcY, uvSrcx + uvStride, uvSrcY, uvSrcx + uvStride, uvSrcY + uvStride, uvSrcx, uvSrcY + uvStride];
                        cubeVerticesData = generateCubeVertexData(uvData, ["front"]);
                        let px = obj.x / 64;
                        let py = obj.y / 64;
                        putWorldData(dynamicEntity, cubeVerticesData.vertices, cubeVerticesData.uvs, cubeVerticesData.normals, px, 0, py);
                        break;
                }
            })
        });
        dynamicEntityMesh = new Mesh(gl, dynamicEntity.vertices, dynamicEntity.uvs, dynamicEntity.normals);
        // console.log()
        // case "static_entity":
        //     cubeVerticesData = generateCubeVertexData(uvData, ["front"]);
        //     putWorldData(dynamicEntity, cubeVerticesData.vertices, cubeVerticesData.uvs, cubeVerticesData.normals, x, 0, z);
        //     break;
        // dynamicEntityMesh = new Mesh(gl, dynamicEntity.vertices, dynamicEntity.uvs, dynamicEntity.normals);
    }

    const getWidth = () => width;

    const getHeight = () => height;

    const getWallLayer = () => wallLayer;
    const getFloorLayer = () => floorLayer;

    return { loadGameWorld, getWidth, getHeight, getWallLayer, getFloorLayer };
})();


const $ = selector => document.querySelector(selector);

const getCSS = (el, prop) => getComputedStyle(el).getPropertyValue(prop);

/**
 * Retrive a content from a path as a text
 * @param path the path to get the content from
 * @returns {Promise<unknown>}
 */
const fetchTextFile = path => new Promise((resolve, reject) => {
    fetch(path).then(e => resolve(e.text())).catch(e => reject(e))
});


const setupDOM = () => {
    const gameArea = $("#gameScene");
    const w = parseFloat(getCSS(gameArea, "width"));
    const h = parseFloat(getCSS(gameArea, "height"));
    gl.canvas.width = w;
    gl.canvas.height = h;
    ctx.canvas.width = 400;
    ctx.canvas.height = 400;
}


/**
 * This function is called whenever the window size changes
 */
const onResize = () => { setupDOM() }


/**
 * This is the entry point for the game
 */
const main = async () => {
    gl = $("#cvs").getContext("webgl");
    ctx = $("#cvs2").getContext("2d");
    setupDOM();

    await loadAllImages([["walls", "./assets/wall.png"]]);
    textures["walls"] = new Texture(gl, images.walls, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, true);

    await LevelManager.loadGameWorld("./assets/gameWorld.tmj");
    ShaderManager.add("basic", new Shader(gl, $("#vertexShader1").textContent, $("#fragmentShader1").textContent));

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    requestAnimationFrame(animate);
    addEventListener("resize", onResize);
    eventHandler();
}
addEventListener("load", main);