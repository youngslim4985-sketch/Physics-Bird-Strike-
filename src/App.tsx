/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { BirdType, GameState, GameMode, PlaceType } from './types';
import { BIRD_TYPES, LEVELS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Bomb, 
  Target, 
  Trophy, 
  RotateCcw, 
  Info,
  Gamepad2,
  ChevronRight,
  ChevronLeft,
  Wrench,
  Play as PlayIcon,
  Plus,
  Box,
  Save,
  Trash2
} from 'lucide-react';

export default function App() {
  const [currentBirdType, setCurrentBirdType] = useState<BirdType>('normal');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [mode, setMode] = useState<GameMode>('play');
  const [placeType, setPlaceType] = useState<PlaceType | null>(null);
  const gameCanvasRef = useRef<GameCanvasHandle>(null);

  useEffect(() => {
    const savedScore = localStorage.getItem('physics-bird-highscore');
    if (savedScore) setHighScore(parseInt(savedScore));
  }, []);

  const handleGameStateChange = (state: GameState) => {
    setGameState(state);
    if (state.status === 'won') {
      const newScore = (state.score || 0) + (state.shotsLeft * 100);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('physics-bird-highscore', newScore.toString());
      }
    }
  };

  const nextLevel = () => {
    setLevelIndex((prev) => (prev + 1) % LEVELS.length);
  };

  const prevLevel = () => {
    setLevelIndex((prev) => (prev - 1 + LEVELS.length) % LEVELS.length);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#00E0FF] selection:text-black">
      {/* Header */}
      <header className="border-b-2 border-[#141414] p-6 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <div className="bg-[#141414] text-white p-2 rounded-lg">
            <Gamepad2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Bird Strike</h1>
            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Physics Destruction Engine</p>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">High Score</p>
            <p className="text-2xl font-black tracking-tighter">{highScore.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Current Level</p>
            <p className="text-2xl font-black tracking-tighter">{levelIndex + 1}</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Game Area */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 mb-2">
            <button 
              onClick={() => setMode('play')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-tight border-2 border-[#141414] transition-all ${mode === 'play' ? 'bg-[#141414] text-white' : 'bg-white hover:bg-[#F5F5F5]'}`}
            >
              <PlayIcon size={18} />
              Play Mode
            </button>
            <button 
              onClick={() => setMode('edit')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-tight border-2 border-[#141414] transition-all ${mode === 'edit' ? 'bg-[#141414] text-white' : 'bg-white hover:bg-[#F5F5F5]'}`}
            >
              <Wrench size={18} />
              Edit Mode
            </button>
          </div>

          <div className="relative group">
            <GameCanvas 
              ref={gameCanvasRef}
              currentBirdType={currentBirdType}
              onGameStateChange={handleGameStateChange}
              levelIndex={levelIndex}
              onLevelComplete={nextLevel}
              mode={mode}
              placeType={placeType}
            />
          </div>

          {/* Level Selector */}
          <div className="flex items-center justify-between bg-white border-2 border-[#141414] p-4 rounded-2xl shadow-[4px_4px_0px_0px_#141414]">
            <button 
              onClick={prevLevel}
              className="p-2 hover:bg-[#E4E3E0] rounded-xl transition-colors border-2 border-transparent hover:border-[#141414]"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex gap-2">
              {LEVELS.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-3 h-3 rounded-full border-2 border-[#141414] transition-all ${idx === levelIndex ? 'bg-[#141414] w-8' : 'bg-transparent'}`}
                />
              ))}
            </div>
            <button 
              onClick={nextLevel}
              className="p-2 hover:bg-[#E4E3E0] rounded-xl transition-colors border-2 border-transparent hover:border-[#141414]"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Sidebar Controls */}
        <aside className="flex flex-col gap-6">
          {mode === 'play' ? (
            <section className="bg-white border-2 border-[#141414] p-6 rounded-2xl shadow-[4px_4px_0px_0px_#141414]">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap size={14} />
                Select Bird
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(BIRD_TYPES) as BirdType[]).map((type) => {
                  const config = BIRD_TYPES[type];
                  const isActive = currentBirdType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setCurrentBirdType(type)}
                      className={`
                        group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${isActive 
                          ? 'bg-[#141414] border-[#141414] text-white translate-x-1' 
                          : 'bg-white border-[#141414] hover:bg-[#F5F5F5] hover:-translate-y-0.5'}
                      `}
                    >
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isActive ? 'transparent' : config.color }}
                      >
                        {type === 'explosive' && <Bomb size={20} />}
                        {type === 'heavy' && <Target size={20} />}
                        {type === 'normal' && <Zap size={20} />}
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-tight leading-none mb-1">{config.label}</p>
                        <p className={`text-[10px] font-bold opacity-60 leading-tight ${isActive ? 'text-white/70' : 'text-[#141414]/70'}`}>
                          {config.description}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div 
                          layoutId="active-bird"
                          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#00E0FF] rotate-45 border-2 border-[#141414]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="bg-white border-2 border-[#141414] p-6 rounded-2xl shadow-[4px_4px_0px_0px_#141414]">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Wrench size={14} />
                Editor Tools
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setPlaceType('enemy')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${placeType === 'enemy' ? 'bg-[#141414] text-white' : 'bg-white border-[#141414]'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF5C5C] border-2 border-[#141414] flex items-center justify-center">
                    <Plus size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight leading-none mb-1">Add Enemy</p>
                    <p className="text-[10px] font-bold opacity-60">Click to place enemies</p>
                  </div>
                </button>
                <button
                  onClick={() => setPlaceType('block')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${placeType === 'block' ? 'bg-[#141414] text-white' : 'bg-white border-[#141414]'}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#A0522D] border-2 border-[#141414] flex items-center justify-center">
                    <Box size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight leading-none mb-1">Add Block</p>
                    <p className="text-[10px] font-bold opacity-60">Click to place blocks</p>
                  </div>
                </button>
                <div className="h-px bg-[#141414]/10 my-2" />
                <button
                  onClick={() => {
                    gameCanvasRef.current?.saveLevel();
                  }}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-[#141414] bg-[#00E0FF] font-black uppercase tracking-tight hover:bg-[#00C0DD] transition-all"
                >
                  <Save size={18} />
                  Save Level
                </button>
              </div>
              <p className="mt-4 text-[10px] font-bold text-slate-500 flex items-center gap-2">
                <Trash2 size={12} />
                Right-click to delete objects
              </p>
            </section>
          )}

          <section className="bg-[#141414] text-white p-6 rounded-2xl shadow-[4px_4px_0px_0px_#00E0FF]">
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-[#00E0FF]">
              <Info size={14} />
              How to Play
            </h3>
            <ul className="text-xs space-y-3 font-bold opacity-80">
              <li className="flex gap-3">
                <span className="text-[#00E0FF]">01</span>
                Drag the bird back to aim and set power.
              </li>
              <li className="flex gap-3">
                <span className="text-[#00E0FF]">02</span>
                Release to launch and strike the targets.
              </li>
              <li className="flex gap-3">
                <span className="text-[#00E0FF]">03</span>
                Switch birds to use different abilities.
              </li>
              <li className="flex gap-3">
                <span className="text-[#00E0FF]">04</span>
                Clear all enemies to win the level!
              </li>
            </ul>
          </section>

          <div className="mt-auto pt-4 flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <RotateCcw size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Reset Progress</span>
          </div>
        </aside>
      </main>

      {/* Footer Micro-details */}
      <footer className="max-w-[1200px] mx-auto p-8 border-t border-[#141414]/10 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
        <div>© 2026 Physics Bird Strike</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#00E0FF] transition-colors">Github</a>
          <a href="#" className="hover:text-[#00E0FF] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#00E0FF] transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
