export const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success)
        return shader;
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
};
export const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success)
        return program;
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
};
/**
 * This function is used to generate texture coordinates
 * based on the texture relative size..
 *
 * the last parameter h is optional and when optional, it
 * uses the aspect ratio from sx/sy to deduce the destination height
 *
 * this procedure is good when images are to be generated based on some aspect ratio
 *
 * @param {Image} sprite image to be drawn
 * @param {number} sx source on the x-axis
 * @param {number} sy source on the y-axis
 * @param {number} sw source width
 * @param {number} sh source height
 * @param {number} w destination width
 * @param {number} h destination height
 * @returns {object} the data, width, height as members
 */
export const setImageData = (sprite, sx, sy, sw, sh, w, h) => {
    let _sx = sx;
    let _sy = sy;
    let _sw = sx + sw;
    let _sh = sy + sh;
    let aspectRatio = sw / sh;
    let _h = w / aspectRatio;
    // if h is not undefined, use the original w and h for
    // width and height of the image
    if (typeof h == "number") {
        w = w;
        _h = h;
    }
    return {
        data: [
            // square coordinate
            0, 0,
            w, 0,
            w, _h,
            0, 0,
            w, _h,
            0, _h,
            // texture coordinate
            _sx / sprite.width, _sy / sprite.height,
            _sw / sprite.width, _sy / sprite.height,
            _sw / sprite.width, _sh / sprite.height,
            _sx / sprite.width, _sy / sprite.height,
            _sw / sprite.width, _sh / sprite.height,
            _sx / sprite.width, _sh / sprite.height
        ],
        width: w,
        height: _h
    };
};
/**
 *
 * This function binda to a buffer, and using the current program
 * get attributes for position and texture, bind to a single buffer
 * having 6 (2 * 2) vertices info and the rest 4 (2*2) for texture
 *
 * @param  {WebGL2RenderingContext} gl webgl1.0 rendering context
 * @param {WebGLBuffer} buffer buffer
 * @param {number} posLoc The location of the positon attributes in glsl
 * @param {number} texLoc The location of the texture attribures in glsl
 */
export const drawImage = (gl, buffer, posLoc, texLoc) => {
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, Float32Array.BYTES_PER_ELEMENT * 6 * 2);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};
