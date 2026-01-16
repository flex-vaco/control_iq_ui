import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImageComp } from 'react-konva';

const ImageEditor = React.forwardRef(({ imageUrl, onSave, onCancel, loading, onChanges, readOnly = false }, ref) => {
  const [rectangles, setRectangles] = useState([]);
  const [newRect, setNewRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boxColor, setBoxColor] = useState("#ff0000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [konvaImage, setKonvaImage] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [scale, setScale] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef();
  const canvasContainerRef = useRef();
  const initialRectanglesRef = useRef([]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const container = canvasContainerRef.current;
        setCanvasSize({
          width: container.clientWidth || 800,
          height: container.clientHeight || 600
        });
      }
    };

    const timeoutId = setTimeout(updateCanvasSize, 100);
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  const fitImageToScreen = useCallback(() => {
    if (!konvaImage || !stageRef.current || !canvasContainerRef.current) return;
    
    const stage = stageRef.current;
    const container = canvasContainerRef.current;
    const containerWidth = container.clientWidth || canvasSize.width;
    const containerHeight = container.clientHeight || canvasSize.height;
    
    const imageWidth = konvaImage.width;
    const imageHeight = konvaImage.height;
    
    if (imageWidth === 0 || imageHeight === 0) return;
    
    const padding = 20;
    const scaleX = (containerWidth - padding * 2) / imageWidth;
    const scaleY = (containerHeight - padding * 2) / imageHeight;
    const fitScale = Math.min(scaleX, scaleY, 1); 
    
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    
    const scaledWidth = imageWidth * fitScale;
    const scaledHeight = imageHeight * fitScale;
    const x = (containerWidth - scaledWidth) / 2;
    const y = (containerHeight - scaledHeight) / 2;
    
    stage.scale({ x: fitScale, y: fitScale });
    stage.position({ x, y });
    stage.batchDraw();
    setScale(fitScale);
    setStagePosition({ x, y });
  }, [konvaImage, canvasSize]);

  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setKonvaImage(img);
      };
      img.onerror = () => {
        console.error('Failed to load image from:', imageUrl);
        setKonvaImage(null);
      };
      img.src = imageUrl;
    } else {
      setKonvaImage(null);
    }
    setRectangles([]);
    setNewRect(null);
    setUndoStack([]);
    setRedoStack([]);
    setScale(1);
    setStagePosition({ x: 0, y: 0 });
    initialRectanglesRef.current = [];
    if (onChanges) {
      onChanges(false);
    }
  }, [imageUrl, onChanges]);

  useEffect(() => {
    if (konvaImage && canvasSize.width > 0 && canvasSize.height > 0) {
      setTimeout(() => {
        fitImageToScreen();
      }, 100);
      
      const timer = setTimeout(() => {
        if (initialRectanglesRef.current.length === 0) {
          initialRectanglesRef.current = JSON.parse(JSON.stringify(rectangles));
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [konvaImage, canvasSize, fitImageToScreen, rectangles]);

  const rectanglesChanged = useCallback(() => {
    if (rectangles.length !== initialRectanglesRef.current.length) {
      return true;
    }
    
    const currentSorted = [...rectangles].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    const initialSorted = [...initialRectanglesRef.current].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    
    return JSON.stringify(currentSorted) !== JSON.stringify(initialSorted);
  }, [rectangles]);

  // eslint-disable-next-line no-unused-vars
  const hasChanges = rectanglesChanged();

  const pushHistory = () => {
    setUndoStack((prev) => [...prev, rectangles]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const newUndo = [...undoStack];
      const previousState = newUndo.pop();
      setRedoStack((prev) => [...prev, rectangles]);
      setUndoStack(newUndo);
      setRectangles(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const newRedo = [...redoStack];
      const nextState = newRedo.pop();
      setUndoStack((prev) => [...prev, rectangles]);
      setRedoStack(newRedo);
      setRectangles(nextState);
    }
  };

  const handleMouseDown = (e) => {
    if (!isDrawing || readOnly) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      id: `rect${rectangles.length + 1}`,
      label: "",
      color: boxColor,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !newRect || readOnly) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const width = pos.x - newRect.x;
    const height = pos.y - newRect.y;
    setNewRect({ ...newRect, width, height });
  };

  const handleMouseUp = () => {
    if (readOnly) {
      setNewRect(null);
      return;
    }
    if (newRect && Math.abs(newRect.width) > 10 && Math.abs(newRect.height) > 10) {
      const label = window.prompt("Enter label:", "");
      if (label) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 11px Arial';
        const textWidth = ctx.measureText(label).width;
        const padding = 6;
        const labelWidth = textWidth + padding * 2;
        const labelHeight = 16;
        
        const centerY = newRect.y + newRect.height / 2;
        const rightX = newRect.x + newRect.width + 10;

        const rect = {
          ...newRect,
          label: label,
          badgeX: rightX,
          badgeY: centerY,
          labelWidth: labelWidth,
          labelHeight: labelHeight,
        };
        pushHistory();
        const nextRects = [...rectangles, rect];
        setRectangles(nextRects);
      }
    }
    setNewRect(null);
  };

  // Track changes and notify parent
  useEffect(() => {
    const hasChanges = rectangles.length !== initialRectanglesRef.current.length ||
      JSON.stringify(rectangles.sort((a, b) => (a.id || '').localeCompare(b.id || ''))) !== 
      JSON.stringify(initialRectanglesRef.current.sort((a, b) => (a.id || '').localeCompare(b.id || '')));
    if (onChanges) {
      onChanges(hasChanges);
    }
  }, [rectangles, onChanges]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.1, Math.min(5, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();
    setScale(newScale);
    setStagePosition(newPos);
  };

  const handleSave = async () => {
    if (!stageRef.current || !konvaImage) {
      return;
    }

    const originalWidth = konvaImage.width;
    const originalHeight = konvaImage.height;

    const currentStage = stageRef.current;
    const imageLayer = currentStage.findOne('Image');
    if (!imageLayer) {
      throw new Error('Could not find image layer');
    }

    const displayedImageWidth = imageLayer.width();
    const displayedImageHeight = imageLayer.height();
    
    const scaleX = originalWidth / displayedImageWidth;
    const scaleY = originalHeight / displayedImageHeight;

    const tempStage = new window.Konva.Stage({
      container: document.createElement('div'),
      width: originalWidth,
      height: originalHeight,
    });

    const tempLayer = new window.Konva.Layer();
    tempStage.add(tempLayer);

    const tempImage = new window.Konva.Image({
      image: konvaImage,
      width: originalWidth,
      height: originalHeight,
    });
    tempLayer.add(tempImage);

    rectangles.forEach((rect) => {
      const origX = rect.x * scaleX;
      const origY = rect.y * scaleY;
      const origWidth = rect.width * scaleX;
      const origHeight = rect.height * scaleY;

      const tempRect = new window.Konva.Rect({
        x: origX,
        y: origY,
        width: origWidth,
        height: origHeight,
        stroke: rect.color,
        strokeWidth: 2 * scaleX,
      });
      tempLayer.add(tempRect);

      if (rect.label) {
        const labelOrigX = rect.badgeX * scaleX;
        const labelOrigY = rect.badgeY * scaleY;
        const labelWidth = (rect.labelWidth || 40) * scaleX;
        const labelHeight = (rect.labelHeight || 16) * scaleY;

        const labelBg = new window.Konva.Rect({
          x: labelOrigX,
          y: labelOrigY - labelHeight / 2,
          width: labelWidth,
          height: labelHeight,
          fill: rect.color,
          cornerRadius: 3 * scaleX,
          stroke: 'white',
          strokeWidth: 1 * scaleX,
        });
        tempLayer.add(labelBg);

        const labelText = new window.Konva.Text({
          x: labelOrigX,
          y: labelOrigY - labelHeight / 2 + 2 * scaleX,
          text: rect.label,
          fontSize: 11 * scaleX,
          fill: textColor,
          fontStyle: 'bold',
          align: 'center',
          width: labelWidth,
          verticalAlign: 'middle',
          height: labelHeight,
        });
        tempLayer.add(labelText);
      }
    });

    const dataURL = tempStage.toDataURL({ 
      pixelRatio: 1, 
      mimeType: 'image/png',
      quality: 1
    });

    tempStage.destroy();

    const response = await fetch(dataURL);
    const blob = await response.blob();

    initialRectanglesRef.current = JSON.parse(JSON.stringify(rectangles));
    
    if (onSave) {
      onSave(blob, rectangles, 'image/png');
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave
  }));

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Drawing Controls */}
      {!readOnly && (
        <div style={{ 
          padding: '0.5rem', 
          borderBottom: '1px solid #dee2e6', 
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            style={{ 
              background: isDrawing ? "#b2f5ea" : "white",
              cursor: "pointer",
              padding: '0.375rem 0.75rem',
              border: '1px solid #dee2e6', 
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
          >
            {isDrawing ? "Drawing: ON" : "Drawing: OFF"}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
            Box:
            <input
              type="color"
              value={boxColor}
              onChange={(e) => setBoxColor(e.target.value)}
              style={{ width: '30px', height: '25px', cursor: 'pointer', border: '1px solid #dee2e6' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
            Text:
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{ width: '30px', height: '25px', cursor: 'pointer', border: '1px solid #dee2e6' }}
            />
          </label>

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            style={{
              background: undoStack.length === 0 ? "#ddd" : "#f1c40f",
              padding: "0.375rem 0.75rem",
              border: "none",
              borderRadius: "0.25rem",
              cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
              fontSize: '0.875rem'
            }}
          >
            ↩️ Undo
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            style={{
              background: redoStack.length === 0 ? "#ddd" : "#3498db",
              color: redoStack.length === 0 ? "#999" : "white",
              padding: "0.375rem 0.75rem",
              border: "none",
              borderRadius: "0.25rem",
              cursor: redoStack.length === 0 ? "not-allowed" : "pointer",
              fontSize: '0.875rem'
            }}
          >
            ↪️ Redo
          </button>

          <button
            onClick={fitImageToScreen}
            style={{
              background: "#6c757d",
              color: "white",
              border: "none",
              padding: "0.375rem 0.75rem",
              cursor: "pointer",
              borderRadius: "0.25rem",
              fontSize: '0.875rem'
            }}
          >
            🔍 Fit to Screen
          </button>
        </div>
      )}

      {/* Konva Canvas */}
      <div 
        ref={canvasContainerRef}
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {konvaImage ? (
          <Stage
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ border: "1px solid #ccc", background: "#fff" }}
            ref={stageRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              <KonvaImageComp 
                image={konvaImage} 
                width={konvaImage.width} 
                height={konvaImage.height} 
              />

              {rectangles.map((rect) => (
                <React.Fragment key={rect.id}>
                  <Rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    stroke={rect.color}
                    strokeWidth={2}
                  />
                  {rect.label && (
                    <>
                      <Rect
                        x={rect.badgeX}
                        y={rect.badgeY - (rect.labelHeight || 16) / 2}
                        width={rect.labelWidth || 40}
                        height={rect.labelHeight || 16}
                        fill={rect.color}
                        cornerRadius={3}
                        stroke="white"
                        strokeWidth={1}
                      />
                      <Text
                        x={rect.badgeX}
                        y={rect.badgeY - (rect.labelHeight || 16) / 2 + 2}
                        text={rect.label}
                        fontSize={11}
                        fill={textColor}
                        fontStyle="bold"
                        align="center"
                        width={rect.labelWidth || 40}
                        verticalAlign="middle"
                        height={rect.labelHeight || 16}
                      />
                    </>
                  )}
                </React.Fragment>
              ))}

              {newRect && (
                <Rect
                  x={newRect.x}
                  y={newRect.y}
                  width={newRect.width}
                  height={newRect.height}
                  stroke={boxColor}
                  dash={[4, 4]}
                  strokeWidth={2}
                />
              )}
            </Layer>
          </Stage>
        ) : (
          <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
            <p>Loading image...</p>
          </div>
        )}
      </div>
    </div>
  );
});

ImageEditor.displayName = 'ImageEditor';

export default ImageEditor;

