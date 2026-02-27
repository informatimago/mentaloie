import {
  createRng,
  createGame,
  createExpressionForTarget,
  evaluateExpression,
  generatePath,
  getBoardLayout,
  getPerimeterPositions,
  parseExpression,
  randomInt,
  shuffle,
  validateExpressionForTarget,
} from "./game.js";

const resultsEl = document.getElementById("results");
const resultsBody = resultsEl?.querySelector("tbody");

function report(message, ok = true) {
  if (!resultsBody) return;
  const row = document.createElement("tr");
  const nameCell = document.createElement("td");
  const statusCell = document.createElement("td");
  nameCell.textContent = message;
  statusCell.textContent = ok ? "OK" : "FAIL";
  statusCell.className = ok ? "ok" : "fail";
  row.append(nameCell, statusCell);
  resultsBody.append(row);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function test(name, fn) {
  try {
    fn();
    report(name, true);
  } catch (error) {
    report(`${name} (${error.message})`, false);
  }
}

const rng = createRng(42);

test("createRng is deterministic", () => {
  const rngA = createRng(123);
  const rngB = createRng(123);
  for (let i = 0; i < 5; i += 1) {
    const a = rngA();
    const b = rngB();
    assert(a === b, "sequence mismatch");
    assert(a >= 0 && a < 1, "rng out of range");
  }
});

test("randomInt respects bounds", () => {
  const localRng = createRng(7);
  for (let i = 0; i < 20; i += 1) {
    const value = randomInt(localRng, 3, 8);
    assert(value >= 3 && value <= 8, "value out of bounds");
  }
});

test("shuffle preserves elements", () => {
  const list = [1, 2, 3, 4, 5];
  const shuffled = shuffle([...list], rng);
  assert(shuffled.length === list.length, "length mismatch");
  for (const value of list) {
    assert(shuffled.includes(value), "missing value");
  }
});

test("generatePath builds a valid path", () => {
  const { path, finNumber } = generatePath(rng);
  assert(path[0] === 1, "start not 1");
  assert(path[path.length - 1] === finNumber, "fin not last");
  assert(path.length === 16, "length not 16");
  const unique = new Set(path);
  assert(unique.size === 16, "duplicates in path");
});

test("getPerimeterPositions matches 5x5 perimeter", () => {
  const positions = getPerimeterPositions(5);
  assert(positions.length === 16, "perimeter length not 16");
  const unique = new Set(positions.map((p) => `${p.row}-${p.col}`));
  assert(unique.size === 16, "positions not unique");
});

test("createExpressionForTarget evaluates to target", () => {
  for (let n = 1; n <= 16; n += 1) {
    const expr = createExpressionForTarget(n, rng);
    assert(validateExpressionForTarget(expr, n), `expr ${expr} != ${n}`);
  }
});

test("evaluateExpression respects precedence", () => {
  assert(evaluateExpression("2+3*4") === 14, "precedence failed");
  assert(evaluateExpression("10-6÷2") === 7, "division precedence failed");
  assert(evaluateExpression("12÷5") === 2, "integer division failed");
});

test("parseExpression accepts division slash", () => {
  const parsed = parseExpression("9/3");
  assert(parsed?.op1 === "÷", "slash not normalized");
  assert(evaluateExpression("9/3") === 3, "slash evaluation failed");
});

test("validateExpressionForTarget detects mismatch", () => {
  assert(validateExpressionForTarget("2+2", 5) === false, "expected mismatch");
  assert(validateExpressionForTarget("2+2", 4) === true, "expected match");
});

test("createGame builds expressions for each case", () => {
  const game = createGame(rng);
  for (const [number, data] of game.casesByNumber.entries()) {
    if (data.isFinish) {
      assert(data.label === "FIN", "fin label missing");
    } else {
      assert(data.expression, `missing expression for ${number}`);
      assert(validateExpressionForTarget(data.expression, data.nextNumber), "expression mismatch");
    }
  }
});

test("getBoardLayout orders numbers 1..16", () => {
  const layout = getBoardLayout();
  assert(layout.length === 16, "layout length");
  for (let i = 0; i < layout.length; i += 1) {
    assert(layout[i].number === i + 1, "layout order incorrect");
  }
});
