import { Tool } from "./types";
import { ToolType } from "./types";
export interface AppState {
    existingShape: Tool[];
    selectedTool: ToolType;
    selectedShape: Tool | null;
    selectedShapeIndex: number;
    isResizing: boolean;
    isRotating: boolean;
    isDragging: boolean;
    resizeHandle: string;
    rotationAngle: number;
    currentStrokeColor: string;
    currentBgColor: string;
    currentStrokeWidth: number;
    offsetX: number;
     offsetY: number;
     scale: number;
    
    
  }