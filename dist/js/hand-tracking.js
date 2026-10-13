import { recognizeGesture, palmCenter } from './gestures.js';

export class HandTracker {
  constructor(video, canvas, config, callbacks = {}) {
    this.video = video; this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.config = config; this.callbacks = callbacks;
    this.landmarker = null; this.stream = null; this.running = false; this.lastVideoTime = -1; this.lastDetect = 0; this.frames = 0; this.fpsAt = performance.now();
  }
  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is unavailable in this browser.');
    this.callbacks.onStatus?.('loading');
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } }, audio: false });
    this.video.srcObject = this.stream; await this.video.play(); this.resizeCanvas();
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm');
    const fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', delegate: 'GPU' },
      runningMode: 'VIDEO', numHands: 1,
      minHandDetectionConfidence: this.config.tracking.detectionConfidence,
      minTrackingConfidence: this.config.tracking.trackingConfidence,
      minHandPresenceConfidence: this.config.tracking.detectionConfidence,
    });
    this.running = true; this.callbacks.onStatus?.('active'); this.loop();
  }
  resizeCanvas() { this.canvas.width = this.video.videoWidth || 960; this.canvas.height = this.video.videoHeight || 540; }
  loop = () => {
    if (!this.running) return;
    const now = performance.now();
    if (this.video.currentTime !== this.lastVideoTime && now - this.lastDetect > 28) {
      this.lastVideoTime = this.video.currentTime; this.lastDetect = now;
      const result = this.landmarker.detectForVideo(this.video, now); this.handle(result); this.frames++;
      if (now - this.fpsAt > 1000) { this.callbacks.onFps?.(Math.round(this.frames * 1000 / (now - this.fpsAt))); this.frames = 0; this.fpsAt = now; }
    }
    requestAnimationFrame(this.loop);
  };
  handle(result) {
    const points = result.landmarks?.[0]; this.draw(points);
    if (!points) { this.callbacks.onNoHand?.(); return; }
    const center = palmCenter(points); const gesture = recognizeGesture(points, this.config.tracking.gestureThreshold);
    const confidence = result.handedness?.[0]?.[0]?.score ?? 0;
    this.callbacks.onHand?.({ x: center.x, y: center.y, gesture: gesture.name, icon: gesture.icon, confidence });
  }
  draw(points) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height; ctx.clearRect(0, 0, w, h); if (!points) return;
    const links = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
    ctx.strokeStyle = 'rgba(216,255,103,.72)'; ctx.lineWidth = 2; ctx.beginPath(); links.forEach(([a,b]) => { ctx.moveTo(points[a].x*w,points[a].y*h); ctx.lineTo(points[b].x*w,points[b].y*h); }); ctx.stroke();
    ctx.fillStyle = '#d8ff67'; points.forEach(p => { ctx.beginPath(); ctx.arc(p.x*w,p.y*h,3,0,Math.PI*2); ctx.fill(); });
  }
  stop() { this.running = false; this.landmarker?.close(); this.landmarker = null; this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.video.srcObject = null; this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); this.callbacks.onStatus?.('idle'); }
}
