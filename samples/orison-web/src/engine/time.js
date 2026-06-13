export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function nowMs() {
  return performance.now();
}
