import { AppState } from "./state";
import { ToolType } from "./types";
import { Tool } from "./types";
export function createToolbar(state:AppState, selectTool: (tool: ToolType) => void) {
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
      button.style.backgroundColor = tool === state.selectedTool ? "#666" : "#444";
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