"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
};

function drawRoach(
  context: CanvasRenderingContext2D,
  size: number,
  time: number,
  speed: number,
  angle: number,
) {
  const center = size / 2;
  const bodyWobble = Math.sin(time * 0.18) * (speed * 0.8 + 0.4);
  const legWiggle = Math.sin(time * 1.5) * (speed * 1.5 + 1.2);
  const antennaWiggle = Math.sin(time * 1.2) * (speed * 1.1 + 1.5);

  context.save();
  context.translate(center, center);
  context.rotate(angle + Math.sin(time * 0.08) * 0.03);
  context.translate(bodyWobble * 0.6, 0);

  const shellGradient = context.createLinearGradient(-16, -12, 18, 14);
  shellGradient.addColorStop(0, "#7a5130");
  shellGradient.addColorStop(0.45, "#4d311f");
  shellGradient.addColorStop(1, "#20140e");

  const wingGradient = context.createLinearGradient(-12, -10, 8, 12);
  wingGradient.addColorStop(0, "rgba(248, 228, 198, 0.18)");
  wingGradient.addColorStop(1, "rgba(77, 49, 31, 0.55)");

  context.shadowColor = "rgba(0, 0, 0, 0.28)";
  context.shadowBlur = 10;
  context.shadowOffsetY = 4;

  context.fillStyle = wingGradient;
  context.beginPath();
  context.ellipse(-2, -1, 17, 10, -0.25, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = shellGradient;
  context.beginPath();
  context.ellipse(-8, 0, 17, 11, 0, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(7, 0, 13, 9, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#2a1a12";
  context.beginPath();
  context.ellipse(18, 0, 7, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.shadowColor = "transparent";

  context.strokeStyle = "rgba(18, 11, 8, 0.92)";
  context.lineWidth = 1.4;
  context.lineCap = "round";

  const legOffsets = [-8, 0, 8];
  legOffsets.forEach((offset, index) => {
    const phase = time * 1.35 + index * 0.9;
    const sweep = Math.sin(phase) * (2.5 + speed * 0.8);

    context.beginPath();
    context.moveTo(offset, -5);
    context.lineTo(offset - 8, -13 - sweep);
    context.lineTo(offset - 16, -21 - sweep * 1.2);
    context.stroke();

    context.beginPath();
    context.moveTo(offset, 5);
    context.lineTo(offset - 8, 13 + sweep);
    context.lineTo(offset - 16, 21 + sweep * 1.2);
    context.stroke();
  });

  context.beginPath();
  context.moveTo(24, -1);
  context.quadraticCurveTo(34, -9 - antennaWiggle, 40, -16 - antennaWiggle * 1.15);
  context.moveTo(24, 1);
  context.quadraticCurveTo(34, 9 + antennaWiggle, 40, 16 + antennaWiggle * 1.15);
  context.stroke();

  context.fillStyle = "rgba(255, 255, 255, 0.16)";
  context.beginPath();
  context.ellipse(-11, -4, 6, 3, -0.3, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(0, 0, 0, 0.28)";
  context.beginPath();
  context.ellipse(-13, 0, 4, 2.2, 0, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

export function CockroachPointer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const lastRef = useRef<Point>({ x: 0, y: 0 });
  const angleRef = useRef(0);
  const timeRef = useRef(0);
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const drawSize = 96;
    const visibleSize = 40;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(drawSize * pixelRatio);
    canvas.height = Math.round(drawSize * pixelRatio);
    canvas.style.width = `${visibleSize}px`;
    canvas.style.height = `${visibleSize}px`;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    targetRef.current = { x: centerX, y: centerY };
    currentRef.current = { x: centerX, y: centerY };
    lastRef.current = { x: centerX, y: centerY };
    container.style.opacity = "1";

    const updateTransform = (x: number, y: number) => {
      container.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const updatePosition = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;

      const velocityX = current.x - lastRef.current.x;
      const velocityY = current.y - lastRef.current.y;
      const movement = Math.hypot(velocityX, velocityY);

      if (movement > 0.05) {
        angleRef.current = Math.atan2(velocityY, velocityX);
      }

      lastRef.current = { x: current.x, y: current.y };
      timeRef.current += 0.16 + Math.min(movement / 12, 0.35);

      updateTransform(current.x, current.y);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, drawSize, drawSize);
      drawRoach(context, drawSize, timeRef.current, Math.min(movement / 8, 1), angleRef.current);
      frameRef.current = window.requestAnimationFrame(updatePosition);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      frameRef.current = window.requestAnimationFrame(updatePosition);
    };

    const handlePointerLeave = () => {
      targetRef.current = { ...currentRef.current };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    updatePosition();

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="cockroach-pointer" aria-hidden="true">
      <canvas ref={canvasRef} className="cockroach-pointer-canvas" />
    </div>
  );
}
