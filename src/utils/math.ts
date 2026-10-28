/**
 * Parses user input strings that may contain:
 * - standard decimals: "9.95", "36.55"
 * - grouped thousands: "1,250" -> 1250
 * - scientific notation with e: "3.27e7", "1.634E7"
 * - scientific notation with power: "3.27 × 10⁷", "3.27 x 10^7", "16.34 * 10^6"
 * - unicode superscripts: "10⁷", "10⁶", "10⁻³"
 */
export function parseNumericInput(raw: string): number {
  if (!raw || typeof raw !== 'string') return NaN;
  let str = raw.trim();

  if (str === '') return NaN;

  // Treat grouped thousands with commas as standard numbers (e.g. 1,250 -> 1250)
  str = str.replace(/,/g, '');

  // Superscript map
  const superscripts: Record<string, string> = {
    '⁰': '0',
    '¹': '1',
    '²': '2',
    '³': '3',
    '⁴': '4',
    '⁵': '5',
    '⁶': '6',
    '⁷': '7',
    '⁸': '8',
    '⁹': '9',
    '⁻': '-',
  };

  // Convert "10⁷" or "10⁶" to standard scientific (1e7, 1e6)
  str = str.replace(/10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (_, exp) => {
    const normalExp = exp.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c: string) => superscripts[c] || c);
    return `1e${normalExp}`;
  });

  // Replace remaining superscripts
  str = str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => superscripts[c] || c);

  // Convert A * 1eB or A × 1eB or A x 1eB
  const sciExpMatch = str.match(/^([+-]?[\d.]+)\s*[×xX*]\s*1e([+-]?\d+)$/i);
  if (sciExpMatch) {
    const base = Number(sciExpMatch[1]);
    const exp = parseInt(sciExpMatch[2], 10);
    return base * Math.pow(10, exp);
  }

  // Convert A * 10^B or A × 10^B or A x 10^B
  const powMatch = str.match(/^([+-]?[\d.]+)\s*[×xX*]\s*10\^([+-]?\d+)$/i);
  if (powMatch) {
    const base = Number(powMatch[1]);
    const exp = parseInt(powMatch[2], 10);
    return base * Math.pow(10, exp);
  }

  // Strict fallback using Number() instead of parseFloat
  const num = Number(str);
  return Number.isNaN(num) ? NaN : num;
}

/**
 * Formats seconds into MM:SS
 */
export function formatSecondsToTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
