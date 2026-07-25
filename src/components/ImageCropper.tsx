/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, Move, Check, X, RotateCw, Sparkles } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'sepia' | 'warm' | 'cool' | 'bright'>('none');
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Reset values when a new image is loaded
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFilter('none');
  }, [imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyCrop = () => {
    if (!imageRef.current || imgSize.w === 0 || imgSize.h === 0) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background white in case of transparent PNGs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);

      // Apply Filter
      if (filter === 'grayscale') {
        ctx.filter = 'grayscale(100%)';
      } else if (filter === 'sepia') {
        ctx.filter = 'sepia(80%)';
      } else if (filter === 'warm') {
        ctx.filter = 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
      } else if (filter === 'cool') {
        ctx.filter = 'saturate(110%) hue-rotate(15deg) brightness(105%)';
      } else if (filter === 'bright') {
        ctx.filter = 'brightness(120%) contrast(105%)';
      } else {
        ctx.filter = 'none';
      }

      // Translate to canvas center
      ctx.translate(150, 150);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Base scale to cover the 300x300 area
      const baseScale = Math.max(300 / imgSize.w, 300 / imgSize.h);
      const drawW = imgSize.w * baseScale * zoom;
      const drawH = imgSize.h * baseScale * zoom;
      
      // Calculate coordinates to match visual alignment
      const scaleFactor = 300 / 250;
      const x = -drawW / 2 + offset.x * scaleFactor;
      const y = -drawH / 2 + offset.y * scaleFactor;

      ctx.drawImage(img, x, y, drawW, drawH);

      try {
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCrop(croppedDataUrl);
      } catch (err) {
        console.error('Error generating cropped image:', err);
      }
    }
  };

  // Helper to get preview inline style filter
  const getFilterStyle = () => {
    if (filter === 'grayscale') return 'grayscale(100%)';
    if (filter === 'sepia') return 'sepia(80%)';
    if (filter === 'warm') return 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
    if (filter === 'cool') return 'saturate(110%) hue-rotate(15deg) brightness(105%)';
    if (filter === 'bright') return 'brightness(120%) contrast(105%)';
    return 'none';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-base text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Editor de Imagen de Perfil
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-gray-150 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Window Container */}
        <div className="relative flex justify-center items-center my-4">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="relative w-[250px] h-[250px] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 cursor-move select-none"
          >
            {/* Visual crop guide circle */}
            <div className="absolute inset-0 z-10 pointer-events-none border-2 border-dashed border-indigo-500/80 rounded-full ring-[999px] ring-zinc-950/40" />

            {/* Behind the mask: Zoomed/Panned Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Para recortar"
                onLoad={handleImageLoad}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: getFilterStyle(),
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                className="select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-600 dark:accent-indigo-500 h-1 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
          </div>

          {/* Quick Editing Actions: Rotation & Filters */}
          <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-zinc-850 p-2 rounded-2xl border border-gray-100 dark:border-zinc-800/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 pl-1 font-mono">Girar:</span>
            <button
              onClick={handleRotate}
              className="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-gray-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-900 rounded-xl flex items-center gap-1.5 text-[11px] font-bold transition-all shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>90° Derecha</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-mono">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Filtros de Edición Rápida:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(['none', 'grayscale', 'sepia', 'warm', 'cool', 'bright'] as const).map((f) => {
                const labels: Record<string, string> = {
                  none: 'Normal',
                  grayscale: 'B&N',
                  sepia: 'Retro',
                  warm: 'Cálido',
                  cool: 'Frío',
                  bright: 'Brillo'
                };
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                      active
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-750 hover:bg-gray-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-center text-gray-400 dark:text-zinc-500 flex items-center justify-center gap-1.5 font-medium">
            <Move className="w-3.5 h-3.5 text-indigo-500" />
            Arrastra la foto para encuadrarla perfectamente
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={onCancel}
              className="flex-1 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyCrop}
              className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-50 dark:hover:bg-indigo-600 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar Foto
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
