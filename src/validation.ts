export function isInteger(value: string) {
    // Zero prefixes not allowed (just a zero is fine though)
    if (value.length > 1 && value[0] == '0') {
        return false;
    }
    return value.split('').every(char => (char >= '0' && char <= '9'));
}
