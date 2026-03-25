export type BirdType = 'normal' | 'heavy' | 'explosive';
export type GameMode = 'play' | 'edit';
export type PlaceType = 'enemy' | 'block';

export interface BirdConfig {
  color: string;
  power: number;
  radius: number;
  mass: number;
  label: string;
  description: string;
}

export interface GameState {
  status: 'playing' | 'won' | 'lost';
  shotsLeft: number;
  score: number;
  currentBirdType: BirdType;
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}
