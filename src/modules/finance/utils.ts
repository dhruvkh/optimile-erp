// Finance module utility functions

export const formatINR = (amount: number) =>
  amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatCompactINR = (amount: number) =>
  Intl.NumberFormat('en-IN', { notation: "compact", style: "currency", currency: "INR" }).format(amount);

// Convert a number to Indian-English words (e.g. 1110 → "Rupees One Thousand One Hundred Ten Only")
export const numberToWords = (n: number): string => {
  if (n === 0) return 'Rupees Zero Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (num: number): string => {
    if (num < 20) return ones[num];
    return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  };

  const threeDigits = (num: number): string => {
    if (num < 100) return twoDigits(num);
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + twoDigits(num % 100) : '');
  };

  const intPart = Math.floor(Math.abs(n));
  const decPart = Math.round((Math.abs(n) - intPart) * 100);

  let result = '';
  let rem = intPart;

  const crore = Math.floor(rem / 10000000); rem %= 10000000;
  const lakh  = Math.floor(rem / 100000);   rem %= 100000;
  const thousand = Math.floor(rem / 1000);  rem %= 1000;
  const hundred = rem;

  if (crore)    result += threeDigits(crore)    + ' Crore ';
  if (lakh)     result += threeDigits(lakh)     + ' Lakh ';
  if (thousand) result += threeDigits(thousand) + ' Thousand ';
  if (hundred)  result += threeDigits(hundred);

  let words = 'Rupees ' + result.trim();
  if (decPart > 0) words += ' and ' + twoDigits(decPart) + ' Paise';
  return words + ' Only';
};
