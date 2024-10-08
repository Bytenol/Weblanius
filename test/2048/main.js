/**
 * Bytenol - 2023
 * @todo
 * 
 * - refactor duplicates 
 * - Theme for dynamic tiles
 * - add local storage 
 * - add firebase storage 
 * - make highscore button function
 * - make reverse movement button
 * - customize reset prompt
 * - save last theme
 * - change size without reset
 * 
 * @possible Bugs
 * - inside board.reset() static tile loop 
 * 
 */
import { ThemeManager } from "./lib/theme.js";
import { Tile } from "./lib/tile.js";
import { Uri } from "./lib/uri.js";

/**
 * 
 * @param {number} h hue value
 * @param {number} s saturation value
 * @returns {object} color pallette
 */
const paletteGenerator = (h, s) => ({
    bg0: `hsl(${h}, ${s}%, 88%)`,
    bg1: `hsl(${h}, ${s}%, 37%)`,
    bg2: `hsl(${h}, ${s}%, 47%)`,
    bg3: `hsl(${h}, ${s}%, 57%)`,
    bg4: "tomato",
    fg0: `hsl(${h}, ${s}%, 37%)`,
    fl0: `hsl(${h}, ${s}%, 37%)`,
});

const themes = {
    curr: "default",
    bgDefault: "#faf8ef",
    fgDefault: "#776e65",
    fillDefault: "#8f7a66",
    data: {
        default: paletteGenerator(23, 41),
        teal: paletteGenerator(175, 32),
        green: paletteGenerator(121, 67),
        indigo: paletteGenerator(258, 67),
    },
    // SELF VAR...
    chosenIndex: 0,
    switch() {
        const n = ["default", "teal", "green", "indigo"];
        this.chosenIndex++;
        const ind = n[this.chosenIndex % n.length];
        ThemeManager.setTheme(ind);
    }
};


const board = {
    col: 3, // size of the board [square]
    data: [],   // collision array
    isGameOver: false,
    dimensionChanged: true,
    _score: 0,
    _highscore: 0,
    scorePeak: 2048,

    // all data relating to the game board
    get parent(){ 
        const el = document.getElementById("gameBoard");
        const size = parseFloat(getComputedStyle(el).getPropertyValue("width"));
        const rect = el.getBoundingClientRect();
        const tSize = size / this.col;
        const tileSize = tSize * 0.9;
        const padding = tSize - tileSize;
        return { el, size, tSize, tileSize, padding, rect };
    },

    set score(s){ 
        this._score = s;
        document.getElementById("score").textContent = s;
    },

    get score(){ return this._score; },

    set highscore(s){ 
        this._highscore = s;
        document.getElementById("highscore").textContent = s;
    },

    get highscore(){ return this._highscore; },

    get isFilled(){ return this.getTiles().length >= this.col * this.col; },

    restart() {
        this.createGrid();
        this.initData();
        Tile.spawn();
        Tile.spawn();
    },

    createGrid() {
        this.parent.el.innerHTML = "";
        // create static tiles
        for(let i = 0; i < this.col; i++) {
            for(let j = 0; j < this.col; j++) {
                new Tile(i, j, false);
                // having issues with this board ? seems sketchy to me
                // let d = [[16, 4, 2], [8,16,4],[2,8,8]];
                // const t = new Tile(i, j);
                // t.text = d[i][j];
            }
        }
    },

    /**
     * Resets the board data and generate new data
     * @param {number} colSize size of the col/row of the board
     */
    reset(colSize) {
        this.col = colSize;
        this.highscore = 0; //Math.max(this.score, this.highscore);
        this.score = 0;
        document.getElementById("scorePeak").textContent = this.scorePeak;        
        this.restart();
    },


    /**
     * This function clears the data array and dynamic tiles present
     */
    initData() {
        this.data = [];
        for(let i = 0; i < this.col; i++) {
            this.data.push([]);
            for(let j = 0; j < this.col; j++)
                this.data[i].push(null);
        }
    },

    freeIndex(i, j) { this.data[i][j] = null; },

    getTiles(){ return this.data.flat().filter(i => i instanceof Tile);  },

    checkGameOver() {
        // check game done
        let gameDone = false;
        for(let i = 0; i < this.col; i++) {
            for(let j = 0; j < this.col; j++) {
                const v = this.data[i][j];
                if(v && v.text === board.scorePeak) {
                    gameDone = true;
                    break;
                }
            }
        }

        if(gameDone) {
            this.isGameOver = true;
            let timeOut = setTimeout(() => {
                document.body.style.filter = `blur(5px)`;
                clearTimeout(timeOut);
                timeOut = setTimeout(() => {
                    document.body.style.filter = `blur(0px)`;
                    Uri.goto("/home");
                    clearTimeout(timeOut);
                }, 3500);
                alert("YOU WON!!!\nyou will be redirected to home");
            }, 2500);
            return;
        }

        if(!Tile.spawn(false)) {
            let gameOver = true;
            for(let i = 0; i < this.col; i++) {
                for(let j = 0; j < this.col; j++) {
                    let neighbors = [];
                    if(j - 1 >= 0) neighbors.push((this.data[i][j - 1]).text);
                    if(j + 1 < this.col) neighbors.push((this.data[i][j + 1]).text);
                    if(i - 1 >= 0) neighbors.push((this.data[i - 1][j]).text);
                    if(i + 1 < this.col) neighbors.push((this.data[i + 1][j]).text);
                    let v = neighbors.filter(k => k === (this.data[i][j]).text);
                    if(v.length) gameOver = false;
                }
            }   // for ends
            this.isGameOver = gameOver;
            if(gameOver) {
                let timeOut = setTimeout(() => {
                    document.body.style.filter = `blur(5px)`;
                    clearTimeout(timeOut);
                    timeOut = setTimeout(() => {
                        document.body.style.filter = `blur(0px)`;
                        Uri.goto("/home");
                        clearTimeout(timeOut);
                    }, 3500);
                    alert("GAME OVER!!!\nyou will be redirected to home");
                }, 2500);
            }
        }   // if ends 
    }

};


const $ = s => document.querySelector(s);

const Event = (() => {

    let sizeSwipeCounter = 0;
    const swipe = { isActive: false, x: null, y: null, dir: null, tol: 50 };

    const init = () => {
        keyCtrl();
        touchCtrl();
        buttonCtrl();
    }

    const buttonCtrl = () => {

        $("#startgame-btn").onclick = () => {
            Uri.goto("/play");
            if(board.dimensionChanged) {
                board.reset(board.col);
                board.dimensionChanged = false;
            } else if(board.isGameOver) {
                board.restart();
                board.isGameOver = false;
            }
        }

        $("#home-btn").onclick = () => Uri.goto("/home");

        $("#share-btn").onclick = () => alert("Share not implemented");

        $("#history-btn").onclick = () => alert("History not implemented");

        $("#restart-btn").onclick = () => confirm("Do you want to restart the game") && board.restart();

        $("#highscore-btn").onclick = () => alert("online Highscore not implemented");

        $("#palette-chooser").onclick = () => {
            alert("Bug Alert\nThis feature may not work properly");
            themes.switch();
        }

        $("#menu").onclick = () => Uri.goto("/settings");

        const selectDom = $("#endingPoint");
        selectDom.onchange = () => {
            const ind = selectDom.options.selectedIndex;
            const val = parseInt(selectDom.options[ind].value);
            board.scorePeak = val;
            board.dimensionChanged = true;
        }

        $("#settings-back-btn").onclick = () => Uri.goto("/home");
    }

    const touchCtrl = () => {

        const debug = true;
        const evt = debug ? ["mousedown", "mousemove", "mouseup"] : 
            ["touchstart", "touchmove", "touchend"];
        const nm = debug ? ["clientX", "clientY"] : ["touches[0][pageX]", "touches[0][pageY]"];

        addEventListener(evt[0], e => {
            swipe.x = e[nm[0]];
            swipe.y = e[nm[1]];
            swipe.isActive = true;
        });

        addEventListener(evt[1], e => {
            if(swipe.isActive) {
                const dx = e[nm[0]] - swipe.x;
                const dy = e[nm[1]] - swipe.y;
                if(Math.hypot(dx, dy) >= swipe.tol) {
                    swipe.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : 
                        (dy < 0 ? "up" : "down");
                }
            }
        });

        addEventListener(evt[2], e => {
            if(swipe.dir !== null) {
                // console.log(swipe.dir);
                Tile.move(swipe.dir);
                changeBoardCol(swipe.dir);
            }
            swipe.dir = null;
            swipe.x = null;
            swipe.y = null;
            swipe.isActive = false;
        });

    }   // swipeCtrl ends

    const changeBoardCol = (dir) => {
        if(Uri.getCurrentPath() === "/home") {
            let sizes = [3, 4, 5, 6];
            sizeSwipeCounter += dir === "left" ? -1 : dir === "right" ? 1 : 0;
            let ind = Math.abs(sizeSwipeCounter) % sizes.length;
            const v = sizes[ind];
            board.col = v;
            $("#boardSize").textContent = `${v} x ${v}`;
            board.dimensionChanged = true;
        }
    }

    const keyCtrl = () => {

        window.addEventListener("keyup", e => {
            if(e.key.toLowerCase().includes("arrow")) {
                const dir = e.key.substring(5).toLowerCase();
                Tile.move(dir);
                changeBoardCol(dir);
            }
        });
    }   // keyCtrl ends

    return { init }
})();

const main = () => {
    ThemeManager.init(themes);
    Uri.init();
    Event.init();
    ThemeManager.setTheme("default");
}

addEventListener("load", main);

export { board }