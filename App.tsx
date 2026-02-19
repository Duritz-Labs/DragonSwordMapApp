
import React, { useState, useRef, useEffect, useCallback } from 'react';

// Constants as per request
const MAP_IMAGE_URL = "https://raw.githubusercontent.com/Duritz-Labs/DragonSwordMaps/main/MapData_Relese/DragonSword_Simple.jpg";
const ORIG_WIDTH = 3638;
const ORIG_HEIGHT = 4855;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;

const App: React.FC = () => {
  const [scale, setScale] = useState(0.8); // Initial scale
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Helper to clamp position so the map doesn't leave the viewport
  const clampPosition = useCallback((newX: number, newY: number, currentScale: number) => {
    if (!containerRef.current) return { x: newX, y: newY };

    const { width: vW, height: vH } = containerRef.current.getBoundingClientRect();
    const mapW = ORIG_WIDTH * currentScale;
    const mapH = ORIG_HEIGHT * currentScale;

    let minX = vW - mapW;
    let maxX = 0;
    let minY = vH - mapH;
    let maxY = 0;

    // Adjust if map is smaller than viewport to keep it centered
    if (mapW < vW) {
        minX = (vW - mapW) / 2;
        maxX = minX;
    }
    if (mapH < vH) {
        minY = (vH - mapH) / 2;
        maxY = minY;
    }

    const clampedX = Math.min(Math.max(newX, minX), maxX);
    const clampedY = Math.min(Math.max(newY, minY), maxY);

    return { x: clampedX, y: clampedY };
  }, []);

  // Handle Zoom (Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);
    
    if (newScale === scale) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pointX = (mouseX - position.x) / scale;
    const pointY = (mouseY - position.y) / scale;

    const nextX = mouseX - pointX * newScale;
    const nextY = mouseY - pointY * newScale;

    const clamped = clampPosition(nextX, nextY, newScale);
    setScale(newScale);
    setPosition(clamped);
  };

  // Handle Panning (Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate In-game Coordinates (Bottom-Left is 0,0)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const imgX = (mouseX - position.x) / scale;
    const imgY = (mouseY - position.y) / scale;

    // Map display coordinates
    const displayX = Math.round(imgX);
    const displayY = Math.round(ORIG_HEIGHT - imgY);

    setMouseCoords({
      x: Math.min(Math.max(displayX, 0), ORIG_WIDTH),
      y: Math.min(Math.max(displayY, 0), ORIG_HEIGHT)
    });

    if (!isDragging) return;

    const nextX = e.clientX - dragStart.current.x;
    const nextY = e.clientY - dragStart.current.y;

    setPosition(clampPosition(nextX, nextY, scale));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center map on mount
  useEffect(() => {
    if (containerRef.current) {
        const { width: vW, height: vH } = containerRef.current.getBoundingClientRect();
        const initialScale = 0.8;
        const initialX = (vW - ORIG_WIDTH * initialScale) / 2;
        const initialY = (vH - ORIG_HEIGHT * initialScale) / 2;
        setScale(initialScale);
        setPosition(clampPosition(initialX, initialY, initialScale));
    }
  }, [clampPosition]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#0d0d0d] overflow-hidden cursor-crosshair touch-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar / Header */}
      <div className="absolute top-0 left-0 w-full z-20 pointer-events-none p-4 flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg shadow-xl">
          <h1 className="text-white font-bold tracking-widest text-lg drop-shadow-md">
            <span className="text-blue-400">[MAPS]</span> 드래곤소드
          </h1>
        </div>
      </div>

      {/* Map View */}
      <div 
        ref={mapRef}
        className="absolute transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: ORIG_WIDTH,
          height: ORIG_HEIGHT,
        }}
      >
        <img 
          src={MAP_IMAGE_URL} 
          alt="Dragon Sword Map"
          className="w-full h-full pointer-events-none select-none"
          draggable={false}
          onLoad={() => {
            setPosition(prev => clampPosition(prev.x, prev.y, scale));
          }}
        />
      </div>

      {/* Refined Unified Display (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full shadow-2xl flex items-center gap-5">
          {/* Zoom Section */}
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">Zoom</span>
            <span className="text-white font-mono text-lg leading-none">{Math.round(scale * 100)}%</span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-4 bg-white/20"></div>
          
          {/* Coordinates X Section */}
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">X</span>
            <span className="text-white font-mono text-lg leading-none">{mouseCoords.x.toLocaleString()}</span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/20"></div>

          {/* Coordinates Y Section */}
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">Y</span>
            <span className="text-white font-mono text-lg leading-none">{mouseCoords.y.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Drag Overlay Feedback */}
      {isDragging && (
        <div className="absolute inset-0 z-10 cursor-grabbing bg-transparent" />
      )}
    </div>
  );
};

export default App;
