"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Crop,
  Download,
  Check,
  X,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Grid3X3,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export type PresetKey = "portrait" | "square" | "standard" | "landscape";
export type FitBackgroundStyle = "blur" | "solid";

export interface CropPreset {
  key: PresetKey;
  label: string;
  width: number;
  height: number;
  ratioLabel: string;
  recommended?: boolean;
}

export const POST_CROP_PRESETS: CropPreset[] = [
  {
    key: "portrait",
    label: "Portrait",
    width: 1080,
    height: 1350,
    ratioLabel: "4:5",
    recommended: true,
  },
  {
    key: "square",
    label: "Square",
    width: 1080,
    height: 1080,
    ratioLabel: "1:1",
  },
  {
    key: "standard",
    label: "Standard",
    width: 1080,
    height: 810,
    ratioLabel: "4:3",
  },
  {
    key: "landscape",
    label: "Landscape",
    width: 1080,
    height: 566,
    ratioLabel: "1.91:1",
  },
];

const SOLID_BG_SWATCHES = [
  { label: "White", value: "#ffffff" },
  { label: "Warm Cream", value: "#f5f2ed" },
  { label: "Charcoal", value: "#1b1613" },
  { label: "Black", value: "#000000" },
];

interface ImageResizeCropModalProps {
  imageSrc: string;
  stepLabel?: string;
  onCancel: () => void;
  onApply: (exportedDataUrl: string, preset: CropPreset) => void;
}

export function ImageResizeCropModal({
  imageSrc,
  stepLabel,
  onCancel,
  onApply,
}: ImageResizeCropModalProps) {
  const [selectedPresetKey, setSelectedPresetKey] = useState<PresetKey>("portrait");
  const [fitMode, setFitMode] = useState(false);
  const [fitBgStyle, setFitBgStyle] = useState<FitBackgroundStyle>("blur");
  const [solidBgColor, setSolidBgColor] = useState("#1b1613");
  const [showGridOverlay, setShowGridOverlay] = useState(true);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const [frameSize, setFrameSize] = useState({ w: 320, h: 400 });

  const preset = useMemo(
    () => POST_CROP_PRESETS.find((p) => p.key === selectedPresetKey) ?? POST_CROP_PRESETS[0],
    [selectedPresetKey]
  );

  // Measure preview container whenever preset changes or window resizes
  useEffect(() => {
    const updateSize = () => {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize({ w: rect.width, h: rect.height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [selectedPresetKey]);

  // Reset pan/zoom when preset or fit mode changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [selectedPresetKey, fitMode]);

  // Load natural dimensions of uploaded image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Effective image dimensions accounting for 90°/270° rotation
  const effectiveSize = useMemo(() => {
    if (!naturalSize) return null;
    const swapped = rotation % 180 !== 0;
    return swapped
      ? { w: naturalSize.h, h: naturalSize.w }
      : { w: naturalSize.w, h: naturalSize.h };
  }, [naturalSize, rotation]);

  // Compute rendered image dimensions inside the preview frame at zoom = 1
  const baseRender = useMemo(() => {
    if (!effectiveSize) return { w: frameSize.w, h: frameSize.h };
    const imgRatio = effectiveSize.w / effectiveSize.h;
    const frameRatio = frameSize.w / frameSize.h;

    if (fitMode) {
      // Contain: whole image fits inside frame
      if (imgRatio > frameRatio) {
        return { w: frameSize.w, h: frameSize.w / imgRatio };
      }
      return { w: frameSize.h * imgRatio, h: frameSize.h };
    }

    // Cover: image completely fills the locked aspect-ratio frame
    if (imgRatio > frameRatio) {
      return { w: frameSize.h * imgRatio, h: frameSize.h };
    }
    return { w: frameSize.w, h: frameSize.w / imgRatio };
  }, [effectiveSize, frameSize, fitMode]);

  const clampOffset = (nextX: number, nextY: number, currentZoom: number) => {
    const scaledW = baseRender.w * currentZoom;
    const scaledH = baseRender.h * currentZoom;
    const maxX = Math.max(0, (scaledW - frameSize.w) / 2);
    const maxY = Math.max(0, (scaledH - frameSize.h) / 2);

    if (fitMode) {
      // Allow gentle repositioning within the frame in fit mode
      const fitMaxX = Math.max(maxX, Math.abs(frameSize.w - scaledW) / 2);
      const fitMaxY = Math.max(maxY, Math.abs(frameSize.h - scaledH) / 2);
      return {
        x: Math.max(-fitMaxX, Math.min(fitMaxX, nextX)),
        y: Math.max(-fitMaxY, Math.min(fitMaxY, nextY)),
      };
    }

    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setOffset(
      clampOffset(
        dragStartRef.current.startX + dx,
        dragStartRef.current.startY + dy,
        zoom
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(false);
      dragStartRef.current = null;
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, nextZoom));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoomChange(zoom + delta);
  };

  const handleRotate = (deltaDeg: number) => {
    setRotation((prev) => (prev + deltaDeg + 360) % 360);
    setOffset({ x: 0, y: 0 });
  };

  const drawRotatedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cx: number,
    cy: number,
    drawW: number,
    drawH: number,
    deg: number
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);
    const swapped = deg % 180 !== 0;
    const w = swapped ? drawH : drawW;
    const h = swapped ? drawW : drawH;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  const renderExportDataUrl = async (): Promise<string> => {
    const img = imgRef.current;
    if (!img || !effectiveSize) throw new Error("Image is still loading.");

    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable.");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw background when in Fit mode
    if (fitMode) {
      if (fitBgStyle === "blur") {
        // Cover-fill with blurred version of the image
        const imgRatio = effectiveSize.w / effectiveSize.h;
        const targetRatio = preset.width / preset.height;
        let bgW = preset.width;
        let bgH = preset.height;
        if (imgRatio > targetRatio) {
          bgW = preset.height * imgRatio;
        } else {
          bgH = preset.width / imgRatio;
        }

        ctx.save();
        ctx.filter = "blur(40px) brightness(0.85)";
        // Slightly overscale so blur edges never show transparent borders
        const overscale = 1.12;
        drawRotatedImage(
          ctx,
          img,
          preset.width / 2,
          preset.height / 2,
          bgW * overscale,
          bgH * overscale,
          rotation
        );
        ctx.restore();
      } else {
        ctx.fillStyle = solidBgColor;
        ctx.fillRect(0, 0, preset.width, preset.height);
      }
    } else {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, preset.width, preset.height);
    }

    // Scale preview coordinates to exact target pixel dimensions
    const scaleX = preset.width / frameSize.w;
    const scaleY = preset.height / frameSize.h;
    const drawW = baseRender.w * zoom * scaleX;
    const drawH = baseRender.h * zoom * scaleY;
    const cx = preset.width / 2 + offset.x * scaleX;
    const cy = preset.height / 2 + offset.y * scaleY;

    drawRotatedImage(ctx, img, cx, cy, drawW, drawH, rotation);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleDownload = async () => {
    try {
      setExporting(true);
      const dataUrl = await renderExportDataUrl();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `icpep-post-${preset.width}x${preset.height}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  };

  const handleApply = async () => {
    try {
      setExporting(true);
      const dataUrl = await renderExportDataUrl();
      onApply(dataUrl, preset);
    } finally {
      setExporting(false);
    }
  };

  // Preview box dimensions constrained to fit modal nicely while keeping exact aspect ratio
  const previewBoxStyle = useMemo(() => {
    const ratio = preset.width / preset.height;
    if (ratio < 1) {
      // Portrait 4:5
      return { width: "min(100%, 300px)", aspectRatio: `${preset.width} / ${preset.height}` };
    }
    if (ratio === 1) {
      // Square 1:1
      return { width: "min(100%, 340px)", aspectRatio: "1 / 1" };
    }
    // Landscape 1.91:1
    return { width: "min(100%, 440px)", aspectRatio: `${preset.width} / ${preset.height}` };
  }, [preset]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 text-[#0a7db0]">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#1b1613]">Post Resize &amp; Crop</h3>
                {stepLabel && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-[#0a7db0]">
                    {stepLabel}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-500">
                Frame your image and export at exact {preset.width} × {preset.height} px dimensions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#8c8785] hover:text-[#1b1613] p-1 rounded-lg hover:bg-surface-50 cursor-pointer"
            aria-label="Close resize and crop"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {POST_CROP_PRESETS.map((p) => {
            const active = p.key === selectedPresetKey;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPresetKey(p.key)}
                className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? "border-cyan-500 bg-cyan-50/70 ring-1 ring-cyan-500"
                    : "border-[#e0dedb] bg-white hover:bg-surface-50"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-[#1b1613]">
                    {p.label} ({p.ratioLabel})
                  </span>
                  {p.recommended && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500 text-white">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-500 mt-0.5 font-medium">
                  {p.width} × {p.height} px
                </p>
              </button>
            );
          })}
        </div>

        {/* Helper Note */}
        <div className="flex items-start gap-2.5 rounded-xl bg-cyan-50/60 border border-[#D4EEF8] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-[#2c4a57]">
          <Info className="w-4 h-4 text-[#0a7db0] shrink-0 mt-0.5" />
          <p>
            The recommended Instagram post size in 2026 is 1080 × 1350 px (4:5 portrait), which offers the best feed visibility and works well with Instagram’s 3:4 grid crop. Feed posts also support 1080 × 1080 px (square) and 1080 × 566 px (landscape).
          </p>
        </div>

        {/* Interactive Crop / Fit Canvas */}
        <div className="flex flex-col items-center justify-center bg-[#f6f4f1] rounded-2xl p-4 border border-[#e6e3de]">
          <div
            ref={frameRef}
            style={previewBoxStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`relative overflow-hidden rounded-xl border-2 border-cyan-500/80 shadow-md select-none touch-none ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {/* Background layer in Fit mode */}
            {fitMode ? (
              fitBgStyle === "blur" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{
                      transform: `rotate(${rotation}deg) scale(1.2)`,
                    }}
                    className="absolute inset-0 w-full h-full object-cover blur-xl brightness-90 pointer-events-none"
                  />
                </>
              ) : (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: solidBgColor }}
                />
              )
            ) : (
              <div className="absolute inset-0 bg-black pointer-events-none" />
            )}

            {/* Main pannable/zoomable/rotatable image */}
            {naturalSize && (
              <div
                style={{
                  width: `${baseRender.w * zoom}px`,
                  height: `${baseRender.h * zoom}px`,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
                className="absolute pointer-events-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    width:
                      rotation % 180 !== 0
                        ? `${baseRender.h * zoom}px`
                        : `${baseRender.w * zoom}px`,
                    height:
                      rotation % 180 !== 0
                        ? `${baseRender.w * zoom}px`
                        : `${baseRender.h * zoom}px`,
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                  className="absolute max-w-none max-h-none pointer-events-none"
                />
              </div>
            )}

            {/* Subtle rule-of-thirds guide */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-35">
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-white/50" />
              <div className="border-r border-white/50" />
              <div />
            </div>

            {/* 3:4 Grid Safe Zone Overlay (when 4:5 portrait is active) */}
            {selectedPresetKey === "portrait" && showGridOverlay && (
              <div className="absolute inset-0 pointer-events-none flex items-stretch justify-center">
                {/* Left trimmed strip (3.125%) */}
                <div className="w-[3.125%] bg-black/35" />
                {/* Center 3:4 Safe Zone (93.75% width, 100% height) */}
                <div className="w-[93.75%] border-x-2 border-dashed border-amber-300/90 relative">
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-black/65 text-amber-200 text-[10px] font-semibold tracking-wide">
                    3:4 Grid Safe Zone
                  </span>
                </div>
                {/* Right trimmed strip (3.125%) */}
                <div className="w-[3.125%] bg-black/35" />
              </div>
            )}
          </div>

          <p className="text-[11px] text-text-500 mt-2.5">
            Drag to pan · Scroll or use slider to zoom ({Math.round(zoom * 100)}%{rotation > 0 ? ` · ${rotation}°` : ""})
          </p>
        </div>

        {/* Controls: Zoom, Rotate, Fit Toggle, 3:4 Grid Preview Toggle */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <ZoomOut className="w-4 h-4 text-text-500 shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.02}
                value={zoom}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
                aria-label="Zoom level"
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-text-500 shrink-0" />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRotate(-90)}
                title="Rotate left 90°"
                aria-label="Rotate left 90 degrees"
                className="px-2.5 py-1.5 rounded-lg border border-[#e0dedb] text-xs font-medium text-[#45403d] hover:bg-surface-50 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                -90°
              </button>
              <button
                type="button"
                onClick={() => handleRotate(90)}
                title="Rotate right 90°"
                aria-label="Rotate right 90 degrees"
                className="px-2.5 py-1.5 rounded-lg border border-[#e0dedb] text-xs font-medium text-[#45403d] hover:bg-surface-50 flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                +90°
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                  setRotation(0);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[#e0dedb] text-xs font-medium text-[#45403d] hover:bg-surface-50 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            {/* Fit with blurred/solid background toggle */}
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#45403d] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fitMode}
                onChange={(e) => setFitMode(e.target.checked)}
                className="rounded border-[#e0dedb] text-cyan-600 cursor-pointer"
              />
              <Maximize2 className="w-3.5 h-3.5 text-cyan-600" />
              Fit with blurred/solid background
            </label>

            {/* 3:4 Grid Preview Toggle (only for 4:5 portrait) */}
            {selectedPresetKey === "portrait" && (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#45403d] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGridOverlay}
                  onChange={(e) => setShowGridOverlay(e.target.checked)}
                  className="rounded border-[#e0dedb] text-cyan-600 cursor-pointer"
                />
                <Grid3X3 className="w-3.5 h-3.5 text-amber-600" />
                3:4 Grid Preview
              </label>
            )}
          </div>

          {/* Background style options when Fit mode is enabled */}
          {fitMode && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-50 border border-[#e6e3de] px-3 py-2">
              <span className="text-[11px] font-semibold text-[#45403d]">Background:</span>
              <button
                type="button"
                onClick={() => setFitBgStyle("blur")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  fitBgStyle === "blur"
                    ? "bg-cyan-500 text-white"
                    : "bg-white border border-[#e0dedb] text-[#45403d]"
                }`}
              >
                Blurred
              </button>
              <button
                type="button"
                onClick={() => setFitBgStyle("solid")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  fitBgStyle === "solid"
                    ? "bg-cyan-500 text-white"
                    : "bg-white border border-[#e0dedb] text-[#45403d]"
                }`}
              >
                Solid
              </button>

              {fitBgStyle === "solid" && (
                <div className="flex items-center gap-1.5 ml-1">
                  {SOLID_BG_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      type="button"
                      title={swatch.label}
                      onClick={() => setSolidBgColor(swatch.value)}
                      style={{ backgroundColor: swatch.value }}
                      className={`w-5 h-5 rounded-full border cursor-pointer ${
                        solidBgColor === swatch.value
                          ? "ring-2 ring-cyan-500 ring-offset-1 border-cyan-600"
                          : "border-[#cfcbc4]"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0eeeb]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={!naturalSize || exporting}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download {preset.width}×{preset.height}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApply}
              isLoading={exporting}
              disabled={!naturalSize}
              className="font-bold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Export &amp; Use Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
