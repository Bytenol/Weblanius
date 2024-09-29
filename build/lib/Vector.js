class Vec2 {
    x;
    y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    addScaled(v, s) {
        return new Vec2(this.x + v.x * s, this.y + v.y * s);
    }
    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    subScaled(v, s) {
        return new Vec2(this.x - v.x * s, this.y - v.y * s);
    }
    scale(s) {
        return new Vec2(this.x * s, this.y * s);
    }
    copy() {
        return new Vec2(this.x, this.y);
    }
    projection(v) {
        const l = v.length();
        if (this.length() === 0 || l === 0)
            return 0;
        return (this.dotProduct(v) / l);
    }
    dotProduct(v) {
        return this.x * v.x + this.y * v.y;
    }
    length() {
        return Math.hypot(this.x, this.y);
    }
    normalize() {
        const l = this.length();
        if (l === 0) {
            this.x = 0;
            this.y = 0;
        }
        this.x /= l;
        this.y /= l;
    }
}
export default Vec2;
