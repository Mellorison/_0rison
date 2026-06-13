export function aabbIntersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function resolveAabbVsSolids(mover, solids) {
  let onGround = false;

  mover.x += mover.vx;
  for (const s of solids) {
    if (!aabbIntersects(mover, s)) continue;
    if (mover.vx > 0) mover.x = s.x - mover.w;
    else if (mover.vx < 0) mover.x = s.x + s.w;
    mover.vx = 0;
  }

  mover.y += mover.vy;
  for (const s of solids) {
    if (!aabbIntersects(mover, s)) continue;

    if (mover.vy > 0) {
      mover.y = s.y - mover.h;
      onGround = true;
    } else if (mover.vy < 0) {
      mover.y = s.y + s.h;
    }

    mover.vy = 0;
  }

  return { onGround };
}
