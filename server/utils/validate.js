function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function asInt(v) {
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  return n;
}

function asPositiveInt(v) {
  const n = asInt(v);
  if (n === null || n <= 0) return null;
  return n;
}

function asNonNegativeInt(v) {
  const n = asInt(v);
  if (n === null || n < 0) return null;
  return n;
}

function asMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

module.exports = {
  isNonEmptyString,
  asInt,
  asPositiveInt,
  asNonNegativeInt,
  asMoney
};

