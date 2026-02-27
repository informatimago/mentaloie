import {
  createGame,
  evaluateExpression,
  getBoardLayout,
} from "./game.js";

const board = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetSameBtn = document.getElementById("reset-same");
const resetNewBtn = document.getElementById("reset-new");

let currentGame = null;
let currentNumber = null;
let finished = false;
let cellsByNumber = new Map();
let savedGame = null;

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function clearToken() {
  if (!cellsByNumber.size) return;
  for (const cell of cellsByNumber.values()) {
    cell.classList.remove("token");
  }
}

function placeToken(number) {
  clearToken();
  const cell = cellsByNumber.get(number);
  if (cell) cell.classList.add("token");
}

function renderBoard(game) {
  if (!board) return;
  board.innerHTML = "";
  cellsByNumber = new Map();
  const layout = getBoardLayout();

  for (const item of layout) {
    const caseData = game.casesByNumber.get(item.number);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.style.gridRow = String(item.position.row + 1);
    cell.style.gridColumn = String(item.position.col + 1);
    cell.dataset.number = String(item.number);

    const numberEl = document.createElement("span");
    numberEl.className = "number";
    numberEl.textContent = String(item.number);

    const labelEl = document.createElement("span");
    labelEl.className = "label";
    labelEl.textContent = caseData.label;

    cell.append(numberEl, labelEl);
    board.append(cell);
    cellsByNumber.set(item.number, cell);
  }
}

function startGame(useSaved = false) {
  currentGame = useSaved && savedGame ? savedGame : createGame();
  if (!useSaved) savedGame = currentGame;
  currentNumber = null;
  finished = false;
  renderBoard(currentGame);
  clearToken();
  setStatus("Clique sur la case 1 pour commencer.");
}

function handleMove(targetNumber) {
  if (!currentGame) return;
  const currentCase = currentGame.casesByNumber.get(currentNumber);
  if (!currentCase || !currentCase.expression) return;
  const expected = evaluateExpression(currentCase.expression);
  if (targetNumber !== expected) {
    setStatus(`Non. ${currentCase.expression} = ${expected}. Réessaie.`);
    return;
  }
  const targetCase = currentGame.casesByNumber.get(targetNumber);
  if (!targetCase) return;

  currentNumber = targetNumber;
  placeToken(currentNumber);

  if (targetCase.isFinish) {
    finished = true;
    setStatus("Bravo ! Tu as atteint la case FIN.");
    return;
  }
  setStatus(`Correct ! Calcule: ${targetCase.expression}`);
}

function handleCellClick(event) {
  const button = event.target.closest(".cell");
  if (!button || !board?.contains(button)) return;
  if (finished) return;
  const number = Number(button.dataset.number);
  if (!currentNumber) {
    if (number !== 1) {
      setStatus("Commence par la case 1.");
      return;
    }
    currentNumber = 1;
    placeToken(1);
    const startCase = currentGame.casesByNumber.get(1);
    if (startCase?.expression) {
      setStatus(`Bien. Calcule: ${startCase.expression}`);
    }
    return;
  }
  if (number === currentNumber) {
    setStatus("Tu es deja sur cette case.");
    return;
  }
  handleMove(number);
}

board?.addEventListener("click", handleCellClick);
resetSameBtn?.addEventListener("click", () => startGame(true));
resetNewBtn?.addEventListener("click", () => startGame(false));

startGame(false);
