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
    const createColorButton = (color: string, selected = false, label = ""): HTMLDivElement => {
      const button = document.createElement("div");
      button.style.width = "36px";
      button.style.height = "36px";
      button.style.backgroundColor = color;
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.style.transition = "transform 0.2s, box-shadow 0.2s";
      button.style.position = "relative";
      
      if (selected) {
        button.style.border = "2px solid #8080ff";
        button.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
      } else {
        button.style.border = "2px solid transparent";
      }
      
      // Add label if provided
      if (label) {
        const labelElement = document.createElement("span");
        labelElement.textContent = label;
        labelElement.style.position = "absolute";
        labelElement.style.top = "50%";
        labelElement.style.left = "50%";
        labelElement.style.transform = "translate(-50%, -50%)";
        labelElement.style.color = getContrastColor(color);
        labelElement.style.fontSize = "12px";
        labelElement.style.fontWeight = "bold";
        button.appendChild(labelElement);
      }
      
      button.addEventListener("mouseover", () => {
        button.style.transform = "scale(1.05)";
      });
      
      button.addEventListener("mouseout", () => {
        button.style.transform = "scale(1)";
      });
      
      return button;
    };
    
    // Helper function to determine high-contrast text color
    const getContrastColor = (hexColor: string): string => {
      // For transparent
      if (hexColor === "transparent") return "#000000";
      
      // Remove # if present
      const hex = hexColor.replace('#', '');
      
      // Convert to RGB
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      
      // Calculate perceived brightness
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // Return black or white based on brightness
      return brightness > 128 ? "#000000" : "#FFFFFF";
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
    
    const bgColors = ["transparent", "#802020", "#005000", "#003366", "#663300"];
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
    
    // Fill style section (based on screenshot)
    styleToolbar.appendChild(createSectionLabel("Fill"));
    
    const fillStyleContainer = document.createElement("div");
    fillStyleContainer.style.display = "flex";
    fillStyleContainer.style.gap = "8px";
    fillStyleContainer.style.flexWrap = "wrap";
    
    // Create fill style buttons
    const fillStyles = [
      { id: "solid", icon: "⬛" },
      { id: "pattern", icon: "🔳" },
      { id: "gradient", icon: "🎨" }
    ];
    
    let selectedFillButton: HTMLDivElement | null = null;
    
    fillStyles.forEach((style, index) => {
      const button = document.createElement("div");
      button.style.width = "36px";
      button.style.height = "36px";
      button.style.backgroundColor = "#2a2a3c";
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.style.display = "flex";
      button.style.justifyContent = "center";
      button.style.alignItems = "center";
      button.style.border = index === 0 ? "2px solid #8080ff" : "2px solid transparent";
      button.style.boxShadow = index === 0 ? "0 0 0 2px rgba(128, 128, 255, 0.3)" : "none";
      
      // Create pattern or icon based on fill style
      if (style.id === "solid") {
        const solidIcon = document.createElement("div");
        solidIcon.style.width = "20px";
        solidIcon.style.height = "20px";
        solidIcon.style.backgroundColor = "#ffffff";
        solidIcon.style.borderRadius = "2px";
        button.appendChild(solidIcon);
      } else if (style.id === "pattern") {
        const patternIcon = document.createElement("div");
        patternIcon.style.width = "20px";
        patternIcon.style.height = "20px";
        patternIcon.style.backgroundColor = "#ffffff";
        patternIcon.style.borderRadius = "2px";
        patternIcon.style.backgroundImage = "repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 4px)";
        button.appendChild(patternIcon);
      } else if (style.id === "gradient") {
        const gradientIcon = document.createElement("div");
        gradientIcon.style.width = "20px";
        gradientIcon.style.height = "20px";
        gradientIcon.style.borderRadius = "2px";
        gradientIcon.style.backgroundColor = "#8b64f5";
        button.appendChild(gradientIcon);
      }
      
      if (index === 0) {
        selectedFillButton = button;
      }
      
      button.addEventListener("click", () => {
        // Set fill style (implement your logic here)
        if (selectedFillButton) {
          selectedFillButton.style.border = "2px solid transparent";
          selectedFillButton.style.boxShadow = "none";
        }
        
        button.style.border = "2px solid #8080ff";
        button.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
        selectedFillButton = button;
      });
      
      fillStyleContainer.appendChild(button);
    });
    
    styleToolbar.appendChild(fillStyleContainer);
    
    // Stroke width section
    styleToolbar.appendChild(createSectionLabel("Stroke width"));
    
    const strokeWidthContainer = document.createElement("div");
    strokeWidthContainer.style.display = "flex";
    strokeWidthContainer.style.gap = "8px";
    strokeWidthContainer.style.flexWrap = "wrap";
    
    // Create stroke width buttons
    const strokeWidths = [2, 4, 8];
    let selectedWidthButton: HTMLDivElement | null = null;
    
    strokeWidths.forEach((width, index) => {
      const button = document.createElement("div");
      button.style.width = "36px";
      button.style.height = "36px";
      button.style.backgroundColor = "#2a2a3c";
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.style.display = "flex";
      button.style.justifyContent = "center";
      button.style.alignItems = "center";
      button.style.border = width === currentStrokeWidth ? "2px solid #8080ff" : "2px solid transparent";
      button.style.boxShadow = width === currentStrokeWidth ? "0 0 0 2px rgba(128, 128, 255, 0.3)" : "none";
      
      const line = document.createElement("div");
      line.style.width = "20px";
      line.style.height = `${width}px`;
      line.style.backgroundColor = "#ffffff";
      line.style.borderRadius = "1px";
      button.appendChild(line);
      
      if (width === currentStrokeWidth) {
        selectedWidthButton = button;
      }
      
      button.addEventListener("click", () => {
        setStrokeWidth(width);
        
        if (selectedWidthButton) {
          selectedWidthButton.style.border = "2px solid transparent";
          selectedWidthButton.style.boxShadow = "none";
        }
        
        button.style.border = "2px solid #8080ff";
        button.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
        selectedWidthButton = button;
      });
      
      strokeWidthContainer.appendChild(button);
    });
    
    styleToolbar.appendChild(strokeWidthContainer);
    
    // Stroke style section
    styleToolbar.appendChild(createSectionLabel("Stroke style"));
    
    const strokeStyleContainer = document.createElement("div");
    strokeStyleContainer.style.display = "flex";
    strokeStyleContainer.style.gap = "8px";
    strokeStyleContainer.style.flexWrap = "wrap";
    
    // Create stroke style buttons
    const strokeStyles = [
      { id: "solid", pattern: [] },
      { id: "dashed", pattern: [5, 5] },
      { id: "dotted", pattern: [2, 2] },
    ];
    
    let selectedStyleButton: HTMLDivElement | null = null;
    
    strokeStyles.forEach((style, index) => {
      const button = document.createElement("div");
      button.style.width = "36px";
      button.style.height = "36px";
      button.style.backgroundColor = "#2a2a3c";
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.style.display = "flex";
      button.style.justifyContent = "center";
      button.style.alignItems = "center";
      button.style.border = index === 0 ? "2px solid #8080ff" : "2px solid transparent";
      button.style.boxShadow = index === 0 ? "0 0 0 2px rgba(128, 128, 255, 0.3)" : "none";
      
      // Create SVG for stroke style visualization
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "24");
      svg.setAttribute("height", "2");
      svg.style.overflow = "visible";
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "1");
      line.setAttribute("x2", "24");
      line.setAttribute("y2", "1");
      line.setAttribute("stroke", "#ffffff");
      line.setAttribute("stroke-width", "2");
      
      if (style.id === "dashed") {
        line.setAttribute("stroke-dasharray", "5,5");
      } else if (style.id === "dotted") {
        line.setAttribute("stroke-dasharray", "2,2");
      }
      
      svg.appendChild(line);
      button.appendChild(svg);
      
      if (index === 0) {
        selectedStyleButton = button;
      }
      
      button.addEventListener("click", () => {
        // Set stroke style (implement your logic here)
        if (selectedStyleButton) {
          selectedStyleButton.style.border = "2px solid transparent";
          selectedStyleButton.style.boxShadow = "none";
        }
        
        button.style.border = "2px solid #8080ff";
        button.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
        selectedStyleButton = button;
      });
      
      strokeStyleContainer.appendChild(button);
    });
    
    styleToolbar.appendChild(strokeStyleContainer);
    
    // ADD NEW FEATURE: Color Picker Panel (based on screenshot)
    const colorPickerPanel = document.createElement("div");
    colorPickerPanel.style.position = "fixed";
    colorPickerPanel.style.top = "20px";
    colorPickerPanel.style.right = "280px";
    colorPickerPanel.style.backgroundColor = "#1e1e1e";
    colorPickerPanel.style.borderRadius = "12px";
    colorPickerPanel.style.padding = "16px";
    colorPickerPanel.style.display = "flex";
    colorPickerPanel.style.flexDirection = "column";
    colorPickerPanel.style.gap = "16px";
    colorPickerPanel.style.zIndex = "999";
    colorPickerPanel.style.width = "360px";
    colorPickerPanel.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
    
    // Colors section
    colorPickerPanel.appendChild(createSectionLabel("Colors"));
    
    const colorsGrid = document.createElement("div");
    colorsGrid.style.display = "grid";
    colorsGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
    colorsGrid.style.gap = "8px";
    
    // Create color buttons with labels
    const colorLabels = [
      { color: "transparent", label: "q" },
      { color: "#000000", label: "w" },
      { color: "#c0c0c0", label: "e" },
      { color: "#808080", label: "r" },
      { color: "#a89090", label: "t" },
      { color: "#66b2b2", label: "a" },
      { color: "#4d88ff", label: "s" },
      { color: "#b19cd9", label: "d" },
      { color: "#ffb3ff", label: "f" },
      { color: "#ff9999", label: "g" },
      { color: "#66cc66", label: "z" },
      { color: "#66b2b2", label: "x" },
      { color: "#b36b00", label: "c" },
      { color: "#e55c5c", label: "v" },
      { color: "#ff9999", label: "b" }
    ];
    
    let selectedColorPickerButton: HTMLDivElement | null = null;
    
    colorLabels.forEach((item) => {
      let colorButton;
      
      if (item.color === "transparent") {
        colorButton = createColorButton("#ffffff", false, item.label);
        // Create crosshatch pattern for transparent
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.borderRadius = "6px";
        svg.style.zIndex = "-1";
        
        const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        pattern.setAttribute("id", `crosshatch-${item.label}`);
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
        rect.setAttribute("fill", `url(#crosshatch-${item.label})`);
        
        svg.appendChild(pattern);
        svg.appendChild(rect);
        colorButton.appendChild(svg);
      } else {
        colorButton = createColorButton(item.color, false, item.label);
      }
      
      colorButton.style.borderRadius = "8px";
      
      colorButton.addEventListener("click", () => {
        // Set the active color
        const colorToUse = item.color === "transparent" ? "transparent" : item.color;
        setStrokeColor(colorToUse);
        setBgColor(colorToUse);
        
        if (selectedColorPickerButton) {
          selectedColorPickerButton.style.border = "2px solid transparent";
          selectedColorPickerButton.style.boxShadow = "none";
        }
        
        colorButton.style.border = "2px solid #8080ff";
        colorButton.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
        selectedColorPickerButton = colorButton;
        
        // Also update the main toolbar buttons
        if (selectedStrokeButton) {
          selectedStrokeButton.style.border = "2px solid transparent";
          selectedStrokeButton.style.boxShadow = "none";
        }
        
        if (selectedBgButton) {
          selectedBgButton.style.border = "2px solid transparent";
          selectedBgButton.style.boxShadow = "none";
        }
      });
      
      colorsGrid.appendChild(colorButton);
    });
    
    colorPickerPanel.appendChild(colorsGrid);
    
    // Shades section
    colorPickerPanel.appendChild(createSectionLabel("Shades"));
    
    const shadesContainer = document.createElement("div");
    shadesContainer.style.display = "flex";
    shadesContainer.style.gap = "8px";
    shadesContainer.style.flexWrap = "wrap";
    
    // Create shade buttons with house icon and numbers
    const shades = [
      { color: "#1a1a1a", level: "1" },
      { color: "#4d3333", level: "2" },
      { color: "#804d4d", level: "3" },
      { color: "#cc6666", level: "4" },
      { color: "#ff8080", level: "5" }
    ];
    
    let selectedShadeButton: HTMLDivElement | null = null;
    
    shades.forEach((shade) => {
      const button = document.createElement("div");
      button.style.width = "36px";
      button.style.height = "36px";
      button.style.backgroundColor = shade.color;
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.style.position = "relative";
      button.style.border = "2px solid transparent";
      button.style.display = "flex";
      button.style.justifyContent = "center";
      button.style.alignItems = "center";
      
      // Create house icon with number
      const iconContainer = document.createElement("div");
      iconContainer.style.display = "flex";
      iconContainer.style.flexDirection = "column";
      iconContainer.style.alignItems = "center";
      
      const houseIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      houseIcon.setAttribute("width", "16");
      houseIcon.setAttribute("height", "14");
      houseIcon.setAttribute("viewBox", "0 0 16 14");
      houseIcon.style.fill = "none";
      
      const housePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      housePath.setAttribute("d", "M8 0L0 6H2V14H14V6H16L8 0Z");
      housePath.setAttribute("fill", getContrastColor(shade.color));
      
      houseIcon.appendChild(housePath);
      
      const shadeNumber = document.createElement("span");
      shadeNumber.textContent = shade.level;
      shadeNumber.style.color = getContrastColor(shade.color);
      shadeNumber.style.fontSize = "10px";
      shadeNumber.style.fontWeight = "bold";
      
      iconContainer.appendChild(houseIcon);
      iconContainer.appendChild(shadeNumber);
      button.appendChild(iconContainer);
      
      button.addEventListener("click", () => {
        // Set the shade color
        setStrokeColor(shade.color);
        setBgColor(shade.color);
        
        if (selectedShadeButton) {
          selectedShadeButton.style.border = "2px solid transparent";
          selectedShadeButton.style.boxShadow = "none";
        }
        
        button.style.border = "2px solid #8080ff";
        button.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
        selectedShadeButton = button;
        
        // Also update the main toolbar buttons
        if (selectedStrokeButton) {
          selectedStrokeButton.style.border = "2px solid transparent";
          selectedStrokeButton.style.boxShadow = "none";
        }
        
        if (selectedBgButton) {
          selectedBgButton.style.border = "2px solid transparent";
          selectedBgButton.style.boxShadow = "none";
        }
      });
      
      shadesContainer.appendChild(button);
    });
    
    colorPickerPanel.appendChild(shadesContainer);
    
    // Hex code input section
    colorPickerPanel.appendChild(createSectionLabel("Hex code"));
    
    const hexCodeContainer = document.createElement("div");
    hexCodeContainer.style.display = "flex";
    hexCodeContainer.style.alignItems = "center";
    hexCodeContainer.style.gap = "10px";
    
    const hexLabel = document.createElement("span");
    hexLabel.textContent = "#";
    hexLabel.style.color = "white";
    hexLabel.style.fontSize = "18px";
    hexLabel.style.fontWeight = "bold";
    
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.value = "e03131"; // Default value matching screenshot
    hexInput.style.backgroundColor = "#2a2a3c";
    hexInput.style.color = "white";
    hexInput.style.border = "none";
    hexInput.style.borderRadius = "6px";
    hexInput.style.padding = "8px 12px";
    hexInput.style.fontSize = "16px";
    hexInput.style.flexGrow = "1";
    
    const colorPreview = document.createElement("div");
    colorPreview.style.width = "36px";
    colorPreview.style.height = "36px";
    colorPreview.style.backgroundColor = "#e03131";
    colorPreview.style.borderRadius = "8px";
    colorPreview.style.cursor = "pointer";
    colorPreview.style.border = "2px solid transparent";
    
    colorPreview.addEventListener("click", () => {
      // Apply the hex color
      const hexColor = `#${hexInput.value}`;
      setStrokeColor(hexColor);
      setBgColor(hexColor);
    });
    
    hexInput.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      let hex = input.value.replace(/[^0-9a-fA-F]/g, "").substring(0, 6);
      input.value = hex;
      
      if (hex.length === 6) {
        colorPreview.style.backgroundColor = `#${hex}`;
      }
    });
    
    hexCodeContainer.appendChild(hexLabel);
    hexCodeContainer.appendChild(hexInput);
    hexCodeContainer.appendChild(colorPreview);
    
    colorPickerPanel.appendChild(hexCodeContainer);
    
    // Add color picker panel to document
    document.body.appendChild(colorPickerPanel);
    
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
              drawCanvas();
            }
          });
          
          actionsContainer.appendChild(deleteButton);
          
          // Clear all button
          const clearAllButton = document.createElement("button");
          clearAllButton.textContent = "Clear All";
          clearAllButton.style.backgroundColor = "#f44336";
          clearAllButton.style.color = "white";
          clearAllButton.style.border = "none";
          clearAllButton.style.borderRadius = "6px";
          clearAllButton.style.padding = "10px";
          clearAllButton.style.cursor = "pointer";
          clearAllButton.style.fontWeight = "500";
          clearAllButton.style.transition = "background-color 0.2s";
          
          clearAllButton.addEventListener("mouseover", () => {
            clearAllButton.style.backgroundColor = "#d32f2f";
          });
          
          clearAllButton.addEventListener("mouseout", () => {
            clearAllButton.style.backgroundColor = "#f44336";
          });
          
          clearAllButton.addEventListener("click", () => {
            existingShape = [];
            selectedShape = null;
            selectedShapeIndex = -1;
            drawCanvas();
          });
          
          actionsContainer.appendChild(clearAllButton);
          
          // Toggle color picker button
          const toggleColorPickerButton = document.createElement("button");
          toggleColorPickerButton.textContent = "Advanced Color Picker";
          toggleColorPickerButton.style.backgroundColor = "#4a4a5e";
          toggleColorPickerButton.style.color = "white";
          toggleColorPickerButton.style.border = "none";
          toggleColorPickerButton.style.borderRadius = "6px";
          toggleColorPickerButton.style.padding = "10px";
          toggleColorPickerButton.style.cursor = "pointer";
          toggleColorPickerButton.style.fontWeight = "500";
          toggleColorPickerButton.style.transition = "background-color 0.2s";
          
          let colorPickerVisible = true; // Initially visible based on code above
          
          toggleColorPickerButton.addEventListener("mouseover", () => {
            toggleColorPickerButton.style.backgroundColor = "#5a5a6e";
          });
          
          toggleColorPickerButton.addEventListener("mouseout", () => {
            toggleColorPickerButton.style.backgroundColor = "#4a4a5e";
          });
          
          toggleColorPickerButton.addEventListener("click", () => {
            colorPickerVisible = !colorPickerVisible;
            colorPickerPanel.style.display = colorPickerVisible ? "flex" : "none";
            toggleColorPickerButton.textContent = colorPickerVisible ? "Hide Color Picker" : "Advanced Color Picker";
          });
          
          actionsContainer.appendChild(toggleColorPickerButton);
          
          styleToolbar.appendChild(actionsContainer);
          
          // Add tooltip functionality for all buttons
          const addTooltip = (element, text) => {
            element.addEventListener("mouseenter", (e) => {
              const tooltip = document.createElement("div");
              tooltip.textContent = text;
              tooltip.style.position = "absolute";
              tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              tooltip.style.color = "white";
              tooltip.style.padding = "5px 10px";
              tooltip.style.borderRadius = "4px";
              tooltip.style.fontSize = "12px";
              tooltip.style.zIndex = "1001";
              tooltip.style.pointerEvents = "none";
              tooltip.style.whiteSpace = "nowrap";
              
              document.body.appendChild(tooltip);
              
              const updatePosition = () => {
                const rect = element.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
              };
              
              updatePosition();
              
              element.tooltipElement = tooltip;
              
              // Update position if window is resized
              window.addEventListener("resize", updatePosition);
            });
            
            element.addEventListener("mouseleave", () => {
              if (element.tooltipElement) {
                document.body.removeChild(element.tooltipElement);
                element.tooltipElement = null;
              }
            });
          };
          
          // Add tooltips to buttons
          addTooltip(deleteButton, "Delete selected shape");
          addTooltip(clearAllButton, "Clear all shapes");
          addTooltip(toggleColorPickerButton, "Toggle advanced color picker");
          
          // Add keyboard shortcuts
          document.addEventListener("keydown", (e) => {
            // Delete selected with Delete key
            if (e.key === "Delete" && selectedShape && selectedShapeIndex >= 0) {
              existingShape.splice(selectedShapeIndex, 1);
              selectedShape = null;
              selectedShapeIndex = -1;
              drawCanvas();
            }
            
            // Check for color shortcut keys
            colorLabels.forEach(item => {
              if (e.key === item.label) {
                const colorToUse = item.color === "transparent" ? "transparent" : item.color;
                setStrokeColor(colorToUse);
                setBgColor(colorToUse);
                
                // Update UI to show selected color
                if (selectedColorPickerButton) {
                  selectedColorPickerButton.style.border = "2px solid transparent";
                  selectedColorPickerButton.style.boxShadow = "none";
                }
                
                // Find and update the corresponding button in the color picker
                const buttons = colorsGrid.childNodes;
                for (let i = 0; i < buttons.length; i++) {
                  const button = buttons[i] as HTMLDivElement;
                  if (button.querySelector("span")?.textContent === item.label) {
                    button.style.border = "2px solid #8080ff";
                    button.style.boxShadow = "0 0 0 2px rgba(128, 128, 255, 0.3)";
                    selectedColorPickerButton = button;
                    break;
                  }
                }
                
                // Update main toolbar buttons
                if (selectedStrokeButton) {
                  selectedStrokeButton.style.border = "2px solid transparent";
                  selectedStrokeButton.style.boxShadow = "none";
                }
                
                if (selectedBgButton) {
                  selectedBgButton.style.border = "2px solid transparent";
                  selectedBgButton.style.boxShadow = "none";
                }
              }
            });
          });
          
          // Add the toolbar to the document
          document.body.appendChild(styleToolbar);
          
          // Helper functions for setting colors and stroke width
          function setStrokeColor(color) {
            currentStrokeColor = color;
            
            // If shape is selected, update its stroke color
            if (selectedShape && selectedShapeIndex >= 0) {
              selectedShape.strokeColor = color;
              drawCanvas();
            }
          }
          
          function setBgColor(color) {
            currentBgColor = color;
            
            // If shape is selected, update its background color
            if (selectedShape && selectedShapeIndex >= 0) {
              selectedShape.bgColor = color;
              drawCanvas();
            }
          }
          
          function setStrokeWidth(width) {
            currentStrokeWidth = width;
            
            // If shape is selected, update its stroke width
            if (selectedShape && selectedShapeIndex >= 0) {
              selectedShape.strokeWidth = width;
              drawCanvas();
            }
          }
          
          // Make the toolbars draggable
          makeDraggable(styleToolbar);
          makeDraggable(colorPickerPanel);
          
          function makeDraggable(element) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            // Create a draggable header for the element
            const header = document.createElement("div");
            header.style.cursor = "move";
            header.style.padding = "8px";
            header.style.marginBottom = "8px";
            header.style.borderRadius = "8px 8px 0 0";
            header.style.backgroundColor = "#2a2a3c";
            header.style.userSelect = "none";
            
            // Add drag indicator to header
            const dragIndicator = document.createElement("div");
            dragIndicator.style.width = "40px";
            dragIndicator.style.height = "4px";
            dragIndicator.style.backgroundColor = "#555";
            dragIndicator.style.borderRadius = "2px";
            dragIndicator.style.margin = "0 auto";
            
            header.appendChild(dragIndicator);
            
            // Insert the header as the first child
            element.insertBefore(header, element.firstChild);
            
            header.onmousedown = dragMouseDown;
            
            function dragMouseDown(e) {
              e = e || window.event;
              e.preventDefault();
              // Get the mouse cursor position at startup
              pos3 = e.clientX;
              pos4 = e.clientY;
              document.onmouseup = closeDragElement;
              // Call a function whenever the cursor moves
              document.onmousemove = elementDrag;
            }
            
            function elementDrag(e) {
              e = e || window.event;
              e.preventDefault();
              // Calculate the new cursor position
              pos1 = pos3 - e.clientX;
              pos2 = pos4 - e.clientY;
              pos3 = e.clientX;
              pos4 = e.clientY;
              // Set the element's new position
              element.style.top = (element.offsetTop - pos2) + "px";
              element.style.left = (element.offsetLeft - pos1) + "px";
            }
            
            function closeDragElement() {
              // Stop moving when mouse button is released
              document.onmouseup = null;
              document.onmousemove = null;
            }
          }
          
          return { styleToolbar, colorPickerPanel };
      }