export function toBaseN(index: number, base: number): number[] {
  if (index === 0) {
    return [0];
  }

  const digits: number[] = [];
  while (index > 0) {
    const remainder = index % base;
    digits.unshift(remainder);
    index = Math.floor(index / base);
  }

  return digits;
}

export function fromBaseN(digits: number[], base: number): number {
  let result = 0;
  const length = digits.length;

  for (let i = 0; i < length; i++) {
    const digit = digits[i];
    if (digit === undefined) continue;

    const power = length - 1 - i;
    result += digit * Math.pow(base, power);
  }

  return result;
}
