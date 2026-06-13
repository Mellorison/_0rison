export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function sign(v) {
  return v < 0 ? -1 : v > 0 ? 1 : 0;
}
