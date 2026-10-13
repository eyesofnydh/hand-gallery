const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export class InteractionController {
  constructor(config) {
    this.config = config;
    this.rotation = 0;
    this.tilt = 0;
    this.speed = 0.035;
    this.targetSpeed = 0.035;
    this.targetTilt = 0;
    this.handX = null;
    this.handY = null;
    this.gesture = 'NO HAND';
    this.candidate = 'NO HAND';
    this.candidateFrames = 0;
    this.dragging = false;
    this.snapTarget = null;
    this.lastPinchAt = 0;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  updateHand({ x, y, gesture }) {
    this.snapTarget = null;
    const cfg = this.config;
    const px = cfg.tracking.mirrorInput ? 1 - x : x;
    this.handX = this.handX == null ? px : lerp(this.handX, px, .22);
    this.handY = this.handY == null ? y : lerp(this.handY, y, .22);
    if (gesture !== this.candidate) { this.candidate = gesture; this.candidateFrames = 1; }
    else this.candidateFrames++;
    if (this.candidateFrames >= 3) this.gesture = gesture;
    if (this.gesture === 'FIST') this.targetSpeed = 0;
    if (this.gesture === 'PALM') {
      let horizontal = this.handX - .5;
      if (Math.abs(horizontal) < cfg.tracking.deadZone) horizontal = 0;
      else horizontal = (Math.abs(horizontal) - cfg.tracking.deadZone) * Math.sign(horizontal) / (.5 - cfg.tracking.deadZone);
      const directional = horizontal * cfg.rotation.maxSpeed * cfg.rotation.sensitivity;
      this.targetSpeed = horizontal === 0 ? cfg.rotation.baseSpeed : directional;
      const vertical = clamp((.5 - this.handY) * 2 * cfg.tilt.sensitivity, -1, 1);
      this.targetTilt = vertical >= 0 ? vertical * cfg.tilt.max : vertical * Math.abs(cfg.tilt.min);
    }
  }
  noHand() { this.gesture = 'NO HAND'; this.candidate = 'NO HAND'; this.candidateFrames = 0; this.handX = this.handY = null; this.targetSpeed = 0; }
  drag(dx, dy) { this.snapTarget = null; this.rotation += dx * .18; this.targetSpeed = dx * .025; this.targetTilt = clamp(this.targetTilt - dy * .16, this.config.tilt.min, this.config.tilt.max); }
  nudge(rotation, tilt = 0) { this.snapTarget = null; this.rotation += rotation; this.targetTilt = clamp(this.targetTilt + tilt, this.config.tilt.min, this.config.tilt.max); }
  snapTo(index, count) { const target = -index * 360 / count; const turns = Math.round((this.rotation - target) / 360); this.snapTarget = target + turns * 360; this.targetSpeed = 0; }
  reset() { this.rotation = 0; this.tilt = 0; this.targetTilt = 0; this.speed = 0; this.targetSpeed = this.config.rotation.baseSpeed; this.snapTarget = null; }
  frame(dt) {
    const rm = this.reducedMotion ? .2 : 1;
    this.speed = lerp(this.speed, this.targetSpeed * rm, this.config.rotation.damping);
    this.tilt = lerp(this.tilt, this.targetTilt, this.config.tilt.damping);
    if (!this.dragging && this.snapTarget != null) { this.rotation = lerp(this.rotation, this.snapTarget, .16); if (Math.abs(this.rotation - this.snapTarget) < .03) { this.rotation = this.snapTarget; this.snapTarget = null; } }
    else if (!this.dragging) this.rotation += this.speed * Math.min(dt, 2);
    return { rotation: this.rotation, tilt: this.tilt, speed: this.speed };
  }
}
