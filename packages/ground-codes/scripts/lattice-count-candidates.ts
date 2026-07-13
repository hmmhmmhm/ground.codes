export function sqrtSumCount(m: number): number {
  if (m < 0) return 0;
  const r = Math.floor(Math.sqrt(m));
  let count = 0;
  for (let x = 0; x <= r; x++) {
    const y = Math.floor(Math.sqrt(m - x * x));
    count += (x === 0 ? 1 : 2) * (2 * y + 1);
  }
  return count;
}

export function firstQuadrantCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;
  const r = Math.floor(Math.sqrt(m));
  let interior = 0;
  for (let x = 1; x <= r; x++) {
    interior += Math.floor(Math.sqrt(m - x * x));
  }
  return 4 * (interior + r) + 1;
}

export function fractionalPartIdentityCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  const r = Math.floor(Math.sqrt(m));
  let interior = 0;

  for (let x = 1; x <= r; x++) {
    const root = Math.sqrt(m - x * x);
    interior += root - (root % 1);
  }

  return 4 * (interior + r) + 1;
}

export function boundaryWalkCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  const r = Math.floor(Math.sqrt(m));
  let y = r;
  let interior = 0;

  for (let x = 1; x <= r; x++) {
    const xSquared = x * x;
    while (y > 0 && xSquared + y * y > m) y--;
    interior += y;
  }

  return 4 * (interior + r) + 1;
}

export function firstOctantCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;
  const r = Math.floor(Math.sqrt(m));
  const limit = Math.floor(Math.sqrt(m / 2));
  let diagonalAdjustment = 0;
  let octant = 0;

  for (let x = 1; x <= limit; x++) {
    const y = Math.floor(Math.sqrt(m - x * x));
    octant += y - x + 1;
    if (x * x * 2 <= m) diagonalAdjustment++;
  }

  // First octant points with 1 <= x <= y, mirrored to the quadrant.
  const quadrantInterior = 2 * octant - diagonalAdjustment;
  return 4 * (quadrantInterior + r) + 1;
}

export function jacobiDivisorSummatoryCount(m: number): number {
  if (m < 0) return 0;

  let sum = 0;
  for (let left = 1; left <= m; ) {
    const quotient = Math.floor(m / left);
    const right = Math.floor(m / quotient);
    sum += quotient * (chi4Prefix(right) - chi4Prefix(left - 1));
    left = right + 1;
  }

  return 1 + 4 * sum;
}

export function chi4Prefix(n: number): number {
  switch (n & 3) {
    case 1:
    case 2:
      return 1;
    default:
      return 0;
  }
}

type Slope = [number, number];

export function convexHullCount(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  let count = 0;
  const slopeStack: Slope[] = [
    [0, 1],
    [1, 0],
  ];

  const cbrt = Math.floor(Math.cbrt(m));
  const sqrt = Math.floor(Math.sqrt(m));
  const naiveThreshold = Math.min(cbrt + 1, sqrt);

  for (let x = 1; x <= naiveThreshold; x++) {
    count += maxYInCircle(x, m);
  }

  let current: Slope = [naiveThreshold, maxYInCircle(naiveThreshold, m)];

  while (true) {
    let slope = slopeStack.pop()!;

    for (
      let next: Slope;
      pointInCircle((next = goDown(current, slope)), m);
      current = next
    ) {
      count += bottomArea(next, slope);
    }

    if (current[0] >= sqrt - naiveThreshold) break;

    while (
      !pointInCircle(goDown(current, slopeStack[slopeStack.length - 1]!), m)
    ) {
      slope = slopeStack.pop()!;
    }

    while (true) {
      const right = slopeStack[slopeStack.length - 1]!;
      const middle: Slope = [slope[0] + right[0], slope[1] + right[1]];
      const next = goDown(current, middle);

      if (pointInCircle(next, m)) {
        slopeStack.push(middle);
      } else if (slopeOut(right, next[0], m)) {
        slope = middle;
      } else {
        break;
      }
    }
  }

  for (let x = current[0] + 1; x <= sqrt; x++) {
    count += maxYInCircle(x, m);
  }

  return 4 * (count + sqrt) + 1;
}

export function convexHullCountFlat(m: number): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  let count = 0;
  const stackX = [0, 1];
  const stackY = [1, 0];
  let stackLength = 2;

  const cbrt = Math.floor(Math.cbrt(m));
  const sqrt = Math.floor(Math.sqrt(m));
  const naiveThreshold = Math.min(cbrt + 1, sqrt);

  for (let x = 1; x <= naiveThreshold; x++) {
    count += maxYInCircle(x, m);
  }

  let currentX = naiveThreshold;
  let currentY = maxYInCircle(naiveThreshold, m);

  while (true) {
    stackLength--;
    let slopeX = stackX[stackLength]!;
    let slopeY = stackY[stackLength]!;

    while (true) {
      const nextX = currentX + slopeX;
      const nextY = currentY - slopeY;
      if (!pointInCircleXY(nextX, nextY, m)) break;

      count += slopeX * nextY + ((slopeX - 1) * (slopeY - 1)) / 2;
      currentX = nextX;
      currentY = nextY;
    }

    if (currentX >= sqrt - naiveThreshold) break;

    while (
      !pointInCircleXY(
        currentX + stackX[stackLength - 1]!,
        currentY - stackY[stackLength - 1]!,
        m,
      )
    ) {
      stackLength--;
      slopeX = stackX[stackLength]!;
      slopeY = stackY[stackLength]!;
    }

    while (true) {
      const rightX = stackX[stackLength - 1]!;
      const rightY = stackY[stackLength - 1]!;
      const middleX = slopeX + rightX;
      const middleY = slopeY + rightY;
      const nextX = currentX + middleX;
      const nextY = currentY - middleY;

      if (pointInCircleXY(nextX, nextY, m)) {
        stackX[stackLength] = middleX;
        stackY[stackLength] = middleY;
        stackLength++;
      } else if (slopeOutNoDivision(rightX, rightY, nextX, m)) {
        slopeX = middleX;
        slopeY = middleY;
      } else {
        break;
      }
    }
  }

  for (let x = currentX + 1; x <= sqrt; x++) {
    count += maxYInCircle(x, m);
  }

  return 4 * (count + sqrt) + 1;
}

export function convexHullCountFlatTuned(
  m: number,
  multiplier: number,
): number {
  if (m < 0) return 0;
  if (m === 0) return 1;

  let count = 0;
  const stackX = [0, 1];
  const stackY = [1, 0];
  let stackLength = 2;

  const cbrt = Math.floor(Math.cbrt(m));
  const sqrt = Math.floor(Math.sqrt(m));
  const naiveThreshold = Math.min(
    Math.max(1, Math.floor(cbrt * multiplier)),
    sqrt,
  );

  for (let x = 1; x <= naiveThreshold; x++) {
    count += maxYInCircle(x, m);
  }

  let currentX = naiveThreshold;
  let currentY = maxYInCircle(naiveThreshold, m);

  while (true) {
    stackLength--;
    let slopeX = stackX[stackLength]!;
    let slopeY = stackY[stackLength]!;

    while (true) {
      const nextX = currentX + slopeX;
      const nextY = currentY - slopeY;
      if (!pointInCircleXY(nextX, nextY, m)) break;

      count += slopeX * nextY + ((slopeX - 1) * (slopeY - 1)) / 2;
      currentX = nextX;
      currentY = nextY;
    }

    if (currentX >= sqrt - naiveThreshold) break;

    while (
      !pointInCircleXY(
        currentX + stackX[stackLength - 1]!,
        currentY - stackY[stackLength - 1]!,
        m,
      )
    ) {
      stackLength--;
      slopeX = stackX[stackLength]!;
      slopeY = stackY[stackLength]!;
    }

    while (true) {
      const rightX = stackX[stackLength - 1]!;
      const rightY = stackY[stackLength - 1]!;
      const middleX = slopeX + rightX;
      const middleY = slopeY + rightY;
      const nextX = currentX + middleX;
      const nextY = currentY - middleY;

      if (pointInCircleXY(nextX, nextY, m)) {
        stackX[stackLength] = middleX;
        stackY[stackLength] = middleY;
        stackLength++;
      } else if (slopeOutSquared(rightX, rightY, nextX, m)) {
        slopeX = middleX;
        slopeY = middleY;
      } else {
        break;
      }
    }
  }

  for (let x = currentX + 1; x <= sqrt; x++) {
    count += maxYInCircle(x, m);
  }

  return 4 * (count + sqrt) + 1;
}

export function areaApproximationCount(m: number): number {
  return Math.round(Math.PI * m);
}

export function boundaryCorrectedApproximationCount(m: number): number {
  return Math.round(Math.PI * m + 2 * Math.sqrt(m));
}

export function polygonAreaApproximationCount(m: number): number {
  const sides = 64;
  const areaRatio = (sides * Math.sin((2 * Math.PI) / sides)) / (2 * Math.PI);
  return Math.round(Math.PI * m * areaRatio);
}

export function maxYInCircle(x: number, m: number): number {
  return Math.floor(Math.sqrt(m - x * x));
}

export function goDown(point: Slope, slope: Slope): Slope {
  return [point[0] + slope[0], point[1] - slope[1]];
}

export function bottomArea(point: Slope, slope: Slope): number {
  return slope[0] * point[1] + ((slope[0] - 1) * (slope[1] - 1)) / 2;
}

export function pointInCircle(point: Slope, m: number): boolean {
  return point[0] * point[0] + point[1] * point[1] <= m;
}

export function slopeOut(slope: Slope, x: number, m: number): boolean {
  return slope[1] / slope[0] > x / Math.sqrt(m - x * x);
}

export function pointInCircleXY(x: number, y: number, m: number): boolean {
  return x * x + y * y <= m;
}

export function slopeOutNoDivision(
  slopeX: number,
  slopeY: number,
  x: number,
  m: number,
): boolean {
  return slopeY * Math.sqrt(m - x * x) > slopeX * x;
}

export function slopeOutSquared(
  slopeX: number,
  slopeY: number,
  x: number,
  m: number,
): boolean {
  return slopeY * slopeY * (m - x * x) > slopeX * slopeX * x * x;
}
