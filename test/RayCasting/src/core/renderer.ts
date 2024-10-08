abstract class Renderer {

    #error: string = "";
    parent: HTMLDivElement;
    #parentProp!: CSSStyleDeclaration;

    protected constructor(parentId: string) {
        this.parent = <HTMLDivElement>document.getElementById(parentId);
    }

    init(): boolean {
        if(!this.parent) {
            this.#error = "Parent Element does not exist";
            return false;
        }
        this.#parentProp = window.getComputedStyle(this.parent);

        return true;
    }

    setError(msg: string){ this.#error = msg; }

    getError(){ return this.#error; }

    getWidth(){
        return parseFloat(getComputedStyle(this.parent).getPropertyValue("width"));
    }

    getHeight() {
        return parseFloat(getComputedStyle(this.parent).getPropertyValue("height"));
    }

    start() {
        this.onStart();
        const loop = () => {
            if(typeof this.update === "function") this.update(1/60);
            if(typeof this.draw === "function") this.draw();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    abstract update(dt: number): void;

    abstract draw(): void;

    protected onStart(){ };

}


export { Renderer }