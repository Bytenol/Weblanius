import { randRange } from "../lib/mathUtil.js";
import Vec2 from "../lib/Vector.js";

const birthDayStoreName = "bytenolBirthdayAnimated"; 


const toggleScene = (sceneId: string) => {
    const scenes = document.querySelectorAll(".Scene");
    [...scenes].forEach((scene: any) => {
        scene.style.display = "none";
    });

    (document.getElementById(sceneId) as any).style.display = "block";
}


const initSceneAnchor = () => {
    const anchors = document.querySelectorAll(".SceneAnchor");
    [...anchors].forEach((anchor: any) => {
        anchor.addEventListener("click", (e: any) => {
            e.preventDefault();
            const name = (anchor.children[1].textContent as string).toLocaleLowerCase();
            toggleScene(name + "Scene");
        })
    })
}


const setAge = () => {
    const spanEl = document.getElementById("myAge") as HTMLSpanElement;
    spanEl.innerText = ((new Date()).getUTCFullYear() - (new Date("2001/02/05")).getUTCFullYear()).toString();
}


/**
 * Play animation once every 2nd February of the year to celebrate my birthday
 * @param ctx CanvasRenderingContext2D used for drawing 2d shapes
 * @returns void
 */
const animateBirthday = (ctx: CanvasRenderingContext2D) => {
    const today = new Date();
    const month = (today.getUTCMonth() + 1) == 2;   //2
    const day = today.getUTCDate() == 5;    //5

    // today is not my birthday
    if(!(month && day)) {
        localStorage.removeItem(birthDayStoreName);
        return;
    }

    // play animation only on the first visit
    if(!(localStorage.getItem(birthDayStoreName) == null))
        return;

    ctx.canvas.style.display = "block";
    localStorage.setItem(birthDayStoreName, "1");

    class Particle
    {
        public pos = new Vec2(ctx.canvas.width/2, ctx.canvas.height/2);
        public posZ = 50.0;
        public color = `rgb(${randRange(0, 255)}, ${randRange(0, 255)}, ${randRange(0, 255)})`;
        public vel = new Vec2(randRange(-100, 100), randRange(-100, 100));

        constructor(){}

        get size() {
            return Math.abs(ctx.canvas.width * 0.5 - this.pos.x) / (ctx.canvas.width * 0.05);
        }
    }

    const particles: Particle[] = [];

    for(let i = 0; i < 300; i++)
        particles.push(new Particle());

    const render = () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        particles.forEach((particle) => {
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.pos.x, particle.pos.y, particle.size, particle.size);
        });
    }

    const update = (dt: number) => {
        particles.forEach((particle, i) => {
            particle.pos = particle.pos.addScaled(particle.vel, dt);
            if(particle.pos.x < 0 || particle.pos.x + particle.size > ctx.canvas.width)
                particles.splice(i, 1);
        });
    }

    const loop = () => {
        if(!particles.length) return;
        requestAnimationFrame(loop);
        render();
        update(1/60);
    }

    loop();

    // hide the canvas so mouse click and others can work
    setTimeout(() => { ctx.canvas.style.display = "none";}, 8000);
}


(() => {

    const main = () => {
        const canvas = document.getElementById("cvs") as HTMLCanvasElement;
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        toggleScene("aboutScene");
        setAge();
        animateBirthday(ctx);
        initSceneAnchor();
    }

    addEventListener("load", main);

})();