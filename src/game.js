import zim_game from "https://zimjs.org/cdn/016/zim_game";

const CONFIG = {
  width: 1360,
  height: 680,
  color: "#e8fcd8",
  outerColor: "rgb(195, 234, 169)",
  board: {
    rows: 11,
    cols: 11,
    backgroundColor: "rgb(195, 234, 169)",
    borderColor: "#FFFFFF",
    borderWidth: 3,
    indicatorColor: "transparent",
    indicatorBorderColor: "#FFFFFF50",
    indicatorBorderWidth: 2,
    indicatorSize: 12,
    indicatorType: "circle",
  },
  tiles: {
    walls: generateGrid(1, 9, 1, 9),
    blue: [
      [0, 0], [0, 3], [0, 6], [0, 9],
      [2, 10], [4, 0], [6, 10], [7, 0],
      [9, 0], [10, 1], [10, 4], [10, 7], [10, 9],
    ],
    green: [
      [0, 1], [0, 5], [0, 7], [0, 10],
      [2, 0], [3, 10], [5, 10], [6, 0],
      [7, 10], [9, 10], [10, 0], [10, 3], [10, 5], [10, 8],
    ],
    red: [
      [0, 2], [0, 4], [0, 8],
      [1, 0], [1, 10], [3, 0], [4, 10],
      [5, 0], [8, 0], [8, 10],
      [10, 2], [10, 6], [10, 10],
    ],
  },
};

function generateGrid(startRow, endRow, startCol, endCol) {
  const grid = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      grid.push([row, col]);
    }
  }
  return grid;
}

new Frame({
  scaling: FILL,
  width: CONFIG.width,
  height: CONFIG.height,
  color: CONFIG.color,
  outerColor: CONFIG.outerColor,
  mouseMoveOutside: true,
  rollover: false,
  sensors: false,
  ready,
});

function ready() {
  F.color = "transparent";

  const board = new Board(CONFIG.board)
    .scaleTo(S, 90, 90)
    .center()
    .bot();

  const sprites = {
    down:  new Pic("assets/tow_down.svg"),
    left:  new Pic("assets/tow_left.svg"),
    up:    new Pic("assets/tow_up.svg"),
    right: new Pic("assets/tow_right.svg"),
  };

  const tiles = new Pic("assets/board_overlay.svg");
  const map = new Container(tiles.width, tiles.height)
    .reg(CENTER, tiles.height - 288)
    .sca(1)
    .bot();
  tiles.centerReg(map);
  board.add(map, 0, 0).bot();

  const player = new Container(sprites.down.width, sprites.down.height)
    .reg(CENTER, sprites.down.height)
    .sca(0.75);
  sprites.down.centerReg(player).mov(0, -15);
  board.add(player, 0, 0).top();

  applyTiles(CONFIG.tiles.walls,  board, null, "0");
  applyTiles(CONFIG.tiles.blue,   board, "#64c4ff");
  applyTiles(CONFIG.tiles.green,  board, "#96dd5e");
  applyTiles(CONFIG.tiles.red,    board, "#fc6b6b");

  board.addKeys(player, "arrows", { notData: ["0"] });

  let spaceCount = 0;
  const sideTiles = board.cols - 1;
  let startCol = 0, startRow = 0;
  let endCol = 0,   endRow = 0;

  const spinButton = document.querySelector(".spin-button");
  spinButton.addEventListener("click", handleSpin);

  function handleSpin() {
    const value = parseInt(spinButton.getAttribute("data-value"));
    if (!value || spaceCount + value >= 40) return;
    spaceCount += value;
    setTimeout(() => {
      [endCol, endRow] = calcPosition(spaceCount, sideTiles);
      findPath();
    }, 4000);
  }

  function calcPosition(count, side) {
    if (count <= 10)       return [0, count];
    if (count <= 20)       return [count - side, side];
    if (count <= 30)       return [side, side - (count - 20)];
    return                        [side - (count - 30), 0];
  }

  player.on("movingstart", (e) => {
    player.removeAllChildren();
    const offsets = { down: -20, up: -20, left: -20, right: -20 };
    sprites[e.dir].centerReg(player).mov(0, offsets[e.dir]).sca(0.95);
    S.update();
  });

  player.on("movingdone", () => {
    const color = board.getColor(endCol, endRow);
    onTileColor(color);
  });

  F.on("keydown", (e) => {
    const { col, row } = board.getIndexes(player.boardTile);
    const onVerticalEdge   = col === 0 || col === sideTiles;
    const onHorizontalEdge = row === 0 || row === sideTiles;

    if (onVerticalEdge) {
      if (e.key === "ArrowUp")   { player.removeAllChildren(); sprites.up.centerReg(player).mov(0, -20).sca(1); }
      if (e.key === "ArrowDown") { player.removeAllChildren(); sprites.down.centerReg(player).mov(0, -15).sca(0.95); }
    } else if (onHorizontalEdge) {
      if (e.key === "ArrowRight") { player.removeAllChildren(); sprites.right.centerReg(player).mov(0, -20).sca(1); }
      if (e.key === "ArrowLeft")  { player.removeAllChildren(); sprites.left.centerReg(player).mov(0, -20).sca(0.95); }
    }
    S.update();
  });

  function onTileColor(color) {
    const actions = {
      "#96dd5e": () => openPane("Green tile content", green),
      "#64c4ff": () => openPane("Blue tile content", blue),
      "#fc6b6b": () => openPane("Red tile content", red),
    };
    actions[color]?.();
  }

  const wheelContainer = document.querySelector(".wheel-container");

  function openPane(text, color) {
    timeout(0.7, () => {
      wheelContainer.style.display = "none";
      STYLE = { backdropColor: black.toAlpha(0.9), align: CENTER };
      new Pane({
        content: new Label(text, 30, "Montserrat", white),
        backgroundColor: color,
        width: 700,
        height: 500,
        displayClose: false,
        backdropClose: false,
        close: true,
        closeColor: white,
      }).show(() => {
        wheelContainer.style.display = "flex";
      });
    });
  }

  // Pathfinding
  let AI = new EasyStar.js();
  AI.setAcceptableTiles(["x"]);
  let pathID, ticker, path;

  function findPath() {
    if (player.moving) return;
    if (path) {
      board.followPath(player, path);
      path = null;
    } else {
      getPath(true);
    }
    S.update();
  }

  function getPath(go) {
    AI.setGrid(board.data);
    AI.cancelPath(pathID);
    if (ticker) Ticker.remove(ticker);

    pathID = AI.findPath(startCol, startRow, endCol, endRow, (thePath) => {
      path = thePath;
      Ticker.remove(ticker);
      board.showPath(path);
      if (go) {
        board.followPath(player, path);
        path = null;
      }
    });

    startCol = endCol;
    startRow = endRow;

    ticker = Ticker.add(() => AI.calculate());
  }
}

function applyTiles(tilesArray, board, color, data) {
  loop(tilesArray, ([row, col]) => {
    const tile = board.getTile(row, col);
    if (color) board.setColor(tile, color);
    if (data)  board.setData(tile, data);
  });
}
