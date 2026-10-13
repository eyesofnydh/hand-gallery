const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

export function recognizeGesture(points, threshold = 0.7) {
  if (!points?.length) return { name: 'NO HAND', icon: '—', pinch: false, openness: 0 };
  const wrist = points[0];
  const pairs = [[8, 6], [12, 10], [16, 14], [20, 18]];
  const fingers = pairs.map(([tip, joint]) => distance(points[tip], wrist) > distance(points[joint], wrist) * (1.08 + (1 - threshold) * 0.18));
  const thumb = distance(points[4], points[5]) > distance(points[3], points[5]) * 1.15;
  const extended = fingers.filter(Boolean).length + Number(thumb);
  const palmScale = Math.max(distance(points[0], points[9]), 0.04);
  const pinchRatio = distance(points[4], points[8]) / palmScale;
  const pinch = pinchRatio < 0.36;
  if (pinch) return { name: 'PINCH', icon: '◎', pinch: true, openness: extended / 5 };
  if (extended >= 4) return { name: 'PALM', icon: '✋', pinch: false, openness: extended / 5 };
  if (extended <= 1) return { name: 'FIST', icon: '✊', pinch: false, openness: extended / 5 };
  return { name: 'TRACKING', icon: '◌', pinch: false, openness: extended / 5 };
}

export function palmCenter(points) {
  const ids = [0, 5, 9, 13, 17];
  return ids.reduce((p, id) => ({ x: p.x + points[id].x / ids.length, y: p.y + points[id].y / ids.length }), { x: 0, y: 0 });
}
