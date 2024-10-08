"use strict";
let ctx;
let animationId;
let gameState = 1 /* GameState.PLAYING */;
const settings = {
    playerChoice: "O" /* BoardItem.O */,
    enemyChoice: "X" /* BoardItem.X */,
    resetPlayerChoice(choice) {
        this.playerChoice = choice;
        this.enemyChoice = choice === "O" /* BoardItem.O */ ? "X" /* BoardItem.X */ : "O" /* BoardItem.O */;
    },
    theme: {
        currTheme: "light",
        themeState: {
            light: {
                board: "#ede6e6",
                player: "#80c056",
                enemy: "#d7523d",
            }
        },
        reset() {
            // document.body.style.background =
            //     ctx.canvas.style.background =
            //         this.state.board;
        },
        get state() {
            // @ts-ignore
            return this.themeState[this.currTheme];
        }
    }
};
const main = () => {
    init();
    animationId = requestAnimationFrame(animate);
    eventHandler();
};
addEventListener("load", main);
const update = () => {
};
const draw = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const w = Board.getTileSize();
    const fontSize = w * 0.5;
    ctx.font = `${fontSize}px bold verdana`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < Board.getSize(); i++) {
        for (let j = 0; j < Board.getSize(); j++) {
            const id = Board.getVal(i, j);
            const px = j * w;
            const py = i * w;
            // TODO: Make look realistic
            ctx.strokeStyle = "#cccccc";
            ctx.strokeRect(px, py, w, w);
            if (id !== "#" /* BoardItem.EMPTY */) {
                ctx.fillStyle = id === settings.playerChoice ? settings.theme.state.player :
                    settings.theme.state.enemy;
                const tx = px + w * 0.5;
                const ty = py + w * 0.5;
                ctx.fillText(id, tx, ty);
            }
        }
    }
};
const animate = (timeStamp) => {
    update();
    draw();
    requestAnimationFrame(animate);
};
const Board = (function () {
    let size = 3;
    let tileSize = 0;
    let boardGrid;
    let lastPlayed;
    let validMoves;
    const reset = (s = 3) => {
        boardGrid = [];
        for (let i = 0; i < s; i++) {
            boardGrid.push([]);
            for (let j = 0; j < s; j++) {
                boardGrid[i].push("#" /* BoardItem.EMPTY */);
            }
        }
        // top, left, right, bottom, diagonal
        validMoves = [[], [], [], [], []];
        for (let i = 0; i < size; i++) {
            validMoves[0].push({ x: i, y: 0 });
            validMoves[1].push({ x: 0, y: i });
            validMoves[2].push({ x: size - 1, y: i });
            validMoves[3].push({ x: i, y: size - 1 });
            validMoves[4].push({ x: i, y: i });
        }
        size = s;
    };
    const getSize = () => size;
    const putVal = (row, col, v) => {
        boardGrid[row][col] = v;
        lastPlayed = v;
    };
    const getVal = (row, col) => {
        return boardGrid[row][col];
    };
    const asArray = () => { return boardGrid; };
    const getTileSize = () => (ctx.canvas.width / Board.getSize());
    const getLastPlayed = () => lastPlayed;
    const getBoardPointerCoord = (e) => {
        const bRect = ctx.canvas.getBoundingClientRect();
        let px = ("pageX" in e ? e.pageX : e.touches[0].pageX) - bRect.left;
        let py = ("pageY" in e ? e.pageY : e.touches[0].pageY) - bRect.top;
        return { x: ~~(px / getTileSize()), y: ~~(py / getTileSize()) };
    };
    async function clear(timeOut = 3000) {
        return new Promise(resolve => {
            setTimeout(() => {
                Board.reset(size);
                resolve(true);
            }, timeOut);
        });
    }
    const isMoveValidScore = () => validMoves
        .filter(moves => moves.every(j => getVal(j.y, j.x) === getLastPlayed()))
        .length > 0;
    return { asArray, reset, getSize, clear, getBoardPointerCoord, getTileSize, putVal, getVal, getLastPlayed, isMoveValidScore };
})();
// TODO: implement Minimax algorithm for play method
const AiLogic = (function () {
    let mode = "easy";
    const _easyPlay = async () => {
        const size = Board.getSize();
        let vacantSpace = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++)
                if (Board.getVal(i, j) === "#" /* BoardItem.EMPTY */)
                    vacantSpace.push({ x: j, y: i });
        }
        if (!vacantSpace.length) {
            // TODO: seems not to clear after AI play
            await Board.clear().then(r => _easyPlay());
            return;
        }
        const randSelectedLoc = ~~(Math.random() * vacantSpace.length);
        console.assert(randSelectedLoc < vacantSpace.length);
        const rIndex = vacantSpace[randSelectedLoc];
        Board.putVal(rIndex.y, rIndex.x, settings.enemyChoice);
    };
    const _mediumPlay = () => {
    };
    const _hardPlay = () => {
    };
    const play = () => {
        switch (mode) {
            case "easy":
                _easyPlay();
                break;
            case "medium":
                _mediumPlay();
                break;
            case "hard":
                _hardPlay();
                break;
        }
    };
    return { play };
})();
const restart = (boardSize = 3) => {
    gameState = 1 /* GameState.PLAYING */;
    Board.reset(boardSize);
};
const eventHandler = () => {
    ctx.canvas?.addEventListener("click", e => {
        if (!1 /* GameState.PLAYING */ || Board.getLastPlayed() === settings.playerChoice)
            return;
        const indices = Board.getBoardPointerCoord(e);
        const id = Board.getVal(indices.y, indices.x);
        if (id === "#" /* BoardItem.EMPTY */) {
            Board.putVal(indices.y, indices.x, settings.playerChoice);
            let hasWin = Board.isMoveValidScore();
            if (hasWin)
                console.log(Board.getLastPlayed() + "wins");
            let boardVacant = Board.asArray().flat().some(i => i === "#" /* BoardItem.EMPTY */);
            if (!boardVacant) {
                Board.clear().then(e => {
                    AiLogic.play();
                    hasWin = Board.isMoveValidScore();
                    if (hasWin)
                        console.log(Board.getLastPlayed() + "wins");
                });
            }
            else {
                AiLogic.play();
                hasWin = Board.isMoveValidScore();
                if (hasWin)
                    console.log(Board.getLastPlayed() + "wins");
            }
        }
        else
            console.log("This region has been occupied");
    });
};
const init = () => {
    const canvas = document.getElementById("cvs");
    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Unable to create 2D canvas rendering context");
        return;
    }
    canvas.width = canvas.height = 400;
    settings.theme.reset();
    restart();
};
