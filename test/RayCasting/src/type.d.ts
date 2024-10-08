type vec2 = [number, number];

type vec3 = [number, number, number];

type vec4 = [number, number, number, number];

type mat4 = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
];

interface tile {
    map: Array<any>,
    row: number,
    col: number,
    size: number
}