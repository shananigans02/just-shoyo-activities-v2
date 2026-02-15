import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

/**
 * BOX ALIGNMENT TEST
 *
 * Arrange identical boxes into perfect rows.
 * One always slightly refuses alignment.
 * The grid expands endlessly.
 *
 * "Order is approximate."
 */

const CELL_SIZE = 60;
const INITIAL_GRID_SIZE = 3;

interface Box {
  id: string;
  code: string;
  gridX: number | null; // null = in staging area
  gridY: number | null;
  offsetX: number; // drift offset
  offsetY: number;
  isRebel: boolean;
}

function generateBoxCode(index: number): string {
  return `UNIT-${String(index + 1).padStart(2, "0")}`;
}

function createInitialBoxes(count: number): Box[] {
  const boxes: Box[] = [];
  const rebelIndex = Math.floor(Math.random() * count);

  for (let i = 0; i < count; i++) {
    boxes.push({
      id: `box-${i}`,
      code: generateBoxCode(i),
      gridX: null,
      gridY: null,
      offsetX: 0,
      offsetY: 0,
      isRebel: i === rebelIndex,
    });
  }

  return boxes;
}

export function BoxAlignment({ onExit }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [gridSize, setGridSize] = useState(INITIAL_GRID_SIZE);
  const [boxes, setBoxes] = useState<Box[]>(() =>
    createInitialBoxes(INITIAL_GRID_SIZE * INITIAL_GRID_SIZE)
  );
  const [alignment, setAlignment] = useState(100);
  const [message, setMessage] = useState<string | null>(null);
  const [draggedBox, setDraggedBox] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [expansionCount, setExpansionCount] = useState(0);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  // Rebel box drift effect
  useEffect(() => {
    const driftInterval = setInterval(() => {
      setBoxes((prev) =>
        prev.map((box) => {
          if (box.isRebel && box.gridX !== null) {
            // Subtle drift
            const newOffsetX = (Math.random() - 0.5) * 4;
            const newOffsetY = (Math.random() - 0.5) * 4;

            // Show message occasionally
            if (Math.random() < 0.3) {
              setMessage("MINOR DEVIATION DETECTED");
              setTimeout(() => setMessage(null), 2000);
            }

            return { ...box, offsetX: newOffsetX, offsetY: newOffsetY };
          }
          return box;
        })
      );

      // Update alignment percentage
      setAlignment(97 + Math.random() * 2.9); // Never reaches 100
    }, 3000);

    return () => clearInterval(driftInterval);
  }, []);

  // Check if grid is full and expand
  useEffect(() => {
    const placedBoxes = boxes.filter((b) => b.gridX !== null);
    const totalSlots = gridSize * gridSize;

    if (placedBoxes.length >= totalSlots) {
      // Expand grid
      setTimeout(() => {
        const newGridSize = gridSize + 1;
        setGridSize(newGridSize);
        setExpansionCount((c) => c + 1);

        // Add new boxes
        const newBoxCount = newGridSize * newGridSize - boxes.length;
        const newBoxes: Box[] = [];
        const newRebelIndex = Math.floor(Math.random() * newBoxCount);

        for (let i = 0; i < newBoxCount; i++) {
          newBoxes.push({
            id: `box-${boxes.length + i}`,
            code: generateBoxCode(boxes.length + i),
            gridX: null,
            gridY: null,
            offsetX: 0,
            offsetY: 0,
            isRebel: i === newRebelIndex,
          });
        }

        // Remove rebel status from old boxes, new rebel takes over
        setBoxes((prev) => [
          ...prev.map((b) => ({ ...b, isRebel: false })),
          ...newBoxes,
        ]);

        setMessage("GRID EXPANDED");
        setTimeout(() => setMessage(null), 2000);
      }, 500);
    }
  }, [boxes, gridSize]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, boxId: string) => {
      const box = boxes.find((b) => b.id === boxId);
      if (!box) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setDraggedBox(boxId);
      setMousePos({ x: e.clientX, y: e.clientY });
    },
    [boxes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedBox) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    },
    [draggedBox]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!(draggedBox && containerRef.current)) {
        setDraggedBox(null);
        return;
      }

      const gridElement = containerRef.current.querySelector(".grid-area");
      if (!gridElement) {
        setDraggedBox(null);
        return;
      }

      const gridRect = gridElement.getBoundingClientRect();
      const x = e.clientX - gridRect.left;
      const y = e.clientY - gridRect.top;

      // Check if dropped on grid
      if (x >= 0 && y >= 0 && x < gridRect.width && y < gridRect.height) {
        const cellX = Math.floor(x / CELL_SIZE);
        const cellY = Math.floor(y / CELL_SIZE);

        // Check if cell is empty
        const isOccupied = boxes.some(
          (b) => b.id !== draggedBox && b.gridX === cellX && b.gridY === cellY
        );

        if (!isOccupied && cellX < gridSize && cellY < gridSize) {
          setBoxes((prev) =>
            prev.map((b) =>
              b.id === draggedBox
                ? { ...b, gridX: cellX, gridY: cellY, offsetX: 0, offsetY: 0 }
                : b
            )
          );
        }
      } else {
        // Return to staging area
        setBoxes((prev) =>
          prev.map((b) =>
            b.id === draggedBox
              ? { ...b, gridX: null, gridY: null, offsetX: 0, offsetY: 0 }
              : b
          )
        );
      }

      setDraggedBox(null);
    },
    [draggedBox, boxes, gridSize]
  );

  const unplacedBoxes = boxes.filter((b) => b.gridX === null);
  const placedBoxes = boxes.filter((b) => b.gridX !== null);

  return (
    <div
      className="flex h-full flex-col bg-white"
      onMouseLeave={() => setDraggedBox(null)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={containerRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="status-indicator-glow bg-[var(--system-amber)] text-[var(--system-amber)]" />
          <span className="font-designation text-[var(--void-gray-600)]">
            BOX ALIGNMENT TEST
          </span>
        </div>
        <button
          className="font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
          onClick={onExit}
          type="button"
        >
          [ESC]
        </button>
      </div>

      {/* Stats */}
      <div className="border-[var(--void-gray-100)] border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-system text-[var(--void-gray-400)]">
            ALIGNMENT: {alignment.toFixed(1)}%
          </span>
          <span className="font-system text-[var(--void-gray-400)]">
            GRID: {gridSize}x{gridSize}
          </span>
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            EXPANSIONS: {expansionCount}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid area */}
        <div className="flex flex-1 items-center justify-center bg-[var(--void-gray-50)] p-4">
          <div
            className="grid-area relative border border-[var(--void-gray-200)] bg-white"
            style={{
              width: gridSize * CELL_SIZE,
              height: gridSize * CELL_SIZE,
            }}
          >
            {/* Grid lines */}
            {Array.from({ length: gridSize * gridSize }).map((_, i) => {
              const x = i % gridSize;
              const y = Math.floor(i / gridSize);
              return (
                <div
                  className="absolute border border-[var(--void-gray-100)]"
                  key={`cell-${x}-${y}`}
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                />
              );
            })}

            {/* Placed boxes */}
            {placedBoxes.map((box) => (
              <div
                className={`absolute flex cursor-move select-none items-center justify-center border bg-[var(--void-gray-200)] transition-colors hover:bg-[var(--void-gray-300)] ${
                  draggedBox === box.id
                    ? "opacity-50"
                    : "border-[var(--void-gray-300)]"
                }`}
                key={box.id}
                onMouseDown={(e) => handleMouseDown(e, box.id)}
                style={{
                  left: (box.gridX ?? 0) * CELL_SIZE + 2 + box.offsetX,
                  top: (box.gridY ?? 0) * CELL_SIZE + 2 + box.offsetY,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                }}
              >
                <span className="font-system text-[9px] text-[var(--void-gray-600)]">
                  {box.code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staging area */}
        <div className="w-40 border-[var(--void-gray-200)] border-l bg-white p-4">
          <div className="mb-3 font-system text-[10px] text-[var(--void-gray-300)]">
            UNITS TO PLACE
          </div>
          <div className="space-y-2">
            {unplacedBoxes.slice(0, 8).map((box) => (
              <div
                className={`flex h-10 cursor-move select-none items-center justify-center border border-[var(--void-gray-300)] bg-[var(--void-gray-200)] transition-colors hover:bg-[var(--void-gray-300)] ${
                  draggedBox === box.id ? "opacity-50" : ""
                }`}
                key={box.id}
                onMouseDown={(e) => handleMouseDown(e, box.id)}
              >
                <span className="font-system text-[9px] text-[var(--void-gray-600)]">
                  {box.code}
                </span>
              </div>
            ))}
            {unplacedBoxes.length > 8 && (
              <div className="font-system text-[10px] text-[var(--void-gray-400)]">
                +{unplacedBoxes.length - 8} MORE
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message area */}
      {message && (
        <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
          <div className="text-center font-system text-[var(--void-gray-500)]">
            {message}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <div className="text-center font-system text-[10px] text-[var(--void-gray-300)]">
          DRAG UNITS TO GRID • CONTINUE ALIGNMENT PROTOCOL
        </div>
      </div>

      {/* Dragged box ghost */}
      {draggedBox && (
        <div
          className="pointer-events-none fixed z-50 flex items-center justify-center border border-[var(--void-gray-400)] bg-[var(--void-gray-200)]"
          style={{
            left: mousePos.x - dragOffset.x,
            top: mousePos.y - dragOffset.y,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
        >
          <span className="font-system text-[9px] text-[var(--void-gray-600)]">
            {boxes.find((b) => b.id === draggedBox)?.code}
          </span>
        </div>
      )}
    </div>
  );
}
