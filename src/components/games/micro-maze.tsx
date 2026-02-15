import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

/**
 * MICRO-MAZE
 *
 * Navigate tiny mazes. Reach the door.
 * The door opens into another identical maze.
 * The map never ends.
 *
 * "Every exit is an entrance."
 */

const MAZE_SIZE = 15;
const CELL_SIZE = 20;

// Cell flags
const WALL_TOP = 1;
const WALL_RIGHT = 2;
const WALL_BOTTOM = 4;
const WALL_LEFT = 8;
const VISITED = 16;

type Cell = number;

interface Position {
  x: number;
  y: number;
}

// Recursive backtracker maze generation
function generateMaze(width: number, height: number): Cell[][] {
  // Initialize all cells with all walls
  const maze: Cell[][] = Array.from({ length: height }, () =>
    Array.from(
      { length: width },
      () => WALL_TOP | WALL_RIGHT | WALL_BOTTOM | WALL_LEFT
    )
  );

  const stack: Position[] = [];
  const start: Position = { x: 0, y: 0 };

  maze[start.y][start.x] |= VISITED;
  stack.push(start);

  const getUnvisitedNeighbors = (pos: Position): Position[] => {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // top
      { x: 1, y: 0 }, // right
      { x: 0, y: 1 }, // bottom
      { x: -1, y: 0 }, // left
    ];

    for (const dir of directions) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;

      if (
        newX >= 0 &&
        newX < width &&
        newY >= 0 &&
        newY < height &&
        !(maze[newY][newX] & VISITED)
      ) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  };

  const removeWall = (current: Position, next: Position) => {
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    if (dx === 1) {
      maze[current.y][current.x] &= ~WALL_RIGHT;
      maze[next.y][next.x] &= ~WALL_LEFT;
    } else if (dx === -1) {
      maze[current.y][current.x] &= ~WALL_LEFT;
      maze[next.y][next.x] &= ~WALL_RIGHT;
    } else if (dy === 1) {
      maze[current.y][current.x] &= ~WALL_BOTTOM;
      maze[next.y][next.x] &= ~WALL_TOP;
    } else if (dy === -1) {
      maze[current.y][current.x] &= ~WALL_TOP;
      maze[next.y][next.x] &= ~WALL_BOTTOM;
    }
  };

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      maze[next.y][next.x] |= VISITED;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  return maze;
}

export function MicroMaze({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const [maze, setMaze] = useState<Cell[][]>(() =>
    generateMaze(MAZE_SIZE, MAZE_SIZE)
  );
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [exitPos] = useState<Position>({ x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 });
  const [sector, setSector] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Keyboard handler for movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
        return;
      }

      if (isTransitioning) return;

      let dx = 0;
      let dy = 0;

      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        dy = -1;
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        dy = 1;
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        dx = -1;
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        dx = 1;
      }

      if (dx === 0 && dy === 0) return;

      // Check if move is valid (no wall in that direction)
      const currentCell = maze[playerPos.y][playerPos.x];
      let canMove = false;

      if (dx === 1 && !(currentCell & WALL_RIGHT)) canMove = true;
      if (dx === -1 && !(currentCell & WALL_LEFT)) canMove = true;
      if (dy === 1 && !(currentCell & WALL_BOTTOM)) canMove = true;
      if (dy === -1 && !(currentCell & WALL_TOP)) canMove = true;

      if (canMove) {
        const newX = playerPos.x + dx;
        const newY = playerPos.y + dy;

        // Check bounds
        if (newX >= 0 && newX < MAZE_SIZE && newY >= 0 && newY < MAZE_SIZE) {
          setPlayerPos({ x: newX, y: newY });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, isTransitioning, maze, playerPos]);

  // Check for reaching exit
  useEffect(() => {
    if (playerPos.x === exitPos.x && playerPos.y === exitPos.y) {
      setIsTransitioning(true);
      setMessage("PROCEEDING TO NEXT SECTOR");

      setTimeout(() => {
        setSector((s) => s + 1);
        setMaze(generateMaze(MAZE_SIZE, MAZE_SIZE));
        setPlayerPos({ x: 0, y: 0 });
        setIsTransitioning(false);
        setMessage(null);
      }, 1500);
    }
  }, [playerPos, exitPos]);

  // Occasional glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100 + Math.random() * 200);
      }
    }, 5000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const width = MAZE_SIZE * CELL_SIZE;
      const height = MAZE_SIZE * CELL_SIZE;

      // Clear
      ctx.fillStyle = glitchActive ? "#f0f0f0" : "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Draw walls
      ctx.strokeStyle = glitchActive ? "#808080" : "#d4d4d4";
      ctx.lineWidth = 1;

      for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
          const cell = maze[y][x];
          const px = x * CELL_SIZE;
          const py = y * CELL_SIZE;

          ctx.beginPath();

          if (cell & WALL_TOP) {
            ctx.moveTo(px, py);
            ctx.lineTo(px + CELL_SIZE, py);
          }
          if (cell & WALL_RIGHT) {
            ctx.moveTo(px + CELL_SIZE, py);
            ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
          }
          if (cell & WALL_BOTTOM) {
            ctx.moveTo(px, py + CELL_SIZE);
            ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
          }
          if (cell & WALL_LEFT) {
            ctx.moveTo(px, py);
            ctx.lineTo(px, py + CELL_SIZE);
          }

          ctx.stroke();
        }
      }

      // Draw exit
      const exitPx = exitPos.x * CELL_SIZE;
      const exitPy = exitPos.y * CELL_SIZE;
      ctx.fillStyle = isTransitioning
        ? "#a8b5a0"
        : glitchActive
          ? "#c47474"
          : "#a8b5a0";
      ctx.fillRect(exitPx + 4, exitPy + 4, CELL_SIZE - 8, CELL_SIZE - 8);

      // Draw player
      const playerPx = playerPos.x * CELL_SIZE + CELL_SIZE / 2;
      const playerPy = playerPos.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.beginPath();
      ctx.arc(playerPx, playerPy, CELL_SIZE / 3, 0, Math.PI * 2);
      ctx.fillStyle = glitchActive ? "#404040" : "#525252";
      ctx.fill();

      // Glitch effect - random lines
      if (glitchActive) {
        ctx.strokeStyle = "#e5e5e5";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const gy = Math.random() * height;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationRef.current);
  }, [maze, playerPos, exitPos, isTransitioning, glitchActive]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="status-indicator-glow bg-[var(--system-green)] text-[var(--system-green)]" />
          <span className="font-designation text-[var(--void-gray-600)]">
            MICRO-MAZE
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
            SECTOR: {sector}
          </span>
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            NAVIGATION PROTOCOL ACTIVE
          </span>
        </div>
      </div>

      {/* Maze area */}
      <div className="flex flex-1 items-center justify-center bg-[var(--void-gray-50)] p-4">
        <div className="relative border border-[var(--void-gray-200)]">
          <canvas
            height={MAZE_SIZE * CELL_SIZE}
            ref={canvasRef}
            width={MAZE_SIZE * CELL_SIZE}
          />

          {/* Transition overlay */}
          {isTransitioning && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="font-system text-[var(--void-gray-500)]">
                LOADING SECTOR {sector + 1}...
              </div>
            </div>
          )}
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

      {/* Legend */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--void-gray-600)]" />
            <span className="font-system text-[10px] text-[var(--void-gray-400)]">
              YOU
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-[var(--system-green)]" />
            <span className="font-system text-[10px] text-[var(--void-gray-400)]">
              EXIT
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <div className="text-center font-system text-[10px] text-[var(--void-gray-300)]">
          ARROW KEYS OR WASD TO NAVIGATE
        </div>
      </div>
    </div>
  );
}
