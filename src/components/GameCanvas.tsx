import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Body, checkCollision } from '../lib/physics';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_Y, 
  BIRD_TYPES, 
  LEVELS, 
  INITIAL_SHOTS 
} from '../constants';
import { BirdType, GameState, Particle } from '../types';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Play, ChevronRight, Target, Zap, Bomb } from 'lucide-react';

export interface GameCanvasHandle {
  saveLevel: () => void;
}

interface GameCanvasProps {
  currentBirdType: BirdType;
  onGameStateChange: (state: GameState) => void;
  levelIndex: number;
  onLevelComplete: () => void;
  mode: 'play' | 'edit';
  placeType: 'enemy' | 'block' | null;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ 
  currentBirdType, 
  onGameStateChange, 
  levelIndex,
  onLevelComplete,
  mode,
  placeType
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bodies, setBodies] = useState<Body[]>([]);
  const [shotsLeft, setShotsLeft] = useState(INITIAL_SHOTS);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);

  const bodiesRef = useRef<Body[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const playerRef = useRef<Body | null>(null);

  useImperativeHandle(ref, () => ({
    saveLevel: () => {
      const enemies = bodiesRef.current
        .filter(b => b.tag === 'enemy')
        .map(b => ({ x: b.x, y: b.y, r: b.r }));
      
      const blocks = bodiesRef.current
        .filter(b => b.tag === 'block')
        .map(b => ({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2, color: b.color }));
      
      const levelData = { enemies, blocks };
      console.log('--- SAVED LEVEL DATA ---');
      console.log(JSON.stringify(levelData, null, 2));
      console.log('------------------------');
      alert('Level JSON logged to console! (F12)');
    }
  }));

  const initLevel = useCallback(() => {
    const level = LEVELS[levelIndex % LEVELS.length];
    const newBodies: Body[] = [];

    // Player
    const player = new Body(150, 480, BIRD_TYPES[currentBirdType].radius, BIRD_TYPES[currentBirdType].color, BIRD_TYPES[currentBirdType].mass);
    player.tag = 'player';
    player.isStatic = true;
    newBodies.push(player);
    playerRef.current = player;

    // Enemies
    level.enemies.forEach(e => {
      const enemy = new Body(e.x, e.y, e.r, '#FF5C5C');
      enemy.tag = 'enemy';
      newBodies.push(enemy);
    });

    // Blocks
    level.blocks.forEach(b => {
      const block = new Body(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) / 2, b.color);
      block.tag = 'block';
      // Approximate rectangular blocks as circles for simplicity in this physics engine
      // but we could extend the physics engine for AABB
      newBodies.push(block);
    });

    setBodies(newBodies);
    bodiesRef.current = newBodies;
    setShotsLeft(INITIAL_SHOTS);
    setGameState('playing');
    setIsLaunching(false);
    onGameStateChange({ status: 'playing', shotsLeft: INITIAL_SHOTS, score: 0, currentBirdType });
  }, [levelIndex, currentBirdType, onGameStateChange]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragStart) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [dragStart, mousePos, shotsLeft, currentBirdType]);

  const explode = (x: number, y: number, power: number) => {
    bodiesRef.current.forEach(b => {
      const dx = b.x - x;
      const dy = b.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) * power * 0.5;
        const angle = Math.atan2(dy, dx);
        b.vx += Math.cos(angle) * force;
        b.vy += Math.sin(angle) * force;
        b.isStatic = false;
      }
    });

    // Create explosion particles
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: '#FF8800',
        size: Math.random() * 5 + 2
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    if (mode === 'edit') {
      if (placeType === 'enemy') {
        const enemy = new Body(x, y, 18, '#FF5C5C');
        enemy.tag = 'enemy';
        bodiesRef.current = [...bodiesRef.current, enemy];
        setBodies([...bodiesRef.current]);
      } else if (placeType === 'block') {
        const block = new Body(x, y, 20, '#A0522D');
        block.tag = 'block';
        bodiesRef.current = [...bodiesRef.current, block];
        setBodies([...bodiesRef.current]);
      }
      return;
    }

    if (gameState !== 'playing' || isLaunching) return;
    
    if (playerRef.current && Math.hypot(x - playerRef.current.x, y - playerRef.current.y) < playerRef.current.r * 2) {
      setDragStart({ x: playerRef.current.x, y: playerRef.current.y });
      setMousePos({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    setMousePos({ x, y });
  };

  const handleMouseUp = () => {
    if (!dragStart || !mousePos || shotsLeft <= 0) {
      setDragStart(null);
      setMousePos(null);
      return;
    }

    const dx = dragStart.x - mousePos.x;
    const dy = dragStart.y - mousePos.y;
    const power = Math.min(Math.hypot(dx, dy), 150);
    const angle = Math.atan2(dy, dx);

    if (playerRef.current) {
      playerRef.current.isStatic = false;
      playerRef.current.vx = Math.cos(angle) * power * 0.15 * BIRD_TYPES[currentBirdType].power;
      playerRef.current.vy = Math.sin(angle) * power * 0.15 * BIRD_TYPES[currentBirdType].power;
      
      setShotsLeft(prev => prev - 1);
      setIsLaunching(true);

      if (currentBirdType === 'explosive') {
        setTimeout(() => {
          if (playerRef.current && !playerRef.current.isExploded) {
            explode(playerRef.current.x, playerRef.current.y, 2);
            playerRef.current.isExploded = true;
          }
        }, 1500);
      }
    }

    setDragStart(null);
    setMousePos(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Delete object under cursor
    bodiesRef.current = bodiesRef.current.filter(b => {
      if (b.tag === 'player') return true;
      const dist = Math.hypot(x - b.x, y - b.y);
      return dist > b.r;
    });
    setBodies([...bodiesRef.current]);
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = mode === 'play' ? Math.min((time - lastTime) / 1000, 0.1) : 0;
      lastTime = time;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw background
      ctx.fillStyle = '#FEF9E8';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, GROUND_Y - 5, CANVAS_WIDTH, 10);

      // Update and draw bodies
      const currentBodies = bodiesRef.current;
      for (let i = 0; i < currentBodies.length; i++) {
        const b1 = currentBodies[i];
        b1.update(dt, GROUND_Y);
        
        for (let j = i + 1; j < currentBodies.length; j++) {
          const b2 = currentBodies[j];
          if (checkCollision(b1, b2)) {
            if (currentBirdType === 'explosive' && b1.tag === 'player' && !b1.isExploded) {
              explode(b1.x, b1.y, 2);
              b1.isExploded = true;
            }
          }
        }
        b1.draw(ctx);
      }

      // Slingshot visuals
      if (dragStart && mousePos && playerRef.current) {
        ctx.beginPath();
        ctx.strokeStyle = '#4A2C2A';
        ctx.lineWidth = 4;
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();

        // Trajectory preview
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        let tx = dragStart.x;
        let ty = dragStart.y;
        const dx = dragStart.x - mousePos.x;
        const dy = dragStart.y - mousePos.y;
        const power = Math.min(Math.hypot(dx, dy), 150);
        const angle = Math.atan2(dy, dx);
        let tvx = Math.cos(angle) * power * 0.15 * BIRD_TYPES[currentBirdType].power;
        let tvy = Math.sin(angle) * power * 0.15 * BIRD_TYPES[currentBirdType].power;
        
        for (let i = 0; i < 20; i++) {
          tvy += 15 * 0.1 * 50 * 0.1;
          tx += tvx * 0.1;
          ty += tvy * 0.1;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
          if (ty > GROUND_Y) break;
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.02;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Check win/loss
      const enemies = currentBodies.filter(b => b.tag === 'enemy');
      const isPlayerStopped = playerRef.current && 
        Math.abs(playerRef.current.vx) < 0.2 && 
        Math.abs(playerRef.current.vy) < 0.2;
      
      const isPlayerOffScreen = playerRef.current && (
        playerRef.current.x < -100 || 
        playerRef.current.x > CANVAS_WIDTH + 100 || 
        playerRef.current.y > CANVAS_HEIGHT + 100
      );

      if (enemies.length === 0 && gameState === 'playing') {
        setGameState('won');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else if (shotsLeft === 0 && isLaunching && gameState === 'playing') {
        // Wait for player to stop moving or go off screen
        if (isPlayerStopped || isPlayerOffScreen) {
          if (enemies.length > 0) {
            setGameState('lost');
          }
        }
      }

      // Respawn player if stopped or off screen and shots left
      if (isLaunching && shotsLeft > 0 && playerRef.current && (isPlayerStopped || isPlayerOffScreen)) {
        setIsLaunching(false);
        const newPlayer = new Body(150, 480, BIRD_TYPES[currentBirdType].radius, BIRD_TYPES[currentBirdType].color, BIRD_TYPES[currentBirdType].mass);
        newPlayer.tag = 'player';
        newPlayer.isStatic = true;
        bodiesRef.current = [...bodiesRef.current, newPlayer];
        playerRef.current = newPlayer;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dragStart, mousePos, gameState, shotsLeft, isLaunching, currentBirdType]);

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        className="rounded-2xl shadow-2xl cursor-crosshair touch-none border-4 border-slate-900"
      />

      <AnimatePresence>
        {gameState !== 'playing' && mode === 'play' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border-4 border-slate-900 max-w-sm">
              <h2 className={`text-4xl font-black mb-4 uppercase tracking-tighter ${gameState === 'won' ? 'text-green-600' : 'text-red-600'}`}>
                {gameState === 'won' ? 'Victory!' : 'Defeat!'}
              </h2>
              <p className="text-slate-600 mb-6 font-medium">
                {gameState === 'won' 
                  ? `Level ${levelIndex + 1} cleared with ${shotsLeft} shots remaining!` 
                  : 'You ran out of shots. Try again!'}
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={initLevel}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw size={20} />
                  Retry
                </button>
                {gameState === 'won' && (
                  <button 
                    onClick={onLevelComplete}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-200"
                  >
                    Next Level
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm flex items-center gap-3">
          <Target className="text-slate-500" size={18} />
          <span className="font-black text-slate-900 uppercase tracking-tight">Shots: {shotsLeft}</span>
        </div>
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm flex items-center gap-3">
          <Play className="text-slate-500" size={18} />
          <span className="font-black text-slate-900 uppercase tracking-tight">Level: {levelIndex + 1}</span>
        </div>
      </div>
    </div>
  );
});
