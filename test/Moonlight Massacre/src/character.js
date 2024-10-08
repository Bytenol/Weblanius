export class Character {

    constructor(x, y, z) {
        this.pos = glm.vec3.fromValues(x, y, z);
        this.vel = glm.vec3.create();
        this.speed = 0;
    }

    update(dt) {
        this.pos = glm.vec3.scaleAndAdd(glm.vec3.create(), this.pos, this.vel, dt);
    }

}


export class Player extends Character {

    constructor(x, y, z) {
        super(x, y, z);
        this.target = glm.vec3.create(0, 0, 0);
    }

    update(dt) {
        super.update(dt);
    }

}