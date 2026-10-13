export class Gallery {
  constructor(scene, viewport, photos, config, onFocus) {
    this.scene = scene; this.viewport = viewport; this.photos = photos; this.config = config; this.onFocus = onFocus;
    this.cards = []; this.activeIndex = 0; this.previousActive = -1; this.pointer = null; this.lastX = 0; this.lastY = 0; this.dragged = 0;
    this.build(); this.bind(); this.layout();
  }
  build() {
    this.scene.innerHTML = '';
    this.photos.slice(0, this.config.imageCount).forEach((photo, index) => {
      const card = document.createElement('button');
      card.className = 'gallery-card'; card.type = 'button';
      card.setAttribute('aria-label', `Open photograph ${index + 1}: ${photo.title}`);
      card.innerHTML = `<img src="${photo.url}" alt="${photo.title}" draggable="false" loading="${index < 4 ? 'eager' : 'lazy'}"><span class="card-label"><span>${photo.title}</span><small>${String(index + 1).padStart(2, '0')}</small></span>`;
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.onFocus(index); } });
      this.scene.append(card); this.cards.push(card);
    });
  }
  layout() {
    const count = this.cards.length;
    const radius = innerWidth < 560 ? Math.min(this.config.radius, 280) : this.config.radius;
    document.documentElement.style.setProperty('--radius', `${radius}px`);
    this.viewport.style.perspective = `${this.config.perspective}px`;
    this.cards.forEach((card, i) => { card.style.transform = `rotateY(${i * 360 / count}deg) translateZ(${radius}px)`; });
  }
  render(rotation, tilt) {
    this.scene.style.transform = `rotateX(${tilt}deg) rotateY(${rotation}deg)`;
    const step = 360 / this.cards.length;
    const normalized = ((-rotation % 360) + 360) % 360;
    this.activeIndex = Math.round(normalized / step) % this.cards.length;
    if (this.activeIndex !== this.previousActive) { this.previousActive = this.activeIndex; this.onActiveChange?.(this.activeIndex); }
    this.cards.forEach((card, i) => {
      const delta = Math.abs((((i * step + rotation + 180) % 360) + 360) % 360 - 180);
      card.dataset.active = String(i === this.activeIndex);
      card.style.opacity = String(Math.max(.2, 1 - delta / 230));
      card.style.filter = `brightness(${Math.max(.38, 1 - delta / 260)}) saturate(${Math.max(.55, 1 - delta / 350)})`;
      card.style.zIndex = String(100 - Math.round(delta));
    });
  }
  bind() {
    this.viewport.addEventListener('pointerdown', e => { this.pointer = e.pointerId; this.lastX = e.clientX; this.lastY = e.clientY; this.dragged = 0; this.viewport.setPointerCapture(e.pointerId); this.onDragStart?.(); });
    this.viewport.addEventListener('pointermove', e => { if (e.pointerId !== this.pointer) return; const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY; this.dragged += Math.abs(dx) + Math.abs(dy); this.lastX = e.clientX; this.lastY = e.clientY; this.onDrag?.(dx, dy); });
    const end = e => { if (e.pointerId !== this.pointer) return; const isTap = this.dragged < 5; this.pointer = null; this.onDragEnd?.(); if (isTap) this.onTap?.(this.activeIndex); };
    this.viewport.addEventListener('pointerup', end); this.viewport.addEventListener('pointercancel', end);
    window.addEventListener('resize', () => this.layout());
  }
}
