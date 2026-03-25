import { BirdType, BirdConfig } from './types';

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 15;
export const GROUND_Y = 550;

export const BIRD_TYPES: Record<BirdType, BirdConfig> = {
  normal: {
    color: '#00E0FF',
    power: 1,
    radius: 18,
    mass: 1,
    label: 'Normal',
    description: 'Standard bird, balanced power.'
  },
  heavy: {
    color: '#444444',
    power: 1.8,
    radius: 24,
    mass: 2.5,
    label: 'Heavy',
    description: 'Slower but hits with massive force.'
  },
  explosive: {
    color: '#FF4444',
    power: 1.2,
    radius: 20,
    mass: 1.2,
    label: 'Explosive',
    description: 'Detonates on impact or after a short delay.'
  }
};

export const INITIAL_SHOTS = 5;

export interface LevelDefinition {
  enemies: { x: number; y: number; r: number }[];
  blocks: { x: number; y: number; w: number; h: number; color: string }[];
}

export const LEVELS: LevelDefinition[] = [
  {
    enemies: [
      { x: 700, y: 520, r: 18 },
      { x: 750, y: 520, r: 18 },
      { x: 800, y: 520, r: 18 }
    ],
    blocks: [
      { x: 650, y: 500, w: 20, h: 100, color: '#A0522D' },
      { x: 850, y: 500, w: 20, h: 100, color: '#A0522D' },
      { x: 750, y: 400, w: 200, h: 20, color: '#A0522D' }
    ]
  },
  {
    enemies: [
      { x: 700, y: 400, r: 20 },
      { x: 750, y: 300, r: 15 },
      { x: 800, y: 400, r: 20 }
    ],
    blocks: [
      { x: 680, y: 450, w: 150, h: 20, color: '#808080' },
      { x: 720, y: 350, w: 80, h: 20, color: '#808080' },
      { x: 650, y: 500, w: 20, h: 100, color: '#A0522D' },
      { x: 850, y: 500, w: 20, h: 100, color: '#A0522D' }
    ]
  }
];
