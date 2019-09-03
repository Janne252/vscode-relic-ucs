export function isInteger(value: string) {
    const number = Math.floor(Number(value));
    return number !== Infinity && String(number) === value && number >= 0;
}
