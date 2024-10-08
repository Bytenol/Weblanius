import Vec2 from "../lib/Vector.js";


const globals = {
    isWireFrame: true,
    accelerationG: 20,
}


class Ball {

    public mass = Math.random() * 8 | 0x0;
    public radius = 20; //(Math.random() * 4 + 10) | 0;

    public pos = new Vec2(0, 0);
    public vel = new Vec2(0, 0);

    public color = (Math.random() * 40234 + 10543) | 0;

    public isMovable = true;
    public id = "xxx";

    constructor() {
        // Ball.all.push(this);
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle = hexToRgb(this.color);
        globals.isWireFrame && ctx.fill() || ctx.stroke();
    }

    static all: Ball[] = [];
}


class Wall {

    public start = new Vec2(0, 0);
    public end = new Vec2(0, 0);
    public radius = Math.random() * 5 + 3;

    public dir = new Vec2(0, 0);
    public normal = new Vec2(0, 0);

    private b1 = new Ball();
    private b2 = new Ball();

    constructor(){
        this.b1.radius = this.radius;
        this.b2.radius = this.radius;
        this.b1.isMovable = false;
        this.b2.isMovable = false;
        this.b1.color = this.b2.color = 0xff0000;
        Ball.all.push(this.b1);
        Ball.all.push(this.b2);
        Wall.all.push(this);
    }

    update(dt: number) {
        this.dir.x = this.end.x - this.start.x;
        this.dir.y = this.end.y - this.start.y;

        this.normal.x = this.dir.y;
        this.normal.y = -this.dir.x;
        this.normal.normalize();

        this.b1.pos = this.start.addScaled(this.normal, -this.radius);
        this.b2.pos = this.end.addScaled(this.normal, -this.radius);
    }

    render(ctx: CanvasRenderingContext2D) {
        drawLine(ctx, this.start, this.end, "#000");
        drawLine(ctx, this.start.addScaled(this.normal, -this.radius*2), 
            this.end.addScaled(this.normal, -this.radius * 2), "#000");
        ctx.closePath();
        this.b1.render(ctx);
        this.b2.render(ctx);
    }

    static all: Wall[] = []
}


const hexToRgb = (color: number) => {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
}


const findResultantForce = (forces: Vec2[]) => {
    const res = new Vec2(0, 0);
    forces.forEach(f => {
        res.x += f.x;
        res.y += f.y;
    });
    return res;
}

const init = (ctx: CanvasRenderingContext2D) => {
    let b = new Ball();
    b.pos.x = 200;
    b.pos.y = 100;
    b.vel.x = 40;
    Ball.all.push(b);
    // b.vel.y = 50;

    b = new Ball();
    b.pos.x = 450;
    b.pos.y = 100;
    b.vel.x = 60;

    for(let i = 0; i < 20; i++) {
        b = new Ball();
        b.radius = Math.random() * 20 + 20;
        b.pos.x = b.radius + Math.random() * ctx.canvas.width - b.radius;
        b.pos.y = b.radius + Math.random() * ctx.canvas.width - b.radius;
        Ball.all.push(b);
    }

    let wall = new Wall();
    wall.start = new Vec2(50, 300);
    wall.end = new Vec2(300, 350);
}


const resolveCollision = (b1: Ball, b2: Ball) => {
    const radMax = b1.radius + b2.radius;
    const collisionLine = b2.pos.sub(b1.pos);
    const collisionLength = collisionLine.length();

    if(collisionLength < radMax) {
        const overlap = (collisionLength - radMax) * 0.5;
        let normal = new Vec2(collisionLine.x, collisionLine.y);
        normal.normalize();

        const u1 = b1.vel.projection(normal);
        const u2 = b2.vel.projection(normal);

        const tangetVel1 = b1.vel.sub(normal.scale(u1));
        const tangentVel2 = b2.vel.sub(normal.scale(u2));
        
        b1.pos = b1.pos.addScaled(normal, overlap);
        b2.pos = b2.pos.subScaled(normal, overlap);

        const v1 = ((b1.mass - b2.mass) * u1 + 2 * (b2.mass * u2)) / (b1.mass + b2.mass);
        const v2 = ((b2.mass - b1.mass) * u2 + 2 * (b1.mass * u1)) / (b1.mass + b2.mass);
        const normalVel1 = normal.scale(v1);
        const normalVel2 = normal.scale(v2);

        b1.vel = tangetVel1.add(normalVel1);
        b2.vel = tangentVel2.add(normalVel2);
    }
}


const drawLine = (ctx: CanvasRenderingContext2D, start: Vec2, end: Vec2, color: string) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();
}

const update = (dt: number, ctx: CanvasRenderingContext2D) => {

    for(let i = 0; i < Ball.all.length; i++) 
    {
        const b1 = Ball.all[i];

        if(b1.isMovable) b1.pos = b1.pos.addScaled(b1.vel, dt);

        // clamp position
        if(b1.pos.y - b1.radius > ctx.canvas.height) {
            b1.pos.y = -b1.radius;
        } 
        // else if(b1.pos.y - b1.radius < 0) {
        //     b1.pos.y = ctx.canvas.height + b1.radius;
        // }

        if(b1.pos.x - b1.radius < 0) {
            b1.pos.x = b1.radius;
            b1.vel.x *= -0.9;
        } else if(b1.pos.x + b1.radius > ctx.canvas.width) {
            b1.pos.x = ctx.canvas.width - b1.radius;
            b1.vel.x *= -0.9;
        }

        // circle to circle collision
        for(let j = i + 1; j < Ball.all.length; j++)
        {
            const b2 = Ball.all[j];
            resolveCollision(b1, b2);
        }

        // circle to wall collision
        for(let i = 0; i < Wall.all.length; i++)
        {
            const wall = Wall.all[i];
            wall.update(dt);
            const ballToWallStart = wall.start.sub(b1.pos);
            const ballToWallEnd = wall.end.sub(b1.pos);

            const proj1 = ballToWallStart.projection(wall.dir);
            const proj2 = ballToWallEnd.projection(wall.dir);
            let distAdj = wall.dir.copy();
            distAdj.normalize();
            distAdj = distAdj.scale(proj1);

            const dist = ballToWallStart.sub(distAdj);

            const wallLength = wall.dir.length();
            const test = (Math.abs(proj1) < wallLength) && (Math.abs(proj2) < wallLength);
            if(test) {
                let p1 = b1.pos.add(dist).addScaled(wall.normal, -wall.radius);
                let b = new Ball();
                b.mass = 3;
                b.pos = p1;
                b.radius = wall.radius;
                // b.color = 0xff0000;
                // b.render(ctx);
                resolveCollision(b1, b);
            }

        }   

        // calculate resultant force
        const weight = new Vec2(0, b1.mass * globals.accelerationG);
        const forces = findResultantForce([weight]);

        // apply acceleration
        const acc = forces.scale(1 / b1.mass);
        b1.vel = b1.vel.addScaled(acc, dt);

    }

}

const render = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    Ball.all.forEach(ball => ball.render(ctx));
    Wall.all.forEach(wall => wall.render(ctx));
}

const mainLoop = (ctx: CanvasRenderingContext2D) => {
    const loop = () => {
        requestAnimationFrame(loop);
        render(ctx);
        const t1 = new Date().getTime();
        let dt = (t1 - t0) * 0.001;
        t0 = t1;
        if(dt > 0.2) dt = 0;
        update(dt, ctx);
    }

    let t0 = new Date().getTime();
    requestAnimationFrame(loop);
}

const main = (): void => {
    const canvas = <HTMLCanvasElement>document.getElementById("cvs");
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");

    init(ctx);
    mainLoop(ctx);
}

addEventListener("load", main);