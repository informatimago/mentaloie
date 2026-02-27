const OPS = ["+", "-", "*", "÷"];

export function createRng(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function shuffle(list, rng = Math.random) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function getPerimeterPositions(size = 5) {
  if (size < 2) return [];
  const positions = [];
  for (let col = 0; col < size; col += 1) positions.push({ row: 0, col });
  for (let row = 1; row < size - 1; row += 1) positions.push({ row, col: size - 1 });
  for (let col = size - 1; col >= 0; col -= 1) positions.push({ row: size - 1, col });
  for (let row = size - 2; row >= 1; row -= 1) positions.push({ row, col: 0 });
  return positions;
}

export function generatePath(rng = Math.random) {
  const numbers = [];
  for (let i = 1; i <= 16; i += 1) numbers.push(i);
  const finIndex = randomInt(rng, 1, 15);
  const finNumber = numbers[finIndex];
  const middle = numbers.filter((n) => n !== 1 && n !== finNumber);
  shuffle(middle, rng);
  return {
    path: [1, ...middle, finNumber],
    finNumber,
  };
}

function divisors(n) {
  const result = [];
  for (let i = 1; i <= n; i += 1) {
    if (n % i === 0) result.push(i);
  }
  return result;
}

function formatExpression(a, op1, b, op2, c) {
  if (op2 == null || c == null) {
    return `${a}${op1}${b}`;
  }
  return `${a}${op1}${b}${op2}${c}`;
}

export function parseExpression(expression) {
  const cleaned = expression.replace(/\s+/g, "");
  const tokens = [];
  let numberBuffer = "";
  const flushNumber = () => {
    if (numberBuffer.length === 0) return;
    tokens.push(Number(numberBuffer));
    numberBuffer = "";
  };
  for (const char of cleaned) {
    if (/[0-9]/.test(char)) {
      numberBuffer += char;
    } else if (["+", "-", "*", "÷", "/"].includes(char)) {
      flushNumber();
      tokens.push(char === "/" ? "÷" : char);
    }
  }
  flushNumber();

  if (tokens.length === 3) {
    return { a: tokens[0], op1: tokens[1], b: tokens[2] };
  }
  if (tokens.length === 5) {
    return { a: tokens[0], op1: tokens[1], b: tokens[2], op2: tokens[3], c: tokens[4] };
  }
  return null;
}

function applyOp(a, op, b) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "÷":
      return Math.trunc(a / b);
    default:
      return NaN;
  }
}

export function evaluateExpression(expression) {
  const parsed = parseExpression(expression);
  if (!parsed) return NaN;
  const { a, op1, b, op2, c } = parsed;
  if (op2 == null || c == null) {
    return applyOp(a, op1, b);
  }
  const precedence = (op) => (op === "*" || op === "÷" ? 2 : 1);
  if (precedence(op1) >= precedence(op2)) {
    const first = applyOp(a, op1, b);
    return applyOp(first, op2, c);
  }
  const second = applyOp(b, op2, c);
  return applyOp(a, op1, second);
}

function generateSingleExpression(target, rng) {
  const options = [];
  if (target >= 2) options.push("+");
  if (target <= 998) options.push("-");
  options.push("*");
  options.push("÷");

  const op = options[randomInt(rng, 0, options.length - 1)];
  let a = 1;
  let b = 1;
  if (op === "+") {
    a = randomInt(rng, 1, target - 1);
    b = target - a;
  } else if (op === "-") {
    a = randomInt(rng, target + 1, 999);
    b = a - target;
  } else if (op === "*") {
    const divs = divisors(target);
    a = divs[randomInt(rng, 0, divs.length - 1)];
    b = target / a;
  } else if (op === "÷") {
    const maxB = Math.floor(999 / target);
    b = randomInt(rng, 1, maxB);
    a = target * b;
  }
  return formatExpression(a, op, b);
}

function generateDoubleExpression(target, rng) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const a = randomInt(rng, 1, 999);
    const b = randomInt(rng, 1, 999);
    const c = a + b - target;
    if (c >= 1 && c <= 999) {
      return formatExpression(a, "+", b, "-", c);
    }
  }
  return null;
}

export function createExpressionForTarget(target, rng = Math.random) {
  const useDouble = rng() < 0.4;
  if (useDouble) {
    const doubleExpr = generateDoubleExpression(target, rng);
    if (doubleExpr) return doubleExpr;
  }
  return generateSingleExpression(target, rng);
}

export function createGame(rng = Math.random) {
  const { path, finNumber } = generatePath(rng);
  const casesByNumber = new Map();
  for (let i = 0; i < path.length; i += 1) {
    const number = path[i];
    const isFinish = number === finNumber;
    const nextNumber = isFinish ? null : path[i + 1];
    const expression = isFinish ? null : createExpressionForTarget(nextNumber, rng);
    casesByNumber.set(number, {
      number,
      label: isFinish ? "FIN" : expression,
      expression,
      isFinish,
      nextNumber,
    });
  }
  return { path, finNumber, casesByNumber };
}

export function validateExpressionForTarget(expression, target) {
  const value = evaluateExpression(expression);
  return Number.isFinite(value) && value === target;
}

export function getBoardLayout() {
  const positions = getPerimeterPositions(5);
  const numbers = [];
  for (let i = 1; i <= 16; i += 1) numbers.push(i);
  return numbers.map((number, index) => ({ number, position: positions[index] }));
}

export const INTERNALS = {
  OPS,
  applyOp,
  generateSingleExpression,
  generateDoubleExpression,
};
