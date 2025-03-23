import React, { useState, useEffect, useRef } from "react";
import initDraw from "../draw/draw";
import {
  Pencil,
  RectangleHorizontal,
  Circle,
  Diamond,
  ArrowRight,
  Eraser,
  Type,
  MousePointer,
  Minus,
} from "lucide-react";

export default function Drawing({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingInstanceRef = useRef<any>(null);
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  const tools = [
    { type: "pencil", label: "Pencil", icon: <Pencil /> },
    { type: "rect", label: "Rectangle", icon: <RectangleHorizontal /> },
    { type: "circle", label: "Circle", icon: <Circle /> },
    { type: "diamond", label: "Diamond", icon: <Diamond /> },
    { type: "arrow", label: "Arrow", icon: <ArrowRight /> },
    { type: "line", label: "Line", icon: <Minus /> },
    { type: "text", label: "Text", icon: <Type /> },
    { type: "eraser", label: "Eraser", icon: <Eraser /> },
    { type: "select", label: "Select", icon: <MousePointer /> },
  ];

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize drawing
  useEffect(() => {
    if (canvasRef.current && dimensions.width > 0 && dimensions.height > 0) {
      drawingInstanceRef.current = initDraw(canvasRef.current, roomId);
    }
  }, [roomId, dimensions]);

  const handleToolSelect = (toolType: string) => {
    setSelectedTool(toolType);
    if (drawingInstanceRef.current?.selectTool) {
      drawingInstanceRef.current.selectTool(toolType);
    }
  };

  if (!dimensions.width || !dimensions.height) return null;

  return (
    <div className="drawing-container" style={{ position: "relative" }}>
      {/* Centered Toolbar with Lucide icons - Increased Size */}
      <div
        className="drawing-toolbar"
        style={{
          display: "flex",
          gap: "12px",
          padding: "16px",
          background: "#333",
          borderRadius: "12px",
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => handleToolSelect(tool.type)}
            style={{
              padding: "16px",
              border: "none",
              borderRadius: "8px",
              background: selectedTool === tool.type ? "#8b64f5" : "#444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              width: "54px",
              height: "54px",
              transition: "all 0.2s ease",
            }}
            title={tool.label}
          >
            {React.cloneElement(tool.icon, {
              size: 28,
              strokeWidth: 1.5,
              color: "white",
            })}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}