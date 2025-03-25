import { Tool } from "./types";
export function saveShapesToStorage(shapes: Tool[], roomId: string) {
    localStorage.setItem(`drawing_${roomId}`, JSON.stringify(shapes));
  }
  
  // Function to load shapes from localStorage
  export function loadShapesFromStorage(roomId: string): Tool[] {
    const shapesJSON = localStorage.getItem(`drawing_${roomId}`);
    return shapesJSON ? JSON.parse(shapesJSON) : [];
  }