class Vec2 {

    constructor(public x = 0, public y = 0) {}

    public add(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    public addScaled(v: Vec2, s: number): Vec2 {
        return new Vec2(this.x + v.x * s, this.y + v.y * s);
    }

    public sub(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    public subScaled(v: Vec2, s: number): Vec2 {
        return new Vec2(this.x - v.x * s, this.y - v.y * s);
    }

    public scale(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }

    public copy() {
        return new Vec2(this.x, this.y);
    }

    public projection(v: Vec2): number {
        const l = v.length();
        if(this.length() === 0 || l === 0)
            return 0;
        return (this.dotProduct(v) / l);
    }

    public dotProduct(v: Vec2): number {
        return this.x * v.x + this.y * v.y;
    }
 
    public length(): number {
        return Math.hypot(this.x, this.y);
    }

    public normalize(): void {
        const l = this.length();
        if(l === 0) {
            this.x = 0;
            this.y = 0;
        }
        this.x /= l;
        this.y /= l;
    }

}

export default Vec2;