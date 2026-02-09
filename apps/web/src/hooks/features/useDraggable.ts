"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDraggableResult {
  position: Position;
  isDragging: boolean;
  wasDragged: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
}

const DRAG_THRESHOLD = 5;

export function useDraggable(initialPosition?: Position): UseDraggableResult {
  const [position, setPosition] = useState<Position>(
    initialPosition || { x: 0, y: 0 },
  );
  const [isDragging, setIsDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const offsetRef = useRef<Position>({ x: 0, y: 0 });
  const draggedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!initialPosition) {
      setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    }
  }, [initialPosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - startPosRef.current.x;
    const dy = clientY - startPosRef.current.y;

    if (!draggedRef.current && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
      draggedRef.current = true;
      setIsDragging(true);
    }

    if (draggedRef.current) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 56, clientX - offsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 56, clientY - offsetRef.current.y)),
      });
    }
  }, []);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (draggedRef.current) {
      setWasDragged(true);
      setTimeout(() => setWasDragged(false), 100);
    }
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleEnd);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleEnd);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    [handleMove],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY };
      offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      draggedRef.current = false;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleEnd);
    },
    [position, handleMouseMove, handleEnd],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      offsetRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
      draggedRef.current = false;
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleEnd);
    },
    [position, handleTouchMove, handleEnd],
  );

  return { position, isDragging, wasDragged, handleMouseDown, handleTouchStart };
}
