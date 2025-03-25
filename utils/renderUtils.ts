import { Tool, ToolType } from "./types";
import { AppState } from "./state";
export function ClearCanvas(shapes: Tool[], ctx: CanvasRenderingContext2D|null, canvas: HTMLCanvasElement, state: AppState) {
    if (!ctx) return;
    ctx.save();
  

  // Reset transform
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply current transform
  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(state.scale, state.scale);
 
 
  
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 255)"
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
      } else if (shape.type === "select" && shape !== state.selectedShape) {
        // Don't display selection rectangle unless it's being drawn
        continue;
      }
    }ctx.restore();
   
  }
  