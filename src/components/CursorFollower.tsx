"use client";

import { useEffect, useState } from "react";

export default function CursorFollower() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    // Disable on touch devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      setPosition({ x: clientX, y: clientY });

      // Check if hovering interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          "a, button, [role='button'], input, select, textarea, .cursor-pointer"
        );
        setIsHovered(!!interactive);
      }
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed z-9999 rounded-full transition-all duration-300"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isHovered ? "26px" : "8px",
        height: isHovered ? "26px" : "8px",
        backgroundColor: isHovered ? "rgba(212, 255, 0, 0.2)" : "white",
        border: isHovered ? "1.5px solid var(--accent)" : "none",
        transform: `translate(-50%, -50%) scale(${isClicked ? 0.75 : 1})`,
        transition: "left 0.06s ease-out, top 0.06s ease-out, width 0.2s ease-out, height 0.2s ease-out, background-color 0.2s ease-out, border 0.2s ease-out, transform 0.1s",
      }}
    />
  );
}
