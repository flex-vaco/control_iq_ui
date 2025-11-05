import React, { useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Circle, Image as KonvaImageComp } from "react-konva";

export default function App() {
  const [rectangles, setRectangles] = useState([]);
  const [newRect, setNewRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boxColor, setBoxColor] = useState("#ff0000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const stageRef = useRef();

  // ----- HISTORY MANAGEMENT -----
  const pushHistory = () => {
    setUndoStack((prev) => [...prev, rectangles]);
    setRedoStack([]); // clear redo when new action happens
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

  // ----- DRAWING -----
  const handleMouseDown = (e) => {
    if (!isDrawing) return;
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
    if (!isDrawing || !newRect) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const width = pos.x - newRect.x;
    const height = pos.y - newRect.y;
    setNewRect({ ...newRect, width, height });
  };

  const handleMouseUp = () => {
    if (newRect && Math.abs(newRect.width) > 10 && Math.abs(newRect.height) > 10) {
      const label = window.prompt("Enter label:", "");
      const centerY = newRect.y + newRect.height / 2;
      const rightX = newRect.x + newRect.width + 10;

      const rect = {
        ...newRect,
        label: label || "",
        badgeX: rightX,
        badgeY: centerY,
      };
      pushHistory(); // Save current state before making changes
      const nextRects = [...rectangles, rect];
      setRectangles(nextRects);
    }
    setNewRect(null);
  };

  // ----- IMAGE UPLOAD -----
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => setImage(img);
    };
    reader.readAsDataURL(file);
  };

  // ----- ZOOM -----
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

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
  };

  // ----- DOWNLOAD -----
  const handleDownload = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "annotated-image.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- UI -----
  return (
    <div style={{ padding: 10 }}>
      <div style={{ marginBottom: 10 }}>
        <input type="file" accept="image/*" onChange={handleUpload} />

        <button
          onClick={() => setIsDrawing(!isDrawing)}
          style={{
            marginLeft: 10,
            background: isDrawing ? "#b2f5ea" : "white",
            cursor: "pointer",
          }}
        >
          {isDrawing ? "Drawing: ON" : "Drawing: OFF"}
        </button>

        <label style={{ marginLeft: 20 }}>
          Box:
          <input
            type="color"
            value={boxColor}
            onChange={(e) => setBoxColor(e.target.value)}
            style={{ marginLeft: 6 }}
          />
        </label>

        <label style={{ marginLeft: 20 }}>
          Text:
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            style={{ marginLeft: 6 }}
          />
        </label>

        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          style={{
            marginLeft: 20,
            background: undoStack.length === 0 ? "#ddd" : "#f1c40f",
            padding: "6px 10px",
            border: "none",
            borderRadius: "4px",
            cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          ↩️ Undo
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          style={{
            marginLeft: 10,
            background: redoStack.length === 0 ? "#ddd" : "#3498db",
            color: redoStack.length === 0 ? "#999" : "white",
            padding: "6px 10px",
            border: "none",
            borderRadius: "4px",
            cursor: redoStack.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          ↪️ Redo
        </button>

        <button
          onClick={handleDownload}
          style={{
            marginLeft: 10,
            background: "#4CAF50",
            color: "white",
            border: "none",
            padding: "6px 12px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          ⬇️ Download
        </button>
      </div>

      <Stage
        width={window.innerWidth * 0.9}
        height={window.innerHeight * 0.8}
        style={{ border: "1px solid #ccc", background: "#fff" }}
        ref={stageRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {image && (
            <KonvaImageComp image={image} width={image.width} height={image.height} />
          )}

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
                  <Circle
                    x={rect.badgeX}
                    y={rect.badgeY}
                    radius={10}
                    fill={rect.color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <Text
                    x={rect.badgeX - 5}
                    y={rect.badgeY - 7}
                    text={rect.label}
                    fontSize={11}
                    fill={textColor}
                    fontStyle="bold"
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
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}