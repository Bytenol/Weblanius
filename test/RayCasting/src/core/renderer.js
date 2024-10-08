class Renderer {
    #error = "";
    parent;
    #parentProp;
    constructor(parentId) {
        this.parent = document.getElementById(parentId);
    }
    init() {
        if (!this.parent) {
            this.#error = "Parent Element does not exist";
            return false;
        }
        this.#parentProp = window.getComputedStyle(this.parent);
        return true;
    }
    setError(msg) { this.#error = msg; }
    getError() { return this.#error; }
    getWidth() {
        return parseFloat(getComputedStyle(this.parent).getPropertyValue("width"));
    }
    getHeight() {
        return parseFloat(getComputedStyle(this.parent).getPropertyValue("height"));
    }
    start() {
        this.onStart();
        const loop = () => {
            if (typeof this.update === "function")
                this.update(1 / 60);
            if (typeof this.draw === "function")
                this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    onStart() { }
    ;
}
export { Renderer };
//# sourceMappingURL=renderer.js.map