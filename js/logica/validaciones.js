// Valida números móviles y fijos de Chile, escritos con o sin el prefijo +56.
export function isValidChileanPhone(value) {
  if (typeof value !== 'string') return false;
  const phone = value.trim();
  if (!phone) return true;
  if (!/^[+\d\s().-]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) {
    if (!digits.startsWith('56')) return false;
    const national = digits.slice(2);
    return national.length === 9 && /^[2-9]\d{8}$/.test(national);
  }
  return digits.length === 9 && /^[2-9]\d{8}$/.test(digits);
}
