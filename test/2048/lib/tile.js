import { board } from "../main.js";
import { ThemeManager } from "./theme.js";
import { Uri } from "./uri.js";

class Tile {

    #ctx;
    #text;
    #isDynamic;

    /**
     * 
     * @param {number} i row index of the tile
     * @param {number} j column index of the tile
     * @param {boolean} dynamic is the tile controllable ?
     */
    constructor(i, j, dynamic = true) {
        this.#isDynamic = dynamic;
        this.el = document.createElement("canvas");
        this.#ctx = this.el.getContext("2d");

        const { parent } = board;

        this.el.setAttribute("style", `
            position: absolute;
            width: ${parent.tileSize}px;
            height: ${parent.tileSize}px;
            border-radius: 0.5em;
        `);
        this.el.width = parent.tileSize;
        this.el.height = parent.tileSize;

        const className = (dynamic ? "Dynamic" : "Static") + "Tile";
        this.el.classList.add(className);
        parent.el.appendChild(this.el);

        this.#setPosition(i, j);

        if(dynamic) {
            this.el.style.transform = `scale(1)`;
            this.isMerged = false;
        } else {
            this.el.style.backgroundColor = ThemeManager.getCurrentTheme().bg3;
        }
    }

    set text(t) {
        this.#text = t;
        this.el.style.backgroundColor = Tile.color[String(t)];

        this.#ctx.fillStyle = t <= 4 ? "#727371" : "#fff";
        const fontSize = (this.el.width * 0.9) / 2.5;
        this.#ctx.font = `bold ${fontSize}px Arial`;
        this.#ctx.textAlign = "center";
        this.#ctx.textBaseline = "middle";

        const px = this.el.width * 0.5;
        const py = this.el.height * 0.5;
        this.#ctx.fillText(t, px, py);
    }

    get text(){ return this.#text; }

    move(dir) {    
        const vel = { };
        vel.x = dir == "left" ? -1 : dir == "right" ? 1 : 0;
        vel.y = dir == "up" ? -1 : dir == "down" ? 1 : 0;

        let newPos;
        const oldPos = [this.i, this.j];
        // should this tile be merged with another ?
        const merge = { active: false, tile: null };

        // collisionn detection and resolution
        while(true) {
            const oldPos = [this.i, this.j];
            this.i += vel.y;
            this.j += vel.x;
            board.freeIndex(...oldPos);

            // boundary collision check
            if((this.i < 0 || this.j < 0) || (this.i >= board.col || this.j >= board.col)) {
                newPos = [...oldPos];
                break;
            }

            // other tile collision check
            const v = board.data[this.i][this.j];
            if(v instanceof Tile) {
                if(v.text === this.text && !v.isMerged) {
                    merge.active = true;
                    merge.tile = v;
                    break;
                } else {
                    newPos = [...oldPos];
                    break;
                }
            }
         
        }   // while(true) ends

        this.isMerged = false;

        if(merge.active) {
            const ind = [this.i, this.j];
            merge.tile.#delete();
            this.#delete();
            const t = new Tile(ind[0], ind[1]);
            const nText = this.text * 2;
            t.text = nText;
            t.isMerged = true;
            board.score += nText;
        } else this.#setPosition(...newPos);

        return this.#hasMoved(oldPos);
    }

    #setPosition(i, j) {
        const { parent } = board;
        this.i = i;
        this.j = j;
        if(this.#isDynamic) board.data[this.i][this.j] = this;
        this.el.style.left = parent.rect.left + parent.padding * 0.5 + j * parent.tSize + "px";
        this.el.style.top = parent.rect.top + parent.padding * 0.5 + i * parent.tSize + "px";
    }

    /**
     * check if a tile has changed it's index
     * @param {Array} oldPos previous index of the tile
     * @returns { boolean }
     */
    #hasMoved(oldPos) {
        return JSON.stringify(oldPos) !== JSON.stringify([this.i, this.j]);
    }

    #delete() {
        const { parent } = board;
        this.el.remove();
        board.freeIndex(this.i, this.j);
    }

    static spawn(isFirstRun = true) {  
        const arr = Array.from({ length: board.col * board.col }, ((i, j) => j));
        let isSelected = false;

        // spawn new tiles at random location on the board
        while(!isSelected && arr.length) {
            const p = arr[~~(Math.random() * arr.length)];
            const i = ~~(p / board.col);
            const j = ~~(p % board.col);
            const v = board.data[i][j];
            if(!v) {
                isSelected = true;
                if(isFirstRun) {
                    const t = new Tile(i, j);
                    t.text = ~~(Math.random() * 10) > 6.5 ? 4 : 2;
                }
            } else 
                arr.splice(arr.indexOf(p), 1);
        }

        return arr.length;
    }
    
    /**
     * Move all the dynamic tiles based on direction
     * @param {string} dir direction to move tiles 
     */
    static move(dir) {
        if(Tile.isSliding || board.isGameOver || Uri.getCurrentPath() !== "/play") return;
        Tile.isSliding = true;
        Tile.shouldSpawn = false;

        // sort tiles based on direction
        const tiles = board.getTiles().sort((a, b) => {
            switch(dir) {
                case "left":
                    return a.j > b.j;
                case "right":
                    return a.j < b.j;
                case "up":
                    return a.i > b.i;
                case "down":
                    return a.i < b.i;
            }
        });
        
        tiles.forEach(tile => {
            if(tile.move(dir)) Tile.shouldSpawn = true;
        });

        const timeout = setTimeout(() => {
            if(Tile.shouldSpawn) {
                Tile.spawn();
                board.checkGameOver();
            }
            Tile.isSliding = false;
            clearTimeout(timeout);
        }, 220);    // 0.2 from css transition

    }   // move() ends

}

Object.defineProperties(Tile, {
    color: {
        value: {
            2: "#eee4da",
            4: "#eee1c9",
            8: "#f3b27a",
            16: "#f69664",
            32: "#f77c5f",
            64: "#f75f3b",
            128: "#edd073",
            256: "#edcc63",
            512: "#edc651",
            1024: "#eec744",
            2048: "#ecc230",
            4096: "#cd1ca1",
            8192: "#123e66",
            16384: "#4dbeda",
        }
    },
    shouldSpawn: { value: false, writable: true },
    isSliding: { value: false, writable: true }
});

export { Tile }