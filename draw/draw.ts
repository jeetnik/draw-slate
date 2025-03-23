type Tool = | {
    type: "rect";
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    bgColor: string;
    strokeWidth: number;
    strokeStyle: string;
    rotation?: number;
  }| {
    type: "circle";
    id: string;
    x: number;
    y: number;
    endX: number;
    endY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    radius: number;
    color: string;
    bgColor: string;
    strokeWidth: number;
    strokeStyle: string;
    rotation?: number;
  }| {
    type: "pencil";
    id: string;
    path: { x: number; y: number }[];
    color: string;
    strokeWidth: number;
    strokeStyle: string;
  }| {
    type: "diamond";
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    bgColor: string;
    strokeWidth: number;
    strokeStyle: string;
    rotation?: number;
  }| {
    type: "arrow";
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    strokeWidth: number;
    strokeStyle: string;
    rotation?: number;
  }| {
    type: "line";
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    strokeWidth: number;
    strokeStyle: string;
    rotation?: number;
  }| {
    type: "text";
    id: string;
    x: number;
    y: number;
    text: string;
    size: number;
    color: string;
    bgColor: string;
    strokeWidth: number;
    strokeStyle: string;
    rotation?: number;
  }| {
    type: "eraser";
    id: string;
    path: { x: number; y: number }[];
    strokeWidth: number;
  }| {
    type: "select";
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };

type ToolType = Tool['type'];
export default function initDraw(canvas: HTMLCanvasElement, roomId: string) {
  let existingShape: Tool[] = loadShapesFromStorage(roomId);
  let selectedTool: ToolType = "select";
  let selectedShape: Tool | null = null;
  let selectedShapeIndex: number = -1;
  let isResizing = false;
  let isRotating = false;
  let isDragging = false;
  let resizeHandle = "";
  let rotationAngle = 0;
  
  // Default style settings
  let currentStrokeColor = "#FFFFFF";
  let currentBgColor = "transparent";
  let currentStrokeWidth = 2;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  ClearCanvas(existingShape, ctx, canvas);
  let Clicked = false;
  let StartX = 0;
  let StartY = 0;
  let currentPath: { x: number; y: number }[] = [];
  let textInput: HTMLTextAreaElement | null = null;
  
  function selectTool(toolType: ToolType) {
    selectedTool = toolType;
    
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
      selectedShape = null;
      selectedShapeIndex = -1;
    }
  }
  
  // Function to set the current stroke color
  function setStrokeColor(color: string) {
    currentStrokeColor = color;
    
    // If a shape is selected, update its color
    if (selectedShape && selectedShapeIndex >= 0) {
      if ('color' in selectedShape) {
        selectedShape.color = color;
        existingShape[selectedShapeIndex] = selectedShape;
        saveShapesToStorage(existingShape, roomId);
        ClearCanvas(existingShape, ctx, canvas);
        drawSelectionHandles(selectedShape);
      }
    }
  }
  
  // Function to set the current background color
  function setBgColor(color: string) {
    currentBgColor = color;
    
    // If a shape is selected, update its background color
    if (selectedShape && selectedShapeIndex >= 0) {
      if ('bgColor' in selectedShape) {
        selectedShape.bgColor = color;
        existingShape[selectedShapeIndex] = selectedShape;
        saveShapesToStorage(existingShape, roomId);
        ClearCanvas(existingShape, ctx, canvas);
        drawSelectionHandles(selectedShape);
      }
    }
  }
  
  // Function to set the current stroke width
  function setStrokeWidth(width: number) {
    currentStrokeWidth = width;
    
    // If a shape is selected, update its stroke width
    if (selectedShape && selectedShapeIndex >= 0) {
      if ('strokeWidth' in selectedShape) {
        selectedShape.strokeWidth = width;
        existingShape[selectedShapeIndex] = selectedShape;
        saveShapesToStorage(existingShape, roomId);
        ClearCanvas(existingShape, ctx, canvas);
        drawSelectionHandles(selectedShape);
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
    for (let i = existingShape.length - 1; i >= 0; i--) {
      const shape = existingShape[i];
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
      const handleSize = 8;
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
      const handleSize = 8;
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
      const handleSize = 8;
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
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.strokeRect(shape.x, shape.y - textHeight, textWidth, textHeight);
      
      // Draw resize handle at the bottom-right
      const handleSize = 8;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      ctx.fillRect(shape.x + textWidth - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(shape.x + textWidth - handleSize/2, shape.y - handleSize/2, handleSize, handleSize);
    }
    
    ctx.setLineDash([]);
  }
  
  // Check if a point is over a resize handle
  function getResizeHandle(x: number, y: number, shape: Tool): string {
    const handleSize = 8;
    
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
  
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    StartX = e.clientX - rect.left;
    StartY = e.clientY - rect.top;
    
    if (selectedTool === "select") {
      // Check if clicking on an existing shape
      const { shape, index } = findSelectedShape(StartX, StartY);
      
      if (shape) {
        selectedShape = shape;
        selectedShapeIndex = index;
        
        // Check if clicking on a resize handle
        if (selectedShape) {
          resizeHandle = getResizeHandle(StartX, StartY, selectedShape);
          
          if (resizeHandle === "rotate") {
            isRotating = true;
            isDragging = false;
            isResizing = false;
            
            // Calculate the initial rotation angle
            if (selectedShape.type === "rect" || selectedShape.type === "diamond") {
              const centerX = selectedShape.x + selectedShape.width / 2;
              const centerY = selectedShape.y + selectedShape.height / 2;
              rotationAngle = Math.atan2(StartY - centerY, StartX - centerX);
            }
            else if (selectedShape.type === "circle") {
              rotationAngle = Math.atan2(StartY - selectedShape.centerY, StartX - selectedShape.centerX);
            }
            else if (selectedShape.type === "line" || selectedShape.type === "arrow") {
              const midX = (selectedShape.startX + selectedShape.endX) / 2;
              const midY = (selectedShape.startY + selectedShape.endY) / 2;
              rotationAngle = Math.atan2(StartY - midY, StartX - midX);
            }
          }
          else if (resizeHandle !== "") {
            isResizing = true;
            isDragging = false;
            isRotating = false;
          }
          else {
            isDragging = true;
            isResizing = false;
            isRotating = false;
          }
        }
        
        ClearCanvas(existingShape, ctx, canvas);
        drawSelectionHandles(selectedShape);
      }
      else {
        // Start a selection rect if not clicking on a shape
        Clicked = true;
        
        // Clear current selection
        selectedShape = null;
        selectedShapeIndex = -1;
      }
    }
    else {
      Clicked = true;
      
      if (selectedTool === "pencil" || selectedTool === "eraser") {
        currentPath = [{ x: StartX, y: StartY }];
      }
      
      if (selectedTool === "text") {
        // Create text input at click position
        ClearCanvas(existingShape, ctx, canvas);
        if (textInput) document.body.removeChild(textInput);
      
        textInput = document.createElement("textarea");
        textInput.style.position = "absolute";
        const canvasRect = canvas.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;
        const textX = canvasRect.left + StartX + scrollX;
        const textY = canvasRect.top + StartY + scrollY;
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
            existingShape.push(shape);
            saveShapesToStorage(existingShape, roomId);
            ClearCanvas(existingShape, ctx, canvas);
          }
          
          if (textInput) document.body.removeChild(textInput);
          textInput = null;
        });
      }
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (isDragging || isResizing || isRotating) {
      saveShapesToStorage(existingShape, roomId);
      isDragging = false;
      isResizing = false;
      isRotating = false;
      
      if (selectedShape) {
        ClearCanvas(existingShape, ctx, canvas);
        drawSelectionHandles(selectedShape);
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

    if (selectedTool === "circle") {
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
      existingShape.push(shape);
    } else if (selectedTool === "rect") {
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
      existingShape.push(shape);
    } else if (selectedTool === "diamond") {
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
      existingShape.push(shape);
    } else if (selectedTool === "arrow") {
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
      existingShape.push(shape);
    } else if (selectedTool === "line") {
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
      existingShape.push(shape);
    } else if (selectedTool === "pencil" && currentPath.length > 1) {
      const shape: Tool = {
          type: "pencil",
          id: crypto.randomUUID(),
          path: [...currentPath],
          color: currentStrokeColor,
          strokeWidth: currentStrokeWidth,
          strokeStyle: "solid",
      };
      existingShape.push(shape);
      currentPath = [];
    } else if (selectedTool === "eraser" && currentPath.length > 1) {
      const shape: Tool = {
          type: "eraser",
          id: crypto.randomUUID(),
          path: [...currentPath],
          strokeWidth: 10,
      };
      existingShape.push(shape);
      currentPath = [];
    } else if (selectedTool === "select" && !selectedShape) {
      // Create a selection rectangle
      selectedShape = {
          type: "select",
          id: crypto.randomUUID(),
          x,
          y,
          width,
          height,
      };
      existingShape.push(selectedShape);
      selectedShapeIndex = existingShape.length - 1;
    }

    saveShapesToStorage(existingShape, roomId);
    ClearCanvas(existingShape, ctx, canvas);
    
   // Continue from where the code was cut off
   if (selectedShape) {
    drawSelectionHandles(selectedShape);
  }
});

canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  if (selectedTool === "select" && selectedShape) {
    // Handle resizing
    if (isResizing && selectedShape) {
      if (selectedShape.type === "rect" || selectedShape.type === "diamond") {
        if (resizeHandle === "br") {
          selectedShape.width = mouseX - selectedShape.x;
          selectedShape.height = mouseY - selectedShape.y;
        } else if (resizeHandle === "tr") {
          selectedShape.width = mouseX - selectedShape.x;
          selectedShape.height = selectedShape.y + selectedShape.height - mouseY;
          selectedShape.y = mouseY;
        } else if (resizeHandle === "bl") {
          selectedShape.width = selectedShape.x + selectedShape.width - mouseX;
          selectedShape.height = mouseY - selectedShape.y;
          selectedShape.x = mouseX;
        } else if (resizeHandle === "tl") {
          selectedShape.width = selectedShape.x + selectedShape.width - mouseX;
          selectedShape.height = selectedShape.y + selectedShape.height - mouseY;
          selectedShape.x = mouseX;
          selectedShape.y = mouseY;
        }
      } else if (selectedShape.type === "circle") {
        const dx = mouseX - selectedShape.centerX;
        const dy = mouseY - selectedShape.centerY;
        
        if (resizeHandle === "right") {
          selectedShape.radius = Math.abs(dx);
        } else if (resizeHandle === "left") {
          selectedShape.radius = Math.abs(dx);
        } else if (resizeHandle === "top") {
          selectedShape.radius = Math.abs(dy);
        } else if (resizeHandle === "bottom") {
          selectedShape.radius = Math.abs(dy);
        }
        
        // Update derived properties
        selectedShape.width = selectedShape.radius * 2;
        selectedShape.height = selectedShape.radius * 2;
        selectedShape.x = selectedShape.centerX - selectedShape.radius;
        selectedShape.y = selectedShape.centerY - selectedShape.radius;
      } else if (selectedShape.type === "line" || selectedShape.type === "arrow") {
        if (resizeHandle === "start") {
          selectedShape.startX = mouseX;
          selectedShape.startY = mouseY;
        } else if (resizeHandle === "end") {
          selectedShape.endX = mouseX;
          selectedShape.endY = mouseY;
        }
      } else if (selectedShape.type === "text" && resizeHandle === "resize") {
        const newSize = mouseX - selectedShape.x;
        if (newSize > 10) { // Minimum text size
          // Scale the font size based on text width change
          const oldMetrics = ctx?.measureText(selectedShape.text);
          const oldWidth = oldMetrics?.width || 0;
          const scaleFactor = newSize / oldWidth;
          selectedShape.size = Math.max(10, Math.min(72, selectedShape.size * scaleFactor)); // Clamp between 10 and 72px
        }
      }
      
      existingShape[selectedShapeIndex] = selectedShape;
      ClearCanvas(existingShape, ctx, canvas);
      drawSelectionHandles(selectedShape);
    }
    // Handle rotation
    else if (isRotating && selectedShape) {
      let newAngle = 0;
      
      if (selectedShape.type === "rect" || selectedShape.type === "diamond") {
        const centerX = selectedShape.x + selectedShape.width / 2;
        const centerY = selectedShape.y + selectedShape.height / 2;
        newAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        
        const deltaAngle = newAngle - rotationAngle;
        rotationAngle = newAngle;
        
        selectedShape.rotation = (selectedShape.rotation || 0) + deltaAngle;
      } else if (selectedShape.type === "circle") {
        const centerX = selectedShape.centerX;
        const centerY = selectedShape.centerY;
        newAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        
        const deltaAngle = newAngle - rotationAngle;
        rotationAngle = newAngle;
        
        selectedShape.rotation = (selectedShape.rotation || 0) + deltaAngle;
      } else if (selectedShape.type === "line" || selectedShape.type === "arrow") {
        const midX = (selectedShape.startX + selectedShape.endX) / 2;
        const midY = (selectedShape.startY + selectedShape.endY) / 2;
        newAngle = Math.atan2(mouseY - midY, mouseX - midX);
        
        const deltaAngle = newAngle - rotationAngle;
        rotationAngle = newAngle;
        
        // For lines and arrows, we need to rotate the endpoints around the midpoint
        const cos = Math.cos(deltaAngle);
        const sin = Math.sin(deltaAngle);
        
        // Translate to origin, rotate, and translate back
        const startXr = (selectedShape.startX - midX) * cos - (selectedShape.startY - midY) * sin + midX;
        const startYr = (selectedShape.startX - midX) * sin + (selectedShape.startY - midY) * cos + midY;
        const endXr = (selectedShape.endX - midX) * cos - (selectedShape.endY - midY) * sin + midX;
        const endYr = (selectedShape.endX - midX) * sin + (selectedShape.endY - midY) * cos + midY;
        
        selectedShape.startX = startXr;
        selectedShape.startY = startYr;
        selectedShape.endX = endXr;
        selectedShape.endY = endYr;
      }
      
      existingShape[selectedShapeIndex] = selectedShape;
      ClearCanvas(existingShape, ctx, canvas);
      drawSelectionHandles(selectedShape);
    }
    // Handle dragging
    else if (isDragging && selectedShape) {
      const deltaX = mouseX - StartX;
      const deltaY = mouseY - StartY;
      
      if (selectedShape.type === "rect" || selectedShape.type === "diamond" || selectedShape.type === "select") {
        selectedShape.x += deltaX;
        selectedShape.y += deltaY;
      } else if (selectedShape.type === "circle") {
        selectedShape.centerX += deltaX;
        selectedShape.centerY += deltaY;
        selectedShape.x += deltaX;
        selectedShape.y += deltaY;
      } else if (selectedShape.type === "line" || selectedShape.type === "arrow") {
        selectedShape.startX += deltaX;
        selectedShape.startY += deltaY;
        selectedShape.endX += deltaX;
        selectedShape.endY += deltaY;
      } else if (selectedShape.type === "text") {
        selectedShape.x += deltaX;
        selectedShape.y += deltaY;
      }
      
      StartX = mouseX;
      StartY = mouseY;
      
      existingShape[selectedShapeIndex] = selectedShape;
      ClearCanvas(existingShape, ctx, canvas);
      drawSelectionHandles(selectedShape);
    }
    // Update cursor based on handle
    else if (selectedShape) {
      const handle = getResizeHandle(mouseX, mouseY, selectedShape);
      
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
      } else if (isPointInShape(mouseX, mouseY, selectedShape)) {
        canvas.style.cursor = "move";
      } else {
        canvas.style.cursor = "default";
      }
    }
  }
  
  if (Clicked) {
    ClearCanvas(existingShape, ctx, canvas);
    
    if (selectedTool === "pencil" || selectedTool === "eraser") {
      // Draw the current path
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      
      ctx.lineTo(mouseX, mouseY);
      
      if (selectedTool === "pencil") {
        ctx.strokeStyle = currentStrokeColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.stroke();
      } else if (selectedTool === "eraser") {
        ctx.strokeStyle = "rgba(0, 0, 0)";
        ctx.lineWidth = 10;
        ctx.stroke();
      }
      
      currentPath.push({ x: mouseX, y: mouseY });
    } else if (selectedTool === "rect") {
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
    } else if (selectedTool === "circle") {
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
    } else if (selectedTool === "diamond") {
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
    } else if (selectedTool === "line") {
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(StartX, StartY);
      ctx.lineTo(mouseX, mouseY);
      
      ctx.strokeStyle = currentStrokeColor;
      ctx.lineWidth = currentStrokeWidth;
      ctx.stroke();
    } else if (selectedTool === "arrow") {
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
    } else if (selectedTool === "select") {
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

// Function to draw all shapes on the canvas
function ClearCanvas(shapes: Tool[], ctx: CanvasRenderingContext2D|null, canvas: HTMLCanvasElement) {
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  for (const shape of shapes) {
    if (shape.type === "rect") {
      // Apply rotation if exists
      ctx.save();
      if (shape.rotation) {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(shape.rotation);
        ctx.translate(-centerX, -centerY);
      }
      
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.bgColor;
      ctx.lineWidth = shape.strokeWidth;
      
      if (shape.bgColor !== "transparent") {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      }
      
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      ctx.restore();
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.bgColor;
      ctx.lineWidth = shape.strokeWidth;
      
      if (shape.bgColor !== "transparent") {
        ctx.fill();
      }
      
      ctx.stroke();
    } else if (shape.type === "diamond") {
      ctx.save();
      
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      
      if (shape.rotation) {
        ctx.translate(centerX, centerY);
        ctx.rotate(shape.rotation);
        ctx.translate(-centerX, -centerY);
      }
      
      ctx.beginPath();
      ctx.moveTo(centerX, shape.y); // Top
      ctx.lineTo(shape.x + shape.width, centerY); // Right
      ctx.lineTo(centerX, shape.y + shape.height); // Bottom
      ctx.lineTo(shape.x, centerY); // Left
      ctx.closePath();
      
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.bgColor;
      ctx.lineWidth = shape.strokeWidth;
      
      if (shape.bgColor !== "transparent") {
        ctx.fill();
      }
      
      ctx.stroke();
      ctx.restore();
    } else if (shape.type === "line") {
      ctx.beginPath();
      ctx.moveTo(shape.startX, shape.startY);
      ctx.lineTo(shape.endX, shape.endY);
      
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.stroke();
    } else if (shape.type === "arrow") {
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(shape.startX, shape.startY);
      ctx.lineTo(shape.endX, shape.endY);
      
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.stroke();
      
      // Draw the arrowhead
      const headLength = 15;
      const dx = shape.endX - shape.startX;
      const dy = shape.endY - shape.startY;
      const angle = Math.atan2(dy, dx);
      
      ctx.beginPath();
      ctx.moveTo(shape.endX, shape.endY);
      ctx.lineTo(
        shape.endX - headLength * Math.cos(angle - Math.PI / 6),
        shape.endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        shape.endX - headLength * Math.cos(angle + Math.PI / 6),
        shape.endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      
      ctx.fillStyle = shape.color;
      ctx.fill();
    } else if (shape.type === "pencil") {
      if (shape.path.length < 2) continue;
      
      ctx.beginPath();
      ctx.moveTo(shape.path[0].x, shape.path[0].y);
      
      for (let i = 1; i < shape.path.length; i++) {
        ctx.lineTo(shape.path[i].x, shape.path[i].y);
      }
      
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.stroke();
    } else if (shape.type === "eraser") {
      if (shape.path.length < 2) continue;
      
      ctx.beginPath();
      ctx.moveTo(shape.path[0].x, shape.path[0].y);
      
      for (let i = 1; i < shape.path.length; i++) {
        ctx.lineTo(shape.path[i].x, shape.path[i].y);
      }
      
      ctx.strokeStyle = "rgba(0, 0, 0)";
      ctx.lineWidth = shape.strokeWidth;
      ctx.stroke();
    } else if (shape.type === "text") {
      ctx.save();
      
      if (shape.rotation) {
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);
        ctx.translate(-shape.x, -shape.y);
      }
      
      ctx.font = `${shape.size}px Arial`;
      ctx.fillStyle = shape.color;
      
      
      if (shape.bgColor !== "transparent") {
        const metrics = ctx.measureText(shape.text);
        const textWidth = metrics.width;
        const textHeight = shape.size;
        
        ctx.fillStyle = shape.bgColor;
        ctx.fillRect(shape.x, shape.y - textHeight, textWidth, textHeight);
        ctx.fillStyle = shape.color;
      }
      
      ctx.fillText(shape.text, shape.x, shape.y);
      ctx.restore();
    } else if (shape.type === "select" && shape !== selectedShape) {
      // Don't display selection rectangle unless it's being drawn
      continue;
    }
  }
}

// Function to save shapes to localStorage
function saveShapesToStorage(shapes: Tool[], roomId: string) {
  localStorage.setItem(`drawing_${roomId}`, JSON.stringify(shapes));
}

// Function to load shapes from localStorage
function loadShapesFromStorage(roomId: string): Tool[] {
  const shapesJSON = localStorage.getItem(`drawing_${roomId}`);
  return shapesJSON ? JSON.parse(shapesJSON) : [];
}

// Create the toolbar element
function createToolbar() {
  const toolbar = document.createElement("div");
  toolbar.style.position = "fixed";
  toolbar.style.bottom = "20px";
  toolbar.style.left = "50%";
  toolbar.style.transform = "translateX(-50%)";
  toolbar.style.backgroundColor = "#333";
  toolbar.style.borderRadius = "8px";
  toolbar.style.padding = "10px";
  toolbar.style.display = "flex";
  toolbar.style.gap = "10px";
  toolbar.style.zIndex = "1000";
  
  // Create tool buttons
  const tools: ToolType[] = ["rect", "circle", "diamond", "line", "arrow", "pencil", "text", "eraser", "select"];
  
  tools.forEach(tool => {
    const button = document.createElement("button");
    button.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
    button.style.backgroundColor = tool === selectedTool ? "#666" : "#444";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.padding = "8px 12px";
    button.style.cursor = "pointer";
    
    button.addEventListener("click", () => {
      // Update selected tool
      selectTool(tool);
      
      // Update button styles
      document.querySelectorAll("#toolbar button").forEach(btn => {
        (btn as HTMLElement).style.backgroundColor = "#444";
      });
      button.style.backgroundColor = "#666";
    });
    
    toolbar.appendChild(button);
  });
  
  toolbar.id = "toolbar";
  document.body.appendChild(toolbar);
}

// Create the style toolbar
function createStyleToolbar() {
    const styleToolbar = document.createElement("div");
    styleToolbar.style.position = "fixed";
    styleToolbar.style.top = "20px";
    styleToolbar.style.right = "20px";
    styleToolbar.style.backgroundColor = "#1e1e1e";
    styleToolbar.style.borderRadius = "12px";
    styleToolbar.style.padding = "16px";
    styleToolbar.style.display = "flex";
    styleToolbar.style.flexDirection = "column";
    styleToolbar.style.gap = "16px";
    styleToolbar.style.zIndex = "1000";
    styleToolbar.style.width = "240px";
    styleToolbar.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
    
    // Section Label Style
    const createSectionLabel = (text: string): HTMLDivElement => {
      const label = document.createElement("div");
      label.textContent = text;
      label.style.color = "white";
      label.style.fontSize = "16px";
      label.style.fontWeight = "500";
      label.style.marginBottom = "8px";
      return label;
    };
    
    // Create Color Button Style
    const createColorButton = (color: string, selected = false): HTMLDivElement => {
      const button = document.createElement("div");
      button.style.width = "36px";
      button.style.height = "36px";
      button.style.backgroundColor = color;
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.style.transition = "transform 0.2s, box-shadow 0.2s";
      
      if (selected) {
        button.style.border = "2px solid #8080ff";
        button.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
      } else {
        button.style.border = "2px solid transparent";
      }
      
      button.addEventListener("mouseover", () => {
        button.style.transform = "scale(1.05)";
      });
      
      button.addEventListener("mouseout", () => {
        button.style.transform = "scale(1)";
      });
      
      return button;
    };
    
    // Stroke color section
    styleToolbar.appendChild(createSectionLabel("Stroke"));
    
    const strokeColorContainer = document.createElement("div");
    strokeColorContainer.style.display = "flex";
    strokeColorContainer.style.gap = "8px";
    strokeColorContainer.style.flexWrap = "wrap";
    
    const strokeColors = ["#e0e0e0", "#ff8080", "#4caf50", "#4d88ff", "#b36b00", "#ff7f7f"];
    let selectedStrokeButton: HTMLDivElement | null = null;
    
    strokeColors.forEach((color, index) => {
      const isSelected = color === currentStrokeColor || 
                         (index === 0 && currentStrokeColor === "white");
      const colorButton = createColorButton(color, isSelected);
      
      if (isSelected) {
        selectedStrokeButton = colorButton;
      }
      
      colorButton.addEventListener("click", () => {
        setStrokeColor(color);
        
        if (selectedStrokeButton) {
          selectedStrokeButton.style.border = "2px solid transparent";
          selectedStrokeButton.style.boxShadow = "none";
        }
        
        colorButton.style.border = "2px solid #8080ff";
        colorButton.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
        selectedStrokeButton = colorButton;
      });
      
      strokeColorContainer.appendChild(colorButton);
    });
    
    styleToolbar.appendChild(strokeColorContainer);
    
    // Background color section
    styleToolbar.appendChild(createSectionLabel("Background"));
    
    const bgColorContainer = document.createElement("div");
    bgColorContainer.style.display = "flex";
    bgColorContainer.style.gap = "8px";
    bgColorContainer.style.flexWrap = "wrap";
    
    const bgColors = [
        "transparent", 
        "#ffb3b3", 
        "#b3ffb3",   
        "#b3d9ff",  
        "#ffe6b3",    
        "#e6b3ff",    
        "#b3fff0"   
      ];
    let selectedBgButton: HTMLDivElement | null = null;
    
    bgColors.forEach((color, index) => {
      const isSelected = color === currentBgColor;
      const colorButton = createColorButton(color === "transparent" ? "#ffffff" : color, isSelected);
      
      if (color === "transparent") {
        // Create crosshatch pattern for transparent
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.borderRadius = "6px";
        
        const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        pattern.setAttribute("id", "crosshatch");
        pattern.setAttribute("width", "8");
        pattern.setAttribute("height", "8");
        pattern.setAttribute("patternUnits", "userSpaceOnUse");
        
        const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path1.setAttribute("d", "M0,0 L8,8");
        path1.setAttribute("stroke", "#999");
        path1.setAttribute("stroke-width", "1");
        
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path2.setAttribute("d", "M8,0 L0,8");
        path2.setAttribute("stroke", "#999");
        path2.setAttribute("stroke-width", "1");
        
        pattern.appendChild(path1);
        pattern.appendChild(path2);
        
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");
        rect.setAttribute("fill", "url(#crosshatch)");
        
        svg.appendChild(pattern);
        svg.appendChild(rect);
        colorButton.appendChild(svg);
        colorButton.style.position = "relative";
      }
      
      if (isSelected) {
        selectedBgButton = colorButton;
      }
      
      colorButton.addEventListener("click", () => {
        setBgColor(color);
        
        if (selectedBgButton) {
          selectedBgButton.style.border = "2px solid transparent";
          selectedBgButton.style.boxShadow = "none";
        }
        
        colorButton.style.border = "2px solid #8080ff";
        colorButton.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
        selectedBgButton = colorButton;
      });
      
      bgColorContainer.appendChild(colorButton);
    });
    
    styleToolbar.appendChild(bgColorContainer);
    
    // Stroke width section
    styleToolbar.appendChild(createSectionLabel("Stroke width"));
    
    const strokeWidthContainer = document.createElement("div");
    strokeWidthContainer.style.display = "flex";
    strokeWidthContainer.style.alignItems = "center";
    strokeWidthContainer.style.gap = "10px";
    
    const strokeWidthSlider = document.createElement("input");
    strokeWidthSlider.type = "range";
    strokeWidthSlider.min = "1";
    strokeWidthSlider.max = "20";
    strokeWidthSlider.value = currentStrokeWidth.toString();
    strokeWidthSlider.style.flexGrow = "1";
    strokeWidthSlider.style.appearance = "none";
    strokeWidthSlider.style.height = "6px";
    strokeWidthSlider.style.borderRadius = "3px";
    strokeWidthSlider.style.background = "linear-gradient(to right, #464684 0%, #8080ff 100%)";
    
    // Style for slider thumb
    strokeWidthSlider.style.webkitAppearance = "none";
    const thumbStyle = `
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #e0e0e0;
      cursor: pointer;
      border: none;
    `;
    
    strokeWidthSlider.innerHTML = `
      <style>
        input[type=range]::-webkit-slider-thumb {${thumbStyle}}
        input[type=range]::-moz-range-thumb {${thumbStyle}}
        input[type=range]::-ms-thumb {${thumbStyle}}
      </style>
    `;
    
    const strokeWidthValue = document.createElement("span");
    strokeWidthValue.textContent = currentStrokeWidth.toString();
    strokeWidthValue.style.color = "white";
    strokeWidthValue.style.minWidth = "30px";
    strokeWidthValue.style.textAlign = "center";
    strokeWidthValue.style.backgroundColor = "#2a2a3c";
    strokeWidthValue.style.padding = "4px 8px";
    strokeWidthValue.style.borderRadius = "4px";
    strokeWidthValue.style.fontSize = "14px";
    
    strokeWidthSlider.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const width = parseInt(target.value);
      setStrokeWidth(width);
      strokeWidthValue.textContent = width.toString();
    });
    
    strokeWidthContainer.appendChild(strokeWidthSlider);
    strokeWidthContainer.appendChild(strokeWidthValue);
    styleToolbar.appendChild(strokeWidthContainer);
    
    // Actions section
    styleToolbar.appendChild(createSectionLabel("Actions"));
    
    const actionsContainer = document.createElement("div");
    actionsContainer.style.display = "flex";
    actionsContainer.style.gap = "10px";
    actionsContainer.style.flexDirection = "column";
    
    // Delete selected button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete Selected";
    deleteButton.style.backgroundColor = "#8b64f5";
    deleteButton.style.color = "white";
    deleteButton.style.border = "none";
    deleteButton.style.borderRadius = "6px";
    deleteButton.style.padding = "10px";
    deleteButton.style.cursor = "pointer";
    deleteButton.style.fontWeight = "500";
    deleteButton.style.transition = "background-color 0.2s";
    
    deleteButton.addEventListener("mouseover", () => {
      deleteButton.style.backgroundColor = "#e53935";
    });
    
    deleteButton.addEventListener("mouseout", () => {
      deleteButton.style.backgroundColor = "#f44336";
    });
    
    deleteButton.addEventListener("click", () => {
      if (selectedShape && selectedShapeIndex >= 0) {
        existingShape.splice(selectedShapeIndex, 1);
        selectedShape = null;
        selectedShapeIndex = -1;
        saveShapesToStorage(existingShape, roomId);
        ClearCanvas(existingShape, ctx, canvas);
      }
    });
    
    // Clear all button
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear All";
    clearButton.style.backgroundColor = "#8b64f5";
    clearButton.style.color = "white";
    clearButton.style.border = "none";
    clearButton.style.borderRadius = "6px";
    clearButton.style.padding = "10px";
    clearButton.style.cursor = "pointer";
    clearButton.style.fontWeight = "500";
    clearButton.style.transition = "background-color 0.2s";
    
    clearButton.addEventListener("mouseover", () => {
      clearButton.style.backgroundColor = "#6d4c41";
    });
    
    clearButton.addEventListener("mouseout", () => {
      clearButton.style.backgroundColor = "#795548";
    });
    
    clearButton.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all shapes?")) {
        existingShape = [];
        selectedShape = null;
        selectedShapeIndex = -1;
        saveShapesToStorage(existingShape, roomId);
        ClearCanvas(existingShape, ctx, canvas);
      }
    });
    
    actionsContainer.appendChild(deleteButton);
    actionsContainer.appendChild(clearButton);
    styleToolbar.appendChild(actionsContainer);
    
    styleToolbar.id = "styleToolbar";
    document.body.appendChild(styleToolbar);
    
    return styleToolbar;
  }
// Create the toolbars

createStyleToolbar();

// Return functions for external access
return {
  selectTool,
  setStrokeColor,
  setBgColor,
  setStrokeWidth
};
}