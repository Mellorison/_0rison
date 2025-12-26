export function createLevel1() {
  const bounds = { w: 1600, h: 900 };

  const solids = [
    { x: 0, y: 820, w: bounds.w, h: 80 },

    { x: 220, y: 720, w: 240, h: 22 },
    { x: 520, y: 640, w: 200, h: 22 },
    { x: 800, y: 560, w: 220, h: 22 },

    { x: 1020, y: 740, w: 280, h: 22 },
    { x: 1280, y: 640, w: 200, h: 22 },

    { x: 340, y: 540, w: 170, h: 22 },
    { x: 140, y: 460, w: 180, h: 22 },
  ];

  const hazards = [
    { x: 650, y: 804, w: 140, h: 16 },
    { x: 1120, y: 804, w: 160, h: 16 },
  ];

  const checkpoint = { x: 980, y: 700, w: 22, h: 60 };
  const twistSwitch = { x: 420, y: 480, w: 28, h: 28 };
  const portal = { x: 1480, y: 760, w: 42, h: 60 };

  const spawn = { x: 80, y: 760 };

  return {
    name: 'Quantum Realm: Cartesian-Twist',
    bounds,
    spawn,
    solids,
    hazards,
    checkpoint,
    twistSwitch,
    portal,
  };
}
