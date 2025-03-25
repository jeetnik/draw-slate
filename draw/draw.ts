
import type { Tool, ToolType } from "./../utils/types";
import { saveShapesToStorage, loadShapesFromStorage } from "./../utils/storage";
import { ClearCanvas } from "./../utils/renderUtils";
import { createToolbar } from "./../utils/toolbar";
import { createStyleToolbar } from "./../utils/styleToolbar";
import { AppState } from "../utils/state";

export default function initDraw(canvas: HTMLCanvasElement, roomId: string,) {
  const state: AppState = {
    existingShape: loadShapesFromStorage(roomId),
    selectedTool: "select",
    selectedShape: null,
    selectedShapeIndex: -1,
    isResizing: false,
    isRotating: false,
    isDragging: false,
    resizeHandle: "",
    rotationAngle: 0,
    currentStrokeColor: "#FFFFFF",
    currentBgColor: "transparent",
    currentStrokeWidth: 2,
    offsetX: 0,
  offsetY: 0,
  scale: 1
  };
  // Default style settings
  let currentStrokeColor = "#FFFFFF";
  let currentBgColor = "transparent";
  let currentStrokeWidth = 2;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  ClearCanvas(state.existingShape, ctx, canvas,state);
  let Clicked = false;
  let StartX = 0;
  let StartY = 0;
  let currentPath: { x: number; y: number }[] = [];
  let textInput: HTMLTextAreaElement | null = null;
  
  function selectTool(toolType: ToolType) {
    state.selectedTool = toolType;
    
    if (toolType === "pencil" || toolType === "eraser") {
      canvas.style.cursor = "crosshair";
    } else if (toolType === "text") {
      canvas.style.cursor = "text";
    } else if (toolType === "select") {
      canvas.style.cursor = "default";
    } else {
      canvas.style.cursor = "crosshair";
    }
    
    // Remove any active text input if switching from text tool
    if (toolType !== "text" && textInput) {
      document.body.removeChild(textInput);
      textInput = null;
    }
    
    // Clear selection when switching tools
    if (toolType !== "select") {
      state.selectedShape = null;
      state.selectedShapeIndex = -1;
    }
  }
  
  // Function to set the current stroke color
  function setStrokeColor(color: string) {
    currentStrokeColor = color;
    
    // If a shape is selected, update its color
    if (state.selectedShape && state.selectedShapeIndex >= 0) {
      if ('color' in state.selectedShape) {
        state.selectedShape.color = color;
        state.existingShape[state.selectedShapeIndex] = state.selectedShape;
        saveShapesToStorage(state.existingShape, roomId);
        ClearCanvas(state.existingShape, ctx, canvas,state);
        drawSelectionHandles(state.selectedShape);
      }
    }
  }
  
  // Function to set the current background color
  function setBgColor(color: string) {
    currentBgColor = color;
    
    // If a shape is selected, update its background color
    if (state.selectedShape && state.selectedShapeIndex >= 0) {
      if ('bgColor' in state.selectedShape) {
        state.selectedShape.bgColor = color;
        state.existingShape[state.selectedShapeIndex] = state.selectedShape;
        saveShapesToStorage(state.existingShape, roomId);
        ClearCanvas(state.existingShape, ctx, canvas,state);
        drawSelectionHandles(state.selectedShape);
      }
    }
  }
  
  // Function to set the current stroke width
  function setStrokeWidth(width: number) {
    currentStrokeWidth = width;
    
    // If a shape is selected, update its stroke width
    if (state.selectedShape && state.selectedShapeIndex >= 0) {
      if ('strokeWidth' in state.selectedShape) {
        state.selectedShape.strokeWidth = width;
        state.existingShape[state.selectedShapeIndex] = state.selectedShape;
        saveShapesToStorage(state.existingShape, roomId);
        ClearCanvas(state.existingShape, ctx, canvas,state);
        drawSelectionHandles(state.selectedShape);
      }
    }
  }
  
  // Function to check if a point is inside a shape
  function isPointInShape(x: number, y: number, shape: Tool): boolean {
    if (shape.type === "rect" || shape.type === "select") {
      return x >= shape.x && x <= shape.x + shape.width && 
             y >= shape.y && y <= shape.y + shape.height;
    } 
    else if (shape.type === "diamond") {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const halfWidth = shape.width / 2;
      const halfHeight = shape.height / 2;
      
      // Transform point to account for rotation if present
      let transformedX = x - centerX;
      let transformedY = y - centerY;
      
      if (shape.rotation) {
        const cos = Math.cos(-shape.rotation);
        const sin = Math.sin(-shape.rotation);
        const rotatedX = transformedX * cos - transformedY * sin;
        const rotatedY = transformedX * sin + transformedY * cos;
        transformedX = rotatedX;
        transformedY = rotatedY;
      }
      
      // Diamond equation: |x/a| + |y/b| <= 1
      return Math.abs(transformedX / halfWidth) + Math.abs(transformedY / halfHeight) <= 1;
    }
    else if (shape.type === "circle") {
      const dx = x - shape.centerX;
      const dy = y - shape.centerY;
      return dx * dx + dy * dy <= shape.radius * shape.radius;
    }
    else if (shape.type === "line" || shape.type === "arrow") {
      // Checking if the point is close to the line
      const lineThickness = shape.strokeWidth + 5; // Add some margin for easier selection
      
      // Distance from point to line formula
      const dx = shape.endX - shape.startX;
      const dy = shape.endY - shape.startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) return false;
      
      const projectionLength = ((x - shape.startX) * dx + (y - shape.startY) * dy) / length;
      
      // Check if projection is outside the line segment
      if (projectionLength < 0 || projectionLength > length) return false;
      
      // Calculate distance from point to line
      const distance = Math.abs((y - shape.startY) * dx - (x - shape.startX) * dy) / length;
      
      return distance <= lineThickness;
    }
    else if (shape.type === "text") {
      // Simple bounding box for text
      const textMetrics = ctx?.measureText(shape.text);
      const textWidth = textMetrics?.width || 0;
      const textHeight = shape.size;
      
      return x >= shape.x && x <= shape.x + textWidth && 
             y >= shape.y - textHeight && y <= shape.y;
    }
    
    return false;
  }
  
  // Function to find which shape was clicked
  function findSelectedShape(x: number, y: number): { shape: Tool | null, index: number } {
    // Iterate backwards to select the topmost shape first
    for (let i = state.existingShape.length - 1; i >= 0; i--) {
      const shape = state.existingShape[i];
      if (shape.type !== "eraser" && isPointInShape(x, y, shape)) {
        return { shape, index: i };
      }
    }
    return { shape: null, index: -1 };
  }
  
  // Function to draw selection handles around the selected shape
  function drawSelectionHandles(shape: Tool) {
    if (!ctx) return;
    
    if (shape.type === "rect" || shape.type === "diamond" || shape.type === "select") {
      // Draw selection outline
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      
      // Draw resize handles at corners
      const handleSize = 12;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      // Top-left
      ctx.fillRect(shape.x - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.x - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
      
      // Top-right
      ctx.fillRect(shape.x + shape.width - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.x + shape.width - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
      
      // Bottom-left
      ctx.fillRect(shape.x - handleSize/2, shape.y + shape.height - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.x - handleSize/2, shape.y + shape.height - handleSize/2, handleSize, handleSize);
      
      // Bottom-right
      ctx.fillRect(shape.x + shape.width - handleSize/2, shape.y + shape.height - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.x + shape.width - handleSize/2, shape.y + shape.height - handleSize/2, handleSize, handleSize);
      
      // Draw rotation handle above the top-middle
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(shape.x + shape.width/2, shape.y - 20, handleSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Draw a line connecting the shape to the rotation handle
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(shape.x + shape.width/2, shape.y);
      ctx.lineTo(shape.x + shape.width/2, shape.y - 20);
      ctx.stroke();
    } 
    else if (shape.type === "circle") {
      // Draw selection outline
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw resize handles at cardinal points
      const handleSize = 12;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      // Top
      ctx.fillRect(shape.centerX - handleSize/2, shape.centerY - shape.radius - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.centerX - handleSize/2, shape.centerY - shape.radius - handleSize/2, handleSize, handleSize);
      
      // Right
      ctx.fillRect(shape.centerX + shape.radius - handleSize/2, shape.centerY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.centerX + shape.radius - handleSize/2, shape.centerY - handleSize/2, handleSize, handleSize);
      
      // Bottom
      ctx.fillRect(shape.centerX - handleSize/2, shape.centerY + shape.radius - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.centerX - handleSize/2, shape.centerY + shape.radius - handleSize/2, handleSize, handleSize);
      
      // Left
      ctx.fillRect(shape.centerX - shape.radius - handleSize/2, shape.centerY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.centerX - shape.radius - handleSize/2, shape.centerY - handleSize/2, handleSize, handleSize);
      
      // Draw rotation handle above the top
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY - shape.radius - 20, handleSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Draw a line connecting the shape to the rotation handle
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(shape.centerX, shape.centerY - shape.radius);
      ctx.lineTo(shape.centerX, shape.centerY - shape.radius - 20);
      ctx.stroke();
    }
    else if (shape.type === "line" || shape.type === "arrow") {
      // Draw selection indicators at endpoints
      const handleSize = 12;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      // Start point
      ctx.fillRect(shape.startX - handleSize/2, shape.startY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.startX - handleSize/2, shape.startY - handleSize/2, handleSize, handleSize);
      
      // End point
      ctx.fillRect(shape.endX - handleSize/2, shape.endY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.endX - handleSize/2, shape.endY - handleSize/2, handleSize, handleSize);
      
      // Draw rotation handle at the midpoint above the line
      const midX = (shape.startX + shape.endX) / 2;
      const midY = (shape.startY + shape.endY) / 2;
      
      // Calculate perpendicular offset for rotation handle
      const dx = shape.endX - shape.startX;
      const dy = shape.endY - shape.startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        const offsetX = -dy / length * 20;
        const offsetY = dx / length * 20;
        
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(midX + offsetX, midY + offsetY, handleSize/2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Draw a line connecting the shape to the rotation handle
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + offsetX, midY + offsetY);
        ctx.stroke();
      }
    }
    else if (shape.type === "text") {
      // Calculate text dimensions
      const textMetrics = ctx?.measureText(shape.text);
      const textWidth = textMetrics?.width || 0;
      const textHeight = shape.size;
      
      // Draw selection outline
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.strokeRect(shape.x, shape.y - textHeight, textWidth, textHeight);
      
      // Draw resize handle at the bottom-right
      const handleSize = 12;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      
      ctx.fillRect(shape.x + textWidth - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.x + textWidth - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
    }
    
    ctx.setLineDash([]);
  }
  
  // Check if a point is over a resize handle
  function getResizeHandle(x: number, y: number, shape: Tool): string {
    const handleSize = 12;
    
    if (shape.type === "rect" || shape.type === "diamond" || shape.type === "select") {
      // Check top-left handle
      if (Math.abs(x - shape.x) <= handleSize/2 && Math.abs(y - shape.y) <= handleSize/2) {
        return "tl";
      }
      // Check top-right handle
      if (Math.abs(x - (shape.x + shape.width)) <= handleSize/2 && Math.abs(y - shape.y) <= handleSize/2) {
        return "tr";
      }
      // Check bottom-left handle
      if (Math.abs(x - shape.x) <= handleSize/2 && Math.abs(y - (shape.y + shape.height)) <= handleSize/2) {
        return "bl";
      }
      // Check bottom-right handle
      if (Math.abs(x - (shape.x + shape.width)) <= handleSize/2 && Math.abs(y - (shape.y + shape.height)) <= handleSize/2) {
        return "br";
      }
      // Check rotation handle
      if (Math.abs(x - (shape.x + shape.width/2)) <= handleSize/2 && Math.abs(y - (shape.y - 20)) <= handleSize/2) {
        return "rotate";
      }
    }
    else if (shape.type === "circle") {
      // Check top handle
      if (Math.abs(x - shape.centerX) <= handleSize/2 && Math.abs(y - (shape.centerY - shape.radius)) <= handleSize/2) {
        return "top";
      }
      // Check right handle
      if (Math.abs(x - (shape.centerX + shape.radius)) <= handleSize/2 && Math.abs(y - shape.centerY) <= handleSize/2) {
        return "right";
      }
      // Check bottom handle
      if (Math.abs(x - shape.centerX) <= handleSize/2 && Math.abs(y - (shape.centerY + shape.radius)) <= handleSize/2) {
        return "bottom";
      }
      // Check left handle
      if (Math.abs(x - (shape.centerX - shape.radius)) <= handleSize/2 && Math.abs(y - shape.centerY) <= handleSize/2) {
        return "left";
      }
      // Check rotation handle
      if (Math.abs(x - shape.centerX) <= handleSize/2 && Math.abs(y - (shape.centerY - shape.radius - 20)) <= handleSize/2) {
        return "rotate";
      }
    }
    else if (shape.type === "line" || shape.type === "arrow") {
      // Check start point handle
      if (Math.abs(x - shape.startX) <= handleSize/2 && Math.abs(y - shape.startY) <= handleSize/2) {
        return "start";
      }
      // Check end point handle
      if (Math.abs(x - shape.endX) <= handleSize/2 && Math.abs(y - shape.endY) <= handleSize/2) {
        return "end";
      }
      
      // Check rotation handle
      const midX = (shape.startX + shape.endX) / 2;
      const midY = (shape.startY + shape.endY) / 2;
      
      const dx = shape.endX - shape.startX;
      const dy = shape.endY - shape.startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        const offsetX = -dy / length * 20;
        const offsetY = dx / length * 20;
        
        if (Math.abs(x - (midX + offsetX)) <= handleSize/2 && Math.abs(y - (midY + offsetY)) <= handleSize/2) {
          return "rotate";
        }
      }
    }
    else if (shape.type === "text") {
      // Calculate text dimensions
      const textMetrics = ctx?.measureText(shape.text);
      const textWidth = textMetrics?.width || 0;
      
      // Check resize handle
      if (Math.abs(x - (shape.x + textWidth)) <= handleSize/2 && Math.abs(y - shape.y) <= handleSize/2) {
        return "resize";
      }
    }
    
    return "";
  }
  
  // Function to rotate a shape
  function rotateShape(shape: Tool, angle: number) {
    if ('rotation' in shape) {
      shape.rotation = (shape.rotation || 0) + angle;
    }
  }
 // Add zoom handler
 // Add this in your initDraw function, after other event listeners
canvas.addEventListener("wheel", (e) => {
  e.preventDefault(); // Prevent default scrolling behavior

  // Get mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Calculate zoom factor (0.9 for zoom out, 1.1 for zoom in)
  const delta = e.deltaY > 0 ? 0.9 : 1.1;

  // Convert mouse position to drawing coordinates before zoom
  const pointX = (mouseX - state.offsetX) / state.scale;
  const pointY = (mouseY - state.offsetY) / state.scale;

  // Apply zoom by scaling the current scale value
  state.scale *= delta;
  
  // Clamp scale between 0.1 and 10 to prevent extreme zoom
  state.scale = Math.min(Math.max(0.1, state.scale), 10);

  // Adjust offset to keep mouse position stable during zoom
  state.offsetX = mouseX - pointX * state.scale;
  state.offsetY = mouseY - pointY * state.scale;

  // Redraw canvas with new transformation values
  ClearCanvas(state.existingShape, ctx, canvas, state);
});

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
  
    // Convert to drawing coordinates
    StartX = (rawX - state.offsetX) / state.scale;
    StartY = (rawY - state.offsetY) / state.scale;
    
    if (state.selectedTool === "select") {
      // Check if clicking on an existing shape
      const { shape, index } = findSelectedShape(StartX, StartY);
      
      if (shape) {
        state.selectedShape = shape;
        state.selectedShapeIndex = index;
        
        // Check if clicking on a resize handle
        if (state.selectedShape) {
          state.resizeHandle = getResizeHandle(StartX, StartY, state.selectedShape);
          
          if (state.resizeHandle === "rotate") {
            state.isRotating = true;
            state.isDragging = false;
            state.isResizing = false;
            
            // Calculate the initial rotation angle
            if (state.selectedShape.type === "rect" || state.selectedShape.type === "diamond") {
              const centerX = state.selectedShape.x + state.selectedShape.width / 2;
              const centerY = state.selectedShape.y + state.selectedShape.height / 2;
              state.rotationAngle = Math.atan2(StartY - centerY, StartX - centerX);
            }
            else if (state.selectedShape.type === "circle") {
              state.rotationAngle = Math.atan2(StartY - state.selectedShape.centerY, StartX - state.selectedShape.centerX);
            }
            else if (state.selectedShape.type === "line" || state.selectedShape.type === "arrow") {
              const midX = (state.selectedShape.startX + state.selectedShape.endX) / 2;
              const midY = (state.selectedShape.startY + state.selectedShape.endY) / 2;
              state.rotationAngle = Math.atan2(StartY - midY, StartX - midX);
            }
          }
          else if (state.resizeHandle !== "") {
            state.isResizing = true;
            state.isDragging = false;
            state.isRotating = false;
          }
          else {
            state.isDragging = true;
            state.isResizing = false;
            state.isRotating = false;
          }
        }
        
        ClearCanvas(state.existingShape, ctx, canvas,state);
        drawSelectionHandles(state.selectedShape);
      }
      else {
        // Start a selection rect if not clicking on a shape
        Clicked = true;
        
        // Clear current selection
        state.selectedShape = null;
        state.selectedShapeIndex = -1;
      }
    }
    else {
      Clicked = true;
      
      if (state.selectedTool === "pencil" || state.selectedTool === "eraser") {
        currentPath = [{ x: StartX, y: StartY }];
      }
      
      if (state.selectedTool === "text") {
        // Create text input at click position
        ClearCanvas(state.existingShape, ctx, canvas,state);
        if (textInput) document.body.removeChild(textInput);
      
        textInput = document.createElement("textarea");
        textInput.style.position = "absolute";
        const canvasRect = canvas.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;
        const textCanvasX = StartX * state.scale + state.offsetX;
        const textCanvasY = StartY * state.scale + state.offsetY;
        
        const textX = canvasRect.left + textCanvasX + scrollX;
        const textY = canvasRect.top + textCanvasY + scrollY;
        textInput.style.left = `${textX}px`;  // Changed to pageX
        textInput.style.top = `${textY}px`;   // Changed to pageY
        textInput.style.zIndex = "1000";
        textInput.style.background = "black"; // Changed to solid background
        textInput.style.border = "2px solid #4d88ff"; // More visible border

        textInput.style.minWidth = "200px";
        textInput.style.minHeight = "40px";
        textInput.style.padding = "4px";
        textInput.style.fontSize = "16px";
        textInput.style.transform = "translate(-50%, -50%)";  // Center alignment
        textInput.style.pointerEvents = "auto";  // Make sure it's interactive
        textInput.style.color = currentStrokeColor; 

        document.body.appendChild(textInput);
        setTimeout(() => {
            if (textInput) textInput.focus();
          }, 0);
      
        textInput.addEventListener("blur", () => {
          if (textInput && textInput.value.trim() !== "") {
            const shape: Tool = {
              type: "text",
              id: crypto.randomUUID(),
              x: StartX,
              y: StartY,
              text: textInput.value,
              size: 16,
              color: currentStrokeColor,
              bgColor: currentBgColor,
              strokeWidth: currentStrokeWidth,
              strokeStyle: "solid",
            };
            state.existingShape.push(shape);
            saveShapesToStorage(state.existingShape, roomId);
            ClearCanvas(state.existingShape, ctx, canvas,state);
          }
          
          if (textInput) document.body.removeChild(textInput);
          textInput = null;
        });
      }
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (state.isDragging || state.isResizing || state.isRotating) {
      saveShapesToStorage(state.existingShape, roomId);
      state.isDragging = false;
      state.isResizing = false;
      state.isRotating = false;
      
      if (state.selectedShape) {
        ClearCanvas(state.existingShape, ctx, canvas,state);
        drawSelectionHandles(state.selectedShape);
      }
      return;
    }
    
    if (!Clicked) return; 
    Clicked = false;
    const rect = canvas.getBoundingClientRect();
    let EndX = e.clientX - rect.left;
    let EndY = e.clientY - rect.top;

    let width = Math.abs(EndX - StartX);
    let height = Math.abs(EndY - StartY);
    let x = Math.min(StartX, EndX);
    let y = Math.min(StartY, EndY);

    if (state.selectedTool === "circle") {
      const centerX = (StartX + EndX) / 2;
      const centerY = (StartY + EndY) / 2;
      const radius = Math.sqrt(width ** 2 + height ** 2) / 2;

      const shape: Tool = {
          type: "circle",
          id: crypto.randomUUID(),
          x: StartX,
          y: StartY,
          endX: EndX,
          endY: EndY,
          width,
          height,
          centerX,
          centerY,
          radius,
          color: currentStrokeColor,
          bgColor: currentBgColor,
          strokeWidth: currentStrokeWidth,
          strokeStyle: "solid",
      };
      state.existingShape.push(shape);
    } else if (state.selectedTool === "rect") {
      const shape: Tool = {
          type: "rect",
          id: crypto.randomUUID(),
          x,
          y,
          width,
          height,
          color: currentStrokeColor,
          bgColor: currentBgColor,
          strokeWidth: currentStrokeWidth,
          strokeStyle: "solid",
      };
      state.existingShape.push(shape);
    } else if (state.selectedTool === "diamond") {
      const shape: Tool = {
          type: "diamond",
          id: crypto.randomUUID(),
          x,
          y,
          width,
          height,
          color: currentStrokeColor,
          bgColor: currentBgColor,
          strokeWidth: currentStrokeWidth,
          strokeStyle: "solid",
      };
      state.existingShape.push(shape);
    } else if (state.selectedTool === "arrow") {
      const shape: Tool = {
          type: "arrow",
          id: crypto.randomUUID(),
          startX: StartX,
          startY: StartY,
          endX: EndX,
          endY: EndY,
          color: currentStrokeColor,
          strokeWidth: currentStrokeWidth,
          strokeStyle: "solid",
      };
      state.existingShape.push(shape);
    } else if (state.selectedTool === "line") {
      const shape: Tool = {
          type: "line",
          id: crypto.randomUUID(),
          startX: StartX,
          startY: StartY,
          endX: EndX,
          endY: EndY,
          color: currentStrokeColor,
          strokeWidth: currentStrokeWidth,
          strokeStyle: "solid",
      };
      state.existingShape.push(shape);
    } else if (state.selectedTool === "pencil" && currentPath.length > 1) {
      const shape: Tool = {
          type: "pencil",
          id: crypto.randomUUID(),
          path: [...currentPath],
          color: currentStrokeColor,
          strokeWidth: currentStrokeWidth,
          strokeStyle: "solid",
      };
      state.existingShape.push(shape);
      currentPath = [];
    } else if (state.selectedTool === "eraser" && currentPath.length > 1) {
      const shape: Tool = {
          type: "eraser",
          id: crypto.randomUUID(),
          path: [...currentPath],
          strokeWidth: 10,
      };
      state.existingShape.push(shape);
      currentPath = [];
    } else if (state.selectedTool === "select" && !state.selectedShape) {
      // Create a selection rectangle
      state.selectedShape = {
          type: "select",
          id: crypto.randomUUID(),
          x,
          y,
          width,
          height,
      };
      state.existingShape.push(state.selectedShape);
      state.selectedShapeIndex = state.existingShape.length - 1;
    }

    saveShapesToStorage(state.existingShape, roomId);
    ClearCanvas(state.existingShape, ctx, canvas,state);
    
   // Continue from where the code was cut off
   if (state.selectedShape) {
    drawSelectionHandles(state.selectedShape);
  }
});

canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  if (state.selectedTool === "select" && state.selectedShape) {
    // Handle resizing
    if (state.isResizing && state.selectedShape) {
      if (state.selectedShape.type === "rect" || state.selectedShape.type === "diamond") {
        if (state.resizeHandle === "br") {
          state.selectedShape.width = mouseX - state.selectedShape.x;
          state.selectedShape.height = mouseY - state.selectedShape.y;
        } else if (state.resizeHandle === "tr") {
          state.selectedShape.width = mouseX - state.selectedShape.x;
          state.selectedShape.height = state.selectedShape.y + state.selectedShape.height - mouseY;
          state.selectedShape.y = mouseY;
        } else if (state.resizeHandle === "bl") {
          state.selectedShape.width = state.selectedShape.x + state.selectedShape.width - mouseX;
          state.selectedShape.height = mouseY - state.selectedShape.y;
          state.selectedShape.x = mouseX;
        } else if (state.resizeHandle === "tl") {
          state.selectedShape.width = state.selectedShape.x + state.selectedShape.width - mouseX;
          state.selectedShape.height = state.selectedShape.y + state.selectedShape.height - mouseY;
          state.selectedShape.x = mouseX;
          state.selectedShape.y = mouseY;
        }
      } else if (state.selectedShape.type === "circle") {
        const dx = mouseX - state.selectedShape.centerX;
        const dy = mouseY - state.selectedShape.centerY;
        
        if (state.resizeHandle === "right") {
          state.selectedShape.radius = Math.abs(dx);
        } else if (state.resizeHandle === "left") {
          state.selectedShape.radius = Math.abs(dx);
        } else if (state.resizeHandle === "top") {
          state.selectedShape.radius = Math.abs(dy);
        } else if (state.resizeHandle === "bottom") {
          state.selectedShape.radius = Math.abs(dy);
        }
        
        // Update derived properties
        state.selectedShape.width = state.selectedShape.radius * 2;
        state.selectedShape.height = state.selectedShape.radius * 2;
        state.selectedShape.x = state.selectedShape.centerX - state.selectedShape.radius;
        state.selectedShape.y = state.selectedShape.centerY - state.selectedShape.radius;
      } else if (state.selectedShape.type === "line" || state.selectedShape.type === "arrow") {
        if (state.resizeHandle === "start") {
          state.selectedShape.startX = mouseX;
          state.selectedShape.startY = mouseY;
        } else if (state.resizeHandle === "end") {
          state.selectedShape.endX = mouseX;
          state.selectedShape.endY = mouseY;
        }
      } else if (state.selectedShape.type === "text" && state.resizeHandle === "resize") {
        const newSize = mouseX - state.selectedShape.x;
        if (newSize > 10) { // Minimum text size
          // Scale the font size based on text width change
          const oldMetrics = ctx?.measureText(state.selectedShape.text);
          const oldWidth = oldMetrics?.width || 0;
          const scaleFactor = newSize / oldWidth;
          state.selectedShape.size = Math.max(10, Math.min(72, state.selectedShape.size * scaleFactor)); // Clamp between 10 and 72px
        }
      }
      
      state.existingShape[state.selectedShapeIndex] = state.selectedShape;
      ClearCanvas(state.existingShape, ctx, canvas,state);
      drawSelectionHandles(state.selectedShape);
    }
    // Handle rotation
    else if (state.isRotating && state.selectedShape) {
      let newAngle = 0;
      
      if (state.selectedShape.type === "rect" || state.selectedShape.type === "diamond") {
        const centerX = state.selectedShape.x + state.selectedShape.width / 2;
        const centerY = state.selectedShape.y + state.selectedShape.height / 2;
        newAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        
        const deltaAngle = newAngle - state.rotationAngle;
        state.rotationAngle = newAngle;
        
        state.selectedShape.rotation = (state.selectedShape.rotation || 0) + deltaAngle;
      } else if (state.selectedShape.type === "circle") {
        const centerX = state.selectedShape.centerX;
        const centerY = state.selectedShape.centerY;
        newAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        
        const deltaAngle = newAngle - state.rotationAngle;
        state.rotationAngle = newAngle;
        
        state.selectedShape.rotation = (state.selectedShape.rotation || 0) + deltaAngle;
      } else if (state.selectedShape.type === "line" || state.selectedShape.type === "arrow") {
        const midX = (state.selectedShape.startX + state.selectedShape.endX) / 2;
        const midY = (state.selectedShape.startY + state.selectedShape.endY) / 2;
        newAngle = Math.atan2(mouseY - midY, mouseX - midX);
        
        const deltaAngle = newAngle - state.rotationAngle;
        state.rotationAngle = newAngle;
        
        // For lines and arrows, we need to rotate the endpoints around the midpoint
        const cos = Math.cos(deltaAngle);
        const sin = Math.sin(deltaAngle);
        
        // Translate to origin, rotate, and translate back
        const startXr = (state.selectedShape.startX - midX) * cos - (state.selectedShape.startY - midY) * sin + midX;
        const startYr = (state.selectedShape.startX - midX) * sin + (state.selectedShape.startY - midY) * cos + midY;
        const endXr = (state.selectedShape.endX - midX) * cos - (state.selectedShape.endY - midY) * sin + midX;
        const endYr = (state.selectedShape.endX - midX) * sin + (state.selectedShape.endY - midY) * cos + midY;
        
     state.selectedShape.startX = startXr;
        state.selectedShape.startY = startYr;
        state.selectedShape.endX = endXr;
        state.selectedShape.endY = endYr;
      }
      
      state.existingShape[state.selectedShapeIndex] = state.selectedShape;
      ClearCanvas(state.existingShape, ctx, canvas,state);
      drawSelectionHandles(state.selectedShape);
    }
    // Handle dragging
    else if (state.isDragging && state.selectedShape) {
      const deltaX = mouseX - StartX;
      const deltaY = mouseY - StartY;
      
      if (state.selectedShape.type === "rect" || state.selectedShape.type === "diamond" || state.selectedShape.type === "select") {
        state.selectedShape.x += deltaX;
        state.selectedShape.y += deltaY;
      } else if (state.selectedShape.type === "circle") {
        state.selectedShape.centerX += deltaX;
        state.selectedShape.centerY += deltaY;
        state.selectedShape.x += deltaX;
        state.selectedShape.y += deltaY;
      } else if (state.selectedShape.type === "line" || state.selectedShape.type === "arrow") {
        state.selectedShape.startX += deltaX;
        state.selectedShape.startY += deltaY;
        state.selectedShape.endX += deltaX;
        state.selectedShape.endY += deltaY;
      } else if (state.selectedShape.type === "text") {
        state.selectedShape.x += deltaX;
        state.selectedShape.y += deltaY;
      }
      
      StartX = mouseX;
      StartY = mouseY;
      
      state.existingShape[state.selectedShapeIndex] = state.selectedShape;
      ClearCanvas(state.existingShape, ctx, canvas,state);
      drawSelectionHandles(state.selectedShape);
    }
    // Update cursor based on handle
    else if (state.selectedShape) {
      const handle = getResizeHandle(mouseX, mouseY, state.selectedShape);
      
      if (handle === "rotate") {
        canvas.style.cursor = "grab";
      } else if (handle === "tl" || handle === "br") {
        canvas.style.cursor = "nwse-resize";
      } else if (handle === "tr" || handle === "bl") {
        canvas.style.cursor = "nesw-resize";
      } else if (handle === "start" || handle === "end") {
        canvas.style.cursor = "move";
      } else if (handle === "resize") {
        canvas.style.cursor = "ew-resize";
      } else if (isPointInShape(mouseX, mouseY, state.selectedShape)) {
        canvas.style.cursor = "move";
      } else {
        canvas.style.cursor = "default";
      }
    }
  }
  
  if (Clicked) {
    ClearCanvas(state.existingShape, ctx, canvas,state);
    
    if (state.selectedTool === "pencil" || state.selectedTool === "eraser") {
      // Draw the current path
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      
      ctx.lineTo(mouseX, mouseY);
      
      if (state.selectedTool === "pencil") {
        ctx.strokeStyle = currentStrokeColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.stroke();
      } else if (state.selectedTool === "eraser") {
        ctx.strokeStyle = "rgba(0, 0, 0)";
        ctx.lineWidth = 10;
        ctx.stroke();
      }
      
      currentPath.push({ x: mouseX, y: mouseY });
    } else if (state.selectedTool === "rect") {
      if (!ctx) return;
      
      let width = mouseX - StartX;
      let height = mouseY - StartY;
      
      ctx.strokeStyle = currentStrokeColor;
      ctx.fillStyle = currentBgColor;
      ctx.lineWidth = currentStrokeWidth;
      
      if (currentBgColor !== "transparent") {
        ctx.fillRect(StartX, StartY, width, height);
      }
      
      ctx.strokeRect(StartX, StartY, width, height);
    } else if (state.selectedTool === "circle") {
      if (!ctx) return;
      
      const centerX = (StartX + mouseX) / 2;
      const centerY = (StartY + mouseY) / 2;
      const radius = Math.sqrt(Math.pow(mouseX - StartX, 2) + Math.pow(mouseY - StartY, 2)) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      
      ctx.strokeStyle = currentStrokeColor;
      ctx.fillStyle = currentBgColor;
      ctx.lineWidth = currentStrokeWidth;
      
      if (currentBgColor !== "transparent") {
        ctx.fill();
      }
      
      ctx.stroke();
    } else if (state.selectedTool === "diamond") {
      if (!ctx) return;
      
      const centerX = (StartX + mouseX) / 2;
      const centerY = (StartY + mouseY) / 2;
      const width = Math.abs(mouseX - StartX);
      const height = Math.abs(mouseY - StartY);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - height / 2); // Top
      ctx.lineTo(centerX + width / 2, centerY); // Right
      ctx.lineTo(centerX, centerY + height / 2); // Bottom
      ctx.lineTo(centerX - width / 2, centerY); // Left
      ctx.closePath();
      
      ctx.strokeStyle = currentStrokeColor;
      ctx.fillStyle = currentBgColor;
      ctx.lineWidth = currentStrokeWidth;
      
      if (currentBgColor !== "transparent") {
        ctx.fill();
      }
      
      ctx.stroke();
    } else if (state.selectedTool === "line") {
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(StartX, StartY);
      ctx.lineTo(mouseX, mouseY);
      
      ctx.strokeStyle = currentStrokeColor;
      ctx.lineWidth = currentStrokeWidth;
      ctx.stroke();
    } else if (state.selectedTool === "arrow") {
      if (!ctx) return;
      
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(StartX, StartY);
      ctx.lineTo(mouseX, mouseY);
      
      ctx.strokeStyle = currentStrokeColor;
      ctx.lineWidth = currentStrokeWidth;
      ctx.stroke();
      
      // Draw the arrowhead
      const headLength = 15;
      const dx = mouseX - StartX;
      const dy = mouseY - StartY;
      const angle = Math.atan2(dy, dx);
      
      ctx.beginPath();
      ctx.moveTo(mouseX, mouseY);
      ctx.lineTo(
        mouseX - headLength * Math.cos(angle - Math.PI / 6),
        mouseY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        mouseX - headLength * Math.cos(angle + Math.PI / 6),
        mouseY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      
      ctx.fillStyle = currentStrokeColor;
      ctx.fill();
    } else if (state.selectedTool === "select") {
      if (!ctx) return;
      
      // Draw selection rectangle
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.strokeRect(StartX, StartY, mouseX - StartX, mouseY - StartY);
      ctx.setLineDash([]);
    }
  }
});



createStyleToolbar(ctx,canvas,state,roomId,setBgColor,setStrokeColor,setStrokeWidth);


return {
  selectTool,
  setStrokeColor,
  setBgColor,
  setStrokeWidth
};
}