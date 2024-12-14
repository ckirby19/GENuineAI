// src/frontend/components/DrawingCanvas.tsx
import React from 'react';
import { useRef } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import styled from 'styled-components';
  
  const CanvasContainer = styled.div`
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    touch-action: none;
  `;
  
  const Button = styled.button`
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: #357abd;
    }
  `;
  
  interface DrawingCanvasProps {
    onSubmit: (drawing: string) => void;
  }
  
  export const DrawingCanvas = ({ onSubmit }: DrawingCanvasProps) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
  
    const handleSubmit = async () => {
      if (canvasRef.current) {
        const drawing = await canvasRef.current.exportSvg();
        onSubmit(drawing);
      }
    };

    const handleClear = async () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    };
  
    return (
      <CanvasContainer>
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={3}
          strokeColor="#000000"
          width="90vw"
          height="90vw"
          style={{ border: '1px solid #ccc', borderRadius: '10px' }}
        />
        <Button onClick={handleSubmit}>Submit Drawing</Button>
        <Button onClick={handleClear}>Clear Drawing</Button>
      </CanvasContainer>
    );
  };