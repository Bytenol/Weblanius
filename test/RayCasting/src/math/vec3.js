const Vec3 = {
    add(v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
    },
    addScale(v1, v2, s) {
        v1[0] += v2[0] * s;
        v1[1] += v2[1] * s;
        v1[2] += v2[2] * s;
    },
    sub(v1, v2) {
        return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
    },
    subScale(v1, v2, s) {
        v1[0] -= v2[0] * s;
        v1[1] -= v2[1] * s;
        v1[2] -= v2[2] * s;
    },
    scale(v, s) {
        return [v[0] * s, v[1] * s, v[2] * s];
    },
    dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    },
    negate(v) {
        return [-v[0], -v[1], -v[2]];
    },
    getLength(v) {
        return Math.hypot(v[0], v[1], v[2]);
    },
    normalize(v) {
        const l = Vec3.getLength(v);
        if (l === 0)
            return [0, 0, 0];
        return [v[0] / l, v[1] / l, v[2] / l];
    },
    cross(v1, v2) {
        let res = [];
        res[0] = v1[1] * v2[2] - v1[2] * v2[1];
        res[1] = v1[2] * v2[0] - v1[0] * v2[2];
        res[2] = v1[0] * v2[1] - v1[1] * v2[0];
        return res;
    }
};
export { Vec3 };
//# sourceMappingURL=vec3.js.map