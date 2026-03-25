import { Point } from '../types';
import { GRAVITY } from '../constants';

export class Body {
  x: number;
  y: number;
  r: number;
  vx: number = 0;
  vy: number = 0;
  color: string;
  tag: string = '';
  mass: number = 1;
  isStatic: boolean = false;
  health: number = 100;
  isExploded: boolean = false;

  constructor(x: number, y: number, r: number, color: string, mass: number = 1) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;
    this.mass = mass;
  }

  update(dt: number, groundY: number) {
    if (this.isStatic) return;

    this.vy += GRAVITY * dt * 50; // Scale gravity for better feel
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Ground collision
    if (this.y + this.r > groundY) {
      this.y = groundY - this.r;
      this.vy *= -0.4; // Bounce
      this.vx *= 0.8;  // Friction
    }

    // Air resistance
    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Add some detail
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes for birds/enemies
    if (this.tag === 'player' || this.tag === 'enemy') {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.x + this.r * 0.4, this.y - this.r * 0.2, this.r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(this.x + this.r * 0.45, this.y - this.r * 0.2, this.r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function checkCollision(b1: Body, b2: Body) {
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = b1.r + b2.r;

  if (distance < minDistance) {
    // Resolve collision
    const angle = Math.atan2(dy, dx);
    const overlap = minDistance - distance;

    if (!b1.isStatic) {
      b1.x -= Math.cos(angle) * overlap * 0.5;
      b1.y -= Math.sin(angle) * overlap * 0.5;
    }
    if (!b2.isStatic) {
      b2.x += Math.cos(angle) * overlap * 0.5;
      b2.y += Math.sin(angle) * overlap * 0.5;
    }

    // Simple elastic collision
    const nx = dx / distance;
    const ny = dy / distance;
    const p = 2 * (b1.vx * nx + b1.vy * ny - b2.vx * nx - b2.vy * ny) / (b1.mass + b2.mass);
    
    if (!b1.isStatic) {
      b1.vx -= p * b2.mass * nx;
      b1.vy -= p * b2.mass * ny;
    }
    if (!b2.isStatic) {
      b2.vx += p * b1.mass * nx;
      b2.vy += p * b1.mass * ny;
    }

    return true;
  }
  return false;
}
