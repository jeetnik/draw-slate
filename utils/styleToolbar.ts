import { AppState } from "./state";
import { ClearCanvas } from "./renderUtils";
import{saveShapesToStorage} from "./storage"
import { ToolType } from "./types";


 export function createStyleToolbar(ctx:CanvasRenderingContext2D,canvas:HTMLCanvasElement,state:AppState,roomId:string, setBgColor: (color: string) => void,setStrokeColor:(color:string)=>void,setStrokeWidth:(width:number)=>void) {
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
      const isSelected = color === state.currentStrokeColor || 
                         (index === 0 && state.currentStrokeColor === "white");
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
      const isSelected = color === state.currentBgColor;
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
    strokeWidthSlider.value = state.currentStrokeWidth.toString();
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
    strokeWidthValue.textContent = state.currentStrokeWidth.toString();
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
      deleteButton.style.backgroundColor = "#6d4c41";
    });
    
    deleteButton.addEventListener("mouseout", () => {
      deleteButton.style.backgroundColor = "#8b64f5";
    });
    
    deleteButton.addEventListener("click", () => {
      if (state.selectedShape && state.selectedShapeIndex >= 0) {
        state.existingShape.splice(state.selectedShapeIndex, 1);
        state.selectedShape = null;
        state.selectedShapeIndex = -1;
        saveShapesToStorage(state.existingShape, roomId);
        ClearCanvas(state.existingShape, ctx, canvas,state);
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
      clearButton.style.backgroundColor = " #e53935";
    });
    
    clearButton.addEventListener("mouseout", () => {
      clearButton.style.backgroundColor = "#8b64f5";
    });
    
    clearButton.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all shapes?")) {
        state.existingShape = [];
        state.selectedShape = null;
        state.selectedShapeIndex = -1;
        saveShapesToStorage(state.existingShape, roomId);
        ClearCanvas(state.existingShape, ctx, canvas,state);
      }
    });
    
    actionsContainer.appendChild(deleteButton);
    actionsContainer.appendChild(clearButton);
    styleToolbar.appendChild(actionsContainer);
    
    styleToolbar.id = "styleToolbar";
    document.body.appendChild(styleToolbar);
    
    return styleToolbar;
  }