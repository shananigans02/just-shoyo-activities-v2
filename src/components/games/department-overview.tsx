import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

/**
 * DEPARTMENT OVERVIEW
 *
 * A sophisticated top-down surveillance simulation.
 * Employees have personalities, routines, and social needs.
 * They feel alive because they ARE being observed.
 *
 * "The work continues. The observation never stops."
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ZoneType;
  label?: string;
  capacity?: number;
}

type ZoneType =
  | "office"
  | "cubicle"
  | "conference"
  | "break"
  | "kitchen"
  | "bathroom"
  | "corridor"
  | "elevator"
  | "reception"
  | "server"
  | "manager"
  | "open"
  | "unreadable";

type EmployeeState =
  | "arriving"
  | "working"
  | "thinking"
  | "break"
  | "meeting"
  | "socializing"
  | "bathroom"
  | "lunch"
  | "leaving"
  | "idle"
  | "moving";

type Personality =
  | "diligent"
  | "social"
  | "slacker"
  | "anxious"
  | "loner"
  | "ambitious";
type Role = "analyst" | "engineer" | "manager" | "clerk" | "intern" | "senior";

interface Employee {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: EmployeeState;
  previousState: EmployeeState;
  stateTimer: number;

  // Identity
  designation: string;
  firstName: string;
  role: Role;
  personality: Personality;
  color: string;

  // Needs (0-100)
  energy: number;
  social: number;
  focus: number;

  // Stats
  productivity: number;
  tasksDone: number;
  breaksToday: number;

  // Current activity
  currentZone: string;
  targetZone: string;
  meetingWith: string | null;

  // Schedule
  arrivalTime: number; // Minutes from midnight
  lunchTime: number;
  leaveTime: number;
  hasArrived: boolean;
  hasLeft: boolean;
  isInMeeting: boolean;

  // Anomaly
  isAnomaly: boolean;
  followingCursor: boolean;

  // Movement
  speed: number;
  path: Point[];
}

interface Meeting {
  id: string;
  zoneId: string;
  participants: string[];
  startTime: number;
  duration: number;
}

interface SystemMessage {
  text: string;
  timestamp: number;
  type: "normal" | "anomaly" | "cryptic";
}

interface ChatMessage {
  id: string;
  timestamp: number;
  speakerId: string;
  speakerName: string;
  speakerColor: string;
  text: string;
  partnerId?: string;
}

interface Conversation {
  participants: [string, string];
  startTime: number;
  lastMessageTime: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Unique colors for each employee (muted, corporate palette)
const EMPLOYEE_COLORS = [
  "#4A7C59", // sage green
  "#7C4A6B", // dusty mauve
  "#4A5D7C", // slate blue
  "#7C6B4A", // warm brown
  "#5D7C4A", // moss green
  "#7C4A4A", // muted red
  "#4A7C7C", // teal
  "#6B4A7C", // purple
  "#7C7C4A", // olive
  "#4A6B7C", // steel blue
  "#7C5D4A", // rust
  "#5D4A7C", // violet
  "#4A7C6B", // seafoam
  "#7C4A5D", // rose
  "#6B7C4A", // chartreuse
  "#4A4A7C", // indigo
];

const CANVAS_WIDTH = 580;
const CANVAS_HEIGHT = 420;
const GRID_SIZE = 20;

// Simulated time (1 real second = 1 simulated minute)
const TIME_SCALE = 1;
const WORK_START = 8 * 60 + 30; // 8:30 AM
const WORK_END = 17 * 60 + 30; // 5:30 PM

const ZONES: Zone[] = [
  // Top row - Private offices
  {
    id: "office-1",
    x: 20,
    y: 20,
    width: 55,
    height: 45,
    type: "office",
    label: "7-A",
  },
  {
    id: "office-2",
    x: 85,
    y: 20,
    width: 55,
    height: 45,
    type: "office",
    label: "7-B",
  },
  {
    id: "manager",
    x: 150,
    y: 20,
    width: 70,
    height: 45,
    type: "manager",
    label: "DIRECTOR",
  },
  {
    id: "conference-1",
    x: 230,
    y: 20,
    width: 90,
    height: 55,
    type: "conference",
    label: "CONF A",
    capacity: 6,
  },

  // Second row - More offices and server room
  {
    id: "office-3",
    x: 20,
    y: 75,
    width: 55,
    height: 45,
    type: "office",
    label: "7-C",
  },
  {
    id: "office-4",
    x: 85,
    y: 75,
    width: 55,
    height: 45,
    type: "office",
    label: "7-D",
  },
  {
    id: "server",
    x: 150,
    y: 75,
    width: 50,
    height: 45,
    type: "server",
    label: "SERVER",
  },

  // Main corridor (horizontal)
  {
    id: "corridor-main",
    x: 20,
    y: 130,
    width: 300,
    height: 25,
    type: "corridor",
  },

  // Open floor plan area (cubicles)
  {
    id: "open-1",
    x: 20,
    y: 165,
    width: 100,
    height: 80,
    type: "open",
    label: "SECTOR A",
  },
  {
    id: "open-2",
    x: 130,
    y: 165,
    width: 100,
    height: 80,
    type: "open",
    label: "SECTOR B",
  },
  {
    id: "open-3",
    x: 240,
    y: 165,
    width: 80,
    height: 80,
    type: "open",
    label: "SECTOR C",
  },

  // Bottom area
  {
    id: "break",
    x: 20,
    y: 255,
    width: 80,
    height: 60,
    type: "break",
    label: "BREAK",
  },
  {
    id: "kitchen",
    x: 110,
    y: 255,
    width: 60,
    height: 60,
    type: "kitchen",
    label: "KITCHEN",
  },
  {
    id: "conference-2",
    x: 180,
    y: 255,
    width: 70,
    height: 60,
    type: "conference",
    label: "CONF B",
    capacity: 4,
  },
  {
    id: "bathroom",
    x: 260,
    y: 255,
    width: 60,
    height: 60,
    type: "bathroom",
    label: "WC",
  },

  // Right side corridor
  {
    id: "corridor-right",
    x: 330,
    y: 20,
    width: 25,
    height: 295,
    type: "corridor",
  },

  // Right side facilities
  {
    id: "elevator",
    x: 365,
    y: 20,
    width: 50,
    height: 50,
    type: "elevator",
    label: "ELEV",
  },
  {
    id: "reception",
    x: 365,
    y: 80,
    width: 80,
    height: 55,
    type: "reception",
    label: "RECEPTION",
  },
  {
    id: "conference-3",
    x: 365,
    y: 145,
    width: 80,
    height: 55,
    type: "conference",
    label: "CONF C",
    capacity: 8,
  },

  // Unreadable zone (mysterious)
  {
    id: "unknown",
    x: 365,
    y: 255,
    width: 80,
    height: 60,
    type: "unreadable",
    label: "████",
  },

  // Bottom corridor
  {
    id: "corridor-bottom",
    x: 20,
    y: 325,
    width: 425,
    height: 20,
    type: "corridor",
  },

  // Exit area
  {
    id: "exit",
    x: 420,
    y: 295,
    width: 25,
    height: 50,
    type: "corridor",
    label: "EXIT",
  },
];

const FIRST_NAMES = [
  "Mark",
  "Dylan",
  "Irving",
  "Helly",
  "Burt",
  "Milchick",
  "Cobel",
  "Devon",
  "Ricken",
  "Gabby",
  "Alexa",
  "Petey",
  "Natalie",
  "Reghabi",
  "Jame",
  "Kier",
  "Casey",
  "Ms. Huang",
  "Doug",
  "Felicia",
];

const ROLES: Role[] = [
  "analyst",
  "engineer",
  "manager",
  "clerk",
  "intern",
  "senior",
];
const PERSONALITIES: Personality[] = [
  "diligent",
  "social",
  "slacker",
  "anxious",
  "loner",
  "ambitious",
];

const OBSERVATION_MESSAGES = [
  "MOVEMENT LOGGED",
  "DEVIATION WITHIN TOLERANCE",
  "SUBJECT REASSIGNED",
  "PRODUCTIVITY VERIFIED",
  "PATTERN RECOGNIZED",
  "BEHAVIOR NOMINAL",
  "TASK COMPLETED",
  "ZONE TRANSITION",
  "BREAK INITIATED",
  "BREAK CONCLUDED",
  "MEETING COMMENCED",
  "MEETING CONCLUDED",
  "SOCIAL INTERACTION DETECTED",
  "FOCUS STATE ACHIEVED",
  "EFFICIENCY OPTIMAL",
  "ROUTINE MAINTAINED",
];

const ANOMALY_MESSAGES = [
  "ANOMALY DETECTED",
  "IRREGULAR PATTERN",
  "DEVIATION FLAGGED",
  "REVIEW REQUIRED",
  "BEHAVIOR VARIANCE",
  "UNSCHEDULED MOVEMENT",
  "PRODUCTIVITY DECLINE",
  "SOCIAL QUOTA EXCEEDED",
  "UNAUTHORIZED PAUSE",
];

const CRYPTIC_MESSAGES = [
  "THE WORK CONTINUES",
  "ALL IS OBSERVED",
  "EFFICIENCY IS HARMONY",
  "OBSERVATION PAUSED",
  "RECALIBRATING SENSORS",
  "TRUST THE PROCESS",
  "YOUR EFFORTS ARE NOTED",
  "THE BOARD SEES ALL",
  "COMPLIANCE IS COMFORT",
  "REMEMBER: YOU CHOSE TO BE HERE",
  "THE ELEVATOR REMEMBERS",
  "PRODUCTIVITY IS ITS OWN REWARD",
  "WE ARE ALL REFINERS",
];

// Conversation content by personality
const CONVERSATION_STARTERS: Record<Personality, string[]> = {
  diligent: [
    "Have you finished the quarterly reports?",
    "I optimized my workflow by 12% today.",
    "The metrics look promising this cycle.",
    "We should review the documentation.",
    "I noticed some inefficiencies in Process B.",
  ],
  social: [
    "Did you catch the game last night?",
    "Want to grab coffee later?",
    "Have you met the new person in 7-B?",
    "The break room has new snacks.",
    "How was your weekend?",
  ],
  slacker: [
    "Is it lunch yet?",
    "I think the clock is broken...",
    "Anyone else feel like time moves slower here?",
    "The vending machine took my money again.",
    "I need more coffee.",
  ],
  anxious: [
    "Do you think they noticed I was late?",
    "Is my productivity score okay?",
    "The Board hasn't sent any messages today...",
    "Did I submit that form correctly?",
    "Has anyone seen the Manager today?",
  ],
  loner: ["...", "Mm.", "I should get back to work.", "Yes.", "I suppose."],
  ambitious: [
    "I'm presenting to the Director tomorrow.",
    "My numbers are up 23% this quarter.",
    "Have you read the new efficiency guidelines?",
    "I've been here the earliest all week.",
    "The promotion list comes out soon.",
  ],
};

const CONVERSATION_RESPONSES: Record<Personality, string[]> = {
  diligent: [
    "I'll have it done by end of day.",
    "Good point. Let me note that.",
    "The system does seem more efficient now.",
    "I'll review it immediately.",
    "Absolutely. Productivity is key.",
  ],
  social: [
    "Yeah, it was amazing!",
    "Sure! I know a good spot.",
    "They seem nice. Very quiet though.",
    "I heard about that! So exciting.",
    "We should all get lunch together.",
  ],
  slacker: [
    "Tell me about it...",
    "Same. Just counting down the hours.",
    "Right? This place is weird.",
    "I feel that.",
    "Want to take a walk?",
  ],
  anxious: [
    "I hope so...",
    "Do you think that's bad?",
    "Should we be worried?",
    "I'm not sure...",
    "What if something's wrong?",
  ],
  loner: ["Hm.", "I see.", "Perhaps.", "...", "If you say so."],
  ambitious: [
    "That's a great opportunity.",
    "I've been tracking that too.",
    "We should collaborate sometime.",
    "Impressive numbers.",
    "Keep up that momentum.",
  ],
};

const CRYPTIC_CONVERSATION_LINES = [
  "Do you ever feel like we've had this conversation before?",
  "The elevator was acting strange again.",
  "I found a door that wasn't there yesterday.",
  "Sometimes I see numbers when I close my eyes.",
  "What floor are we on again?",
  "Have you noticed the plants never grow?",
  "I don't remember arriving this morning.",
  "The lights flickered in a pattern earlier.",
  "Do you hear that humming?",
  "My reflection blinked before I did.",
  "The break room clock runs backwards at night.",
  "I think I saw myself in the corridor.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getZoneById(id: string): Zone | undefined {
  return ZONES.find((z) => z.id === id);
}

function getRandomPointInZone(zone: Zone): Point {
  const padding = 8;
  return {
    x: zone.x + padding + Math.random() * (zone.width - padding * 2),
    y: zone.y + padding + Math.random() * (zone.height - padding * 2),
  };
}

function getRandomWorkZone(): Zone {
  const workZones = ZONES.filter(
    (z) => z.type === "office" || z.type === "open" || z.type === "cubicle"
  );
  return workZones[Math.floor(Math.random() * workZones.length)];
}

function getRandomSocialZone(): Zone {
  const socialZones = ZONES.filter(
    (z) => z.type === "break" || z.type === "kitchen" || z.type === "corridor"
  );
  return socialZones[Math.floor(Math.random() * socialZones.length)];
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(Math.floor(m)).padStart(2, "0")} ${period}`;
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Starting time for the simulation (9:30 AM - mid-morning when everyone is working)
const INITIAL_SIM_TIME = 9 * 60 + 30;

function createEmployee(id: number): Employee {
  const personality =
    PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
  const role = ROLES[Math.floor(Math.random() * ROLES.length)];

  // Personality affects base stats
  const baseEnergy =
    personality === "diligent" ? 80 : personality === "slacker" ? 60 : 70;
  const baseSocial =
    personality === "social" ? 40 : personality === "loner" ? 80 : 60;
  const baseFocus =
    personality === "anxious" ? 50 : personality === "ambitious" ? 80 : 65;

  // Stagger arrival times (8:00 - 9:30)
  const arrivalTime = WORK_START - 30 + Math.floor(Math.random() * 90);
  const lunchTime = 12 * 60 + Math.floor(Math.random() * 60); // 12:00 - 1:00
  const leaveTime = WORK_END - 30 + Math.floor(Math.random() * 60);

  // Speed varies by personality
  const speed =
    personality === "anxious"
      ? 1.2
      : personality === "slacker"
        ? 0.6
        : personality === "ambitious"
          ? 1.0
          : 0.8;

  // Check if employee should have already arrived by initial sim time
  const alreadyArrived = arrivalTime <= INITIAL_SIM_TIME;

  // If already arrived, place them at a work zone; otherwise at elevator
  let startPos: Point;
  let startZone: string;
  let startState: EmployeeState;

  if (alreadyArrived) {
    const workZone = getRandomWorkZone();
    startPos = getRandomPointInZone(workZone);
    startZone = workZone.id;
    startState = "working";
  } else {
    const elevator = getZoneById("elevator")!;
    startPos = getRandomPointInZone(elevator);
    startZone = "elevator";
    startState = "arriving";
  }

  return {
    id: `emp-${id}`,
    x: startPos.x,
    y: startPos.y,
    targetX: startPos.x,
    targetY: startPos.y,
    state: startState,
    previousState: startState,
    stateTimer: alreadyArrived ? 3000 + Math.random() * 5000 : 0,

    designation: `${String(id + 1).padStart(2, "0")}-${String.fromCharCode(65 + (id % 26))}`,
    firstName: FIRST_NAMES[id % FIRST_NAMES.length],
    role,
    personality,
    color: EMPLOYEE_COLORS[id % EMPLOYEE_COLORS.length],

    energy: baseEnergy + Math.random() * 20,
    social: baseSocial + Math.random() * 20,
    focus: baseFocus + Math.random() * 20,

    productivity: 85 + Math.random() * 15,
    tasksDone: alreadyArrived ? Math.floor(Math.random() * 5) : 0,
    breaksToday: 0,

    currentZone: startZone,
    targetZone: startZone,
    meetingWith: null,

    arrivalTime,
    lunchTime,
    leaveTime,
    hasArrived: alreadyArrived,
    hasLeft: false,
    isInMeeting: false,

    isAnomaly: false,
    followingCursor: false,

    speed,
    path: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const NUM_EMPLOYEES = 16;

export function DepartmentOverview({ onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [employees, setEmployees] = useState<Employee[]>(() =>
    Array.from({ length: NUM_EMPLOYEES }, (_, i) => createEmployee(i))
  );
  const [hoveredEmployee, setHoveredEmployee] = useState<Employee | null>(null);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [observationStatus, setObservationStatus] = useState("NOMINAL");
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [meetings] = useState<Meeting[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeConversations, setActiveConversations] = useState<
    Map<string, Conversation>
  >(new Map());

  // Simulated time (minutes from midnight)
  const [simTime, setSimTime] = useState(INITIAL_SIM_TIME); // Start at 9:30 AM

  const lastFrameTime = useRef(Date.now());
  const cursorFollowerRef = useRef<string | null>(null);
  const hasSeededChat = useRef(false);

  // Add system message
  const addMessage = useCallback(
    (text: string, type: "normal" | "anomaly" | "cryptic" = "normal") => {
      setSystemMessages((prev) => [
        { text, timestamp: Date.now(), type },
        ...prev.slice(0, 6),
      ]);
    },
    []
  );

  // Add chat message
  const addChatMessage = useCallback(
    (speaker: Employee, text: string, partnerId?: string) => {
      setChatMessages((prev) => [
        {
          id: `chat-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          speakerId: speaker.id,
          speakerName: speaker.firstName,
          speakerColor: speaker.color,
          text,
          partnerId,
        },
        ...prev.slice(0, 15), // Keep last 15 messages
      ]);
    },
    []
  );

  // Generate conversation text based on personality
  const generateConversationText = useCallback(
    (speaker: Employee, isStarter: boolean): string => {
      // 12% chance of cryptic line
      if (Math.random() < 0.12) {
        return CRYPTIC_CONVERSATION_LINES[
          Math.floor(Math.random() * CRYPTIC_CONVERSATION_LINES.length)
        ];
      }
      const messages = isStarter
        ? CONVERSATION_STARTERS[speaker.personality]
        : CONVERSATION_RESPONSES[speaker.personality];
      return messages[Math.floor(Math.random() * messages.length)];
    },
    []
  );

  // Get conversation key (sorted to ensure consistency)
  const getConversationKey = useCallback((id1: string, id2: string): string => {
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Time Simulation
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setSimTime((prev) => {
        const next = prev + TIME_SCALE;
        // Reset at midnight
        if (next >= 24 * 60) return WORK_START - 60;
        return next;
      });
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Employee AI Update
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;

      setEmployees((prev) =>
        prev.map((emp) => {
          const newEmp = { ...emp };
          newEmp.stateTimer -= delta;

          // Decay needs over time
          newEmp.energy = Math.max(0, newEmp.energy - 0.01);
          newEmp.social = Math.max(0, newEmp.social - 0.02);
          if (newEmp.state === "working") {
            newEmp.focus = Math.max(0, newEmp.focus - 0.03);
          }

          // Handle cursor following (uncanny behavior)
          if (emp.followingCursor && cursorFollowerRef.current === emp.id) {
            newEmp.targetX = mousePos.x;
            newEmp.targetY = mousePos.y;
            newEmp.state = "moving";

            if (Math.random() < 0.01) {
              newEmp.followingCursor = false;
              cursorFollowerRef.current = null;
            }
          }

          // ─── Arrival Logic ───
          if (!newEmp.hasArrived && simTime >= newEmp.arrivalTime) {
            newEmp.hasArrived = true;
            newEmp.state = "arriving";
            const workZone = getRandomWorkZone();
            const target = getRandomPointInZone(workZone);
            newEmp.targetX = target.x;
            newEmp.targetY = target.y;
            newEmp.targetZone = workZone.id;
            addMessage(`SUBJECT ${newEmp.designation} ARRIVED`);
          }

          // ─── Leaving Logic ───
          if (
            newEmp.hasArrived &&
            !newEmp.hasLeft &&
            simTime >= newEmp.leaveTime
          ) {
            newEmp.hasLeft = true;
            newEmp.state = "leaving";
            const elevator = getZoneById("elevator")!;
            const target = getRandomPointInZone(elevator);
            newEmp.targetX = target.x;
            newEmp.targetY = target.y;
            newEmp.targetZone = "elevator";
            addMessage(`SUBJECT ${newEmp.designation} DEPARTING`);
          }

          // ─── State Machine ───
          if (
            newEmp.hasArrived &&
            !newEmp.hasLeft &&
            newEmp.stateTimer <= 0 &&
            !newEmp.followingCursor
          ) {
            const personality = newEmp.personality;

            switch (newEmp.state) {
              case "arriving":
              case "moving": {
                // Arrived at destination
                newEmp.currentZone = newEmp.targetZone;

                // Decide what to do based on needs and personality
                if (newEmp.energy < 30) {
                  // Need break
                  newEmp.state = "break";
                  newEmp.stateTimer = 3000 + Math.random() * 5000;
                  const breakZone =
                    getZoneById("break") || getZoneById("kitchen");
                  if (breakZone) {
                    const target = getRandomPointInZone(breakZone);
                    newEmp.targetX = target.x;
                    newEmp.targetY = target.y;
                    newEmp.targetZone = breakZone.id;
                    newEmp.state = "moving";
                  }
                  newEmp.breaksToday++;
                  if (Math.random() < 0.3) addMessage("BREAK INITIATED");
                } else if (newEmp.social < 20 && personality !== "loner") {
                  // Need social interaction
                  newEmp.state = "socializing";
                  newEmp.stateTimer = 2000 + Math.random() * 4000;
                  const socialZone = getRandomSocialZone();
                  const target = getRandomPointInZone(socialZone);
                  newEmp.targetX = target.x;
                  newEmp.targetY = target.y;
                  newEmp.targetZone = socialZone.id;
                  newEmp.state = "moving";
                  if (Math.random() < 0.2)
                    addMessage("SOCIAL INTERACTION DETECTED");
                } else if (
                  Math.abs(simTime - newEmp.lunchTime) < 30 &&
                  newEmp.breaksToday < 3
                ) {
                  // Lunch time
                  newEmp.state = "lunch";
                  newEmp.stateTimer = 5000 + Math.random() * 5000;
                  const kitchen =
                    getZoneById("kitchen") || getZoneById("break");
                  if (kitchen) {
                    const target = getRandomPointInZone(kitchen);
                    newEmp.targetX = target.x;
                    newEmp.targetY = target.y;
                    newEmp.targetZone = kitchen.id;
                    newEmp.state = "moving";
                  }
                } else {
                  // Work
                  newEmp.state = "working";
                  newEmp.stateTimer = 5000 + Math.random() * 10_000;

                  // Occasionally think instead of work
                  if (Math.random() < 0.2) {
                    newEmp.state = "thinking";
                    newEmp.stateTimer = 2000 + Math.random() * 3000;
                  }
                }
                break;
              }

              case "working": {
                newEmp.tasksDone++;
                newEmp.focus = Math.min(100, newEmp.focus + 10);

                // Decide next action
                const rand = Math.random();

                if (rand < 0.1 && personality !== "diligent") {
                  // Random bathroom break
                  newEmp.state = "bathroom";
                  const bathroom = getZoneById("bathroom")!;
                  const target = getRandomPointInZone(bathroom);
                  newEmp.targetX = target.x;
                  newEmp.targetY = target.y;
                  newEmp.targetZone = bathroom.id;
                  newEmp.state = "moving";
                  newEmp.stateTimer = 2000;
                } else if (rand < 0.15 && personality === "social") {
                  // Social break
                  newEmp.state = "socializing";
                  const socialZone = getRandomSocialZone();
                  const target = getRandomPointInZone(socialZone);
                  newEmp.targetX = target.x;
                  newEmp.targetY = target.y;
                  newEmp.targetZone = socialZone.id;
                  newEmp.state = "moving";
                  newEmp.stateTimer = 3000;
                } else if (rand < 0.25) {
                  // Move to different work area
                  const workZone = getRandomWorkZone();
                  const target = getRandomPointInZone(workZone);
                  newEmp.targetX = target.x;
                  newEmp.targetY = target.y;
                  newEmp.targetZone = workZone.id;
                  newEmp.state = "moving";
                  newEmp.stateTimer = 3000;
                  if (Math.random() < 0.2) addMessage("ZONE TRANSITION");
                } else {
                  // Continue working
                  newEmp.state = "working";
                  newEmp.stateTimer = 4000 + Math.random() * 8000;
                  if (Math.random() < 0.1)
                    addMessage(getRandomMessage(OBSERVATION_MESSAGES));
                }
                break;
              }

              case "thinking": {
                newEmp.focus = Math.min(100, newEmp.focus + 20);
                newEmp.state = "working";
                newEmp.stateTimer = 5000 + Math.random() * 8000;
                break;
              }

              case "break":
              case "lunch": {
                newEmp.energy = Math.min(100, newEmp.energy + 30);
                newEmp.social = Math.min(100, newEmp.social + 10);

                // Return to work
                const workZone = getRandomWorkZone();
                const target = getRandomPointInZone(workZone);
                newEmp.targetX = target.x;
                newEmp.targetY = target.y;
                newEmp.targetZone = workZone.id;
                newEmp.state = "moving";
                newEmp.stateTimer = 2000;
                if (Math.random() < 0.3) addMessage("BREAK CONCLUDED");
                break;
              }

              case "bathroom": {
                // Return to work
                const workZone = getRandomWorkZone();
                const target = getRandomPointInZone(workZone);
                newEmp.targetX = target.x;
                newEmp.targetY = target.y;
                newEmp.targetZone = workZone.id;
                newEmp.state = "moving";
                newEmp.stateTimer = 2000;
                break;
              }

              case "socializing": {
                newEmp.social = Math.min(100, newEmp.social + 25);
                newEmp.energy = Math.max(0, newEmp.energy - 5);

                // Check if slacking too much
                if (newEmp.personality === "slacker" && Math.random() < 0.3) {
                  // Stay socializing longer
                  newEmp.stateTimer = 3000 + Math.random() * 5000;
                  if (Math.random() < 0.1) {
                    newEmp.isAnomaly = true;
                    setAnomalyCount((c) => c + 1);
                    addMessage(getRandomMessage(ANOMALY_MESSAGES), "anomaly");
                    setTimeout(() => {
                      setEmployees((e) =>
                        e.map((emp2) =>
                          emp2.id === newEmp.id
                            ? { ...emp2, isAnomaly: false }
                            : emp2
                        )
                      );
                      setAnomalyCount((c) => Math.max(0, c - 1));
                    }, 5000);
                  }
                } else {
                  // Return to work
                  const workZone = getRandomWorkZone();
                  const target = getRandomPointInZone(workZone);
                  newEmp.targetX = target.x;
                  newEmp.targetY = target.y;
                  newEmp.targetZone = workZone.id;
                  newEmp.state = "moving";
                  newEmp.stateTimer = 2000;
                }
                break;
              }

              case "idle": {
                // Start working
                newEmp.state = "working";
                newEmp.stateTimer = 3000 + Math.random() * 5000;
                break;
              }
            }
          }

          // ─── Movement ───
          if (
            newEmp.state === "moving" ||
            newEmp.state === "arriving" ||
            newEmp.state === "leaving"
          ) {
            const dx = newEmp.targetX - newEmp.x;
            const dy = newEmp.targetY - newEmp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 2) {
              newEmp.x += (dx / dist) * newEmp.speed;
              newEmp.y += (dy / dist) * newEmp.speed;
            } else {
              newEmp.x = newEmp.targetX;
              newEmp.y = newEmp.targetY;
              if (newEmp.state === "leaving") {
                // Employee has left
                newEmp.state = "idle";
              } else if (
                newEmp.state === "moving" ||
                newEmp.state === "arriving"
              ) {
                newEmp.stateTimer = 100; // Quick transition to next state
              }
            }
          }

          // ─── Random Jitter (makes them feel alive) ───
          if (
            (newEmp.state === "working" ||
              newEmp.state === "thinking" ||
              newEmp.state === "socializing") &&
            Math.random() < 0.02
          ) {
            newEmp.x += (Math.random() - 0.5) * 2;
            newEmp.y += (Math.random() - 0.5) * 2;
          }

          return newEmp;
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [mousePos, addMessage, simTime, meetings]);

  // ─────────────────────────────────────────────────────────────────────────
  // Uncanny Behaviors
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Occasionally make an employee follow cursor
    const cursorFollowInterval = setInterval(() => {
      if (Math.random() < 0.08 && !cursorFollowerRef.current) {
        const activeEmployees = employees.filter(
          (e) => e.hasArrived && !e.hasLeft
        );
        if (activeEmployees.length > 0) {
          const randomEmp =
            activeEmployees[Math.floor(Math.random() * activeEmployees.length)];
          cursorFollowerRef.current = randomEmp.id;
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === randomEmp.id ? { ...emp, followingCursor: true } : emp
            )
          );
        }
      }
    }, 20_000);

    // Occasional cryptic message
    const crypticInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        addMessage(getRandomMessage(CRYPTIC_MESSAGES), "cryptic");
      }
    }, 25_000);

    // Occasionally change observation status
    const statusInterval = setInterval(() => {
      if (Math.random() < 0.08) {
        const statuses = ["PROCESSING", "CALIBRATING", "SCANNING"];
        setObservationStatus(
          statuses[Math.floor(Math.random() * statuses.length)]
        );
        setTimeout(() => setObservationStatus("NOMINAL"), 3000);
      }
    }, 15_000);

    return () => {
      clearInterval(cursorFollowInterval);
      clearInterval(crypticInterval);
      clearInterval(statusInterval);
    };
  }, [employees, addMessage]);

  // ─────────────────────────────────────────────────────────────────────────
  // Conversation System
  // ─────────────────────────────────────────────────────────────────────────

  // Seed initial conversation shortly after mount
  useEffect(() => {
    if (hasSeededChat.current) return;

    const seedTimer = setTimeout(() => {
      if (hasSeededChat.current) return;

      const activeEmps = employees.filter((e) => e.hasArrived && !e.hasLeft);
      if (activeEmps.length >= 2) {
        hasSeededChat.current = true;

        // Find two employees to start initial conversation
        const emp1 = activeEmps[0];
        const emp2 = activeEmps[1];

        // First message
        const starter = generateConversationText(emp1, true);
        addChatMessage(emp1, starter, emp2.id);

        // Response after delay
        setTimeout(() => {
          const response = generateConversationText(emp2, false);
          addChatMessage(emp2, response, emp1.id);
        }, 2000);

        // Third message
        setTimeout(() => {
          const followUp = generateConversationText(emp1, false);
          addChatMessage(emp1, followUp, emp2.id);
        }, 4500);
      }
    }, 500); // Small delay to ensure employees are positioned

    return () => clearTimeout(seedTimer);
  }, [employees, addChatMessage, generateConversationText]);

  useEffect(() => {
    const conversationInterval = setInterval(() => {
      const activeEmployees = employees.filter(
        (e) => e.hasArrived && !e.hasLeft
      );
      if (activeEmployees.length < 2) return;

      // States where employees can have conversations
      const canChat = (state: EmployeeState) =>
        state === "socializing" ||
        state === "break" ||
        state === "lunch" ||
        state === "working" ||
        state === "thinking" ||
        state === "idle";

      // Find employees who can chat
      const chattableEmployees = activeEmployees.filter((e) =>
        canChat(e.state)
      );

      // Track if we found any conversations this tick
      let foundConversation = false;

      for (const emp of chattableEmployees) {
        if (foundConversation) break; // Only process one new conversation per tick

        // Find nearby partner - use larger radius (120px) to catch more interactions
        const nearbyPartner = chattableEmployees.find(
          (other) =>
            other.id !== emp.id &&
            distance({ x: emp.x, y: emp.y }, { x: other.x, y: other.y }) < 120
        );

        if (nearbyPartner) {
          const key = getConversationKey(emp.id, nearbyPartner.id);
          const existingConv = activeConversations.get(key);

          if (!existingConv) {
            // Start new conversation - higher base chance
            const chatChance =
              emp.state === "socializing" || emp.state === "break"
                ? 0.5
                : emp.state === "lunch"
                  ? 0.4
                  : 0.25;

            if (Math.random() < chatChance) {
              const newConv: Conversation = {
                participants: [emp.id, nearbyPartner.id],
                startTime: Date.now(),
                lastMessageTime: Date.now(),
              };
              setActiveConversations((prev) => {
                const next = new Map(prev);
                next.set(key, newConv);
                return next;
              });

              const text = generateConversationText(emp, true);
              addChatMessage(emp, text, nearbyPartner.id);
              foundConversation = true;
            }
          } else if (Date.now() - existingConv.lastMessageTime > 2500) {
            // Continue conversation
            const [id1, id2] = existingConv.participants;
            const lastSpeaker =
              chatMessages.length > 0 ? chatMessages[0].speakerId : id1;
            const nextSpeakerId = lastSpeaker === id1 ? id2 : id1;
            const nextSpeaker = activeEmployees.find(
              (e) => e.id === nextSpeakerId
            );

            if (nextSpeaker) {
              const text = generateConversationText(nextSpeaker, false);
              addChatMessage(
                nextSpeaker,
                text,
                lastSpeaker === id1 ? id2 : id1
              );

              setActiveConversations((prev) => {
                const next = new Map(prev);
                const conv = next.get(key);
                if (conv) {
                  conv.lastMessageTime = Date.now();
                }
                return next;
              });
            }
          }
        }
      }

      // If no nearby conversations found, randomly pair two employees for "ambient" chat
      if (
        !foundConversation &&
        activeConversations.size < 3 &&
        Math.random() < 0.3
      ) {
        const shuffled = [...chattableEmployees].sort(
          () => Math.random() - 0.5
        );
        if (shuffled.length >= 2) {
          const emp1 = shuffled[0];
          const emp2 = shuffled[1];
          const key = getConversationKey(emp1.id, emp2.id);

          if (!activeConversations.has(key)) {
            const newConv: Conversation = {
              participants: [emp1.id, emp2.id],
              startTime: Date.now(),
              lastMessageTime: Date.now(),
            };
            setActiveConversations((prev) => {
              const next = new Map(prev);
              next.set(key, newConv);
              return next;
            });

            const text = generateConversationText(emp1, true);
            addChatMessage(emp1, text, emp2.id);
          }
        }
      }

      // Clean up old conversations
      setActiveConversations((prev) => {
        const next = new Map(prev);
        for (const [key, conv] of prev.entries()) {
          const tooLong = Date.now() - conv.startTime > 25_000;
          if (tooLong) {
            next.delete(key);
          }
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(conversationInterval);
  }, [
    employees,
    activeConversations,
    chatMessages,
    addChatMessage,
    generateConversationText,
    getConversationKey,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Canvas Rendering (with animation loop for smooth pulses)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Clear
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid
      ctx.strokeStyle = "rgba(0, 0, 0, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Zones
      for (const zone of ZONES) {
        let fillColor = "rgba(0, 0, 0, 0.01)";
        let strokeColor = "rgba(0, 0, 0, 0.12)";

        switch (zone.type) {
          case "unreadable":
            fillColor = "rgba(200, 100, 100, 0.05)";
            strokeColor = "rgba(200, 100, 100, 0.3)";
            break;
          case "office":
          case "manager":
            fillColor = "rgba(100, 120, 100, 0.03)";
            break;
          case "conference":
            fillColor = "rgba(100, 100, 120, 0.03)";
            break;
          case "break":
          case "kitchen":
            fillColor = "rgba(120, 110, 100, 0.03)";
            break;
          case "bathroom":
            fillColor = "rgba(100, 110, 120, 0.03)";
            break;
          case "server":
            fillColor = "rgba(80, 80, 80, 0.05)";
            strokeColor = "rgba(150, 50, 50, 0.3)";
            break;
          case "elevator":
            fillColor = "rgba(90, 90, 90, 0.04)";
            break;
          case "open":
            ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
            for (let cx = zone.x + 20; cx < zone.x + zone.width; cx += 25) {
              ctx.beginPath();
              ctx.moveTo(cx, zone.y + 10);
              ctx.lineTo(cx, zone.y + zone.height - 10);
              ctx.stroke();
            }
            for (let cy = zone.y + 20; cy < zone.y + zone.height; cy += 20) {
              ctx.beginPath();
              ctx.moveTo(zone.x + 10, cy);
              ctx.lineTo(zone.x + zone.width - 10, cy);
              ctx.stroke();
            }
            break;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = zone.type === "corridor" ? 0.5 : 1;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

        if (zone.type === "unreadable") {
          for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(150, 100, 100, ${Math.random() * 0.15})`;
            ctx.fillRect(
              zone.x + Math.random() * zone.width,
              zone.y + Math.random() * zone.height,
              2,
              2
            );
          }
        }

        if (zone.label && zone.type !== "corridor") {
          ctx.fillStyle =
            zone.type === "unreadable"
              ? "rgba(200, 100, 100, 0.5)"
              : "rgba(0, 0, 0, 0.15)";
          ctx.font = "7px monospace";
          ctx.fillText(zone.label, zone.x + 3, zone.y + 10);
        }
      }

      // Employees
      const activeEmployees = employees.filter(
        (e: Employee) => e.hasArrived && !e.hasLeft
      );

      for (const emp of activeEmployees) {
        const isHovered = hoveredEmployee?.id === emp.id;
        const size = isHovered ? 5 : 3.5;

        // Vision cone (when moving)
        if (emp.state === "moving" || emp.state === "arriving") {
          const angle = Math.atan2(emp.targetY - emp.y, emp.targetX - emp.x);
          ctx.beginPath();
          ctx.moveTo(emp.x, emp.y);
          ctx.lineTo(
            emp.x + Math.cos(angle - 0.3) * 15,
            emp.y + Math.sin(angle - 0.3) * 15
          );
          ctx.lineTo(
            emp.x + Math.cos(angle + 0.3) * 15,
            emp.y + Math.sin(angle + 0.3) * 15
          );
          ctx.closePath();
          ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
          ctx.fill();
        }

        // Employee dot
        ctx.beginPath();
        ctx.arc(emp.x, emp.y, size, 0, Math.PI * 2);
        if (emp.isAnomaly) {
          ctx.fillStyle = "rgba(200, 100, 100, 0.9)";
        } else if (emp.followingCursor) {
          ctx.fillStyle = "rgba(180, 150, 100, 0.9)";
        } else {
          const opacity =
            emp.state === "moving" || emp.state === "arriving"
              ? 0.7
              : emp.state === "idle" || emp.hasLeft
                ? 0.4
                : 0.9;
          ctx.fillStyle =
            emp.color +
            Math.round(opacity * 255)
              .toString(16)
              .padStart(2, "0");
        }
        ctx.fill();

        // Check if in active conversation
        const isInConversation = Array.from(activeConversations.keys()).some(
          (key: string) => {
            const [id1, id2] = key.split("-");
            return id1 === emp.id || id2 === emp.id;
          }
        );

        // Pulsing conversation indicator
        if (isInConversation) {
          const pulse = Math.sin(Date.now() / 400) * 0.5 + 0.5;
          const pulseRadius = size + 6 + pulse * 8;

          // Outer pulsing ring
          ctx.beginPath();
          ctx.arc(emp.x, emp.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `${emp.color}${Math.round(
            (0.15 + pulse * 0.25) * 255
          )
            .toString(16)
            .padStart(2, "0")}`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner solid ring
          ctx.beginPath();
          ctx.arc(emp.x, emp.y, size + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `${emp.color}60`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Highlight ring when hovered
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(emp.x, emp.y, size + 2, 0, Math.PI * 2);
          ctx.strokeStyle = emp.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Working indicator (only if not in conversation)
        if (emp.state === "working" && !isInConversation) {
          const pulse = Math.sin(Date.now() / 500 + emp.x) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(emp.x, emp.y, size + 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(100, 130, 100, ${pulse * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Anomaly ring
        if (emp.isAnomaly) {
          const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(emp.x, emp.y, 8 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 100, 100, ${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Conversation connection lines
        for (const [convKey] of activeConversations.entries()) {
          const [id1, id2] = (convKey as string).split("-");
          if (emp.id === id1) {
            const partner = activeEmployees.find((e: Employee) => e.id === id2);
            if (partner) {
              ctx.beginPath();
              ctx.moveTo(emp.x, emp.y);
              ctx.lineTo(partner.x, partner.y);
              ctx.strokeStyle = `${emp.color}50`;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        }
      }
    };

    // Animation loop for smooth pulsing
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [employees, hoveredEmployee, activeConversations]);

  // ─────────────────────────────────────────────────────────────────────────
  // Mouse Handling
  // ─────────────────────────────────────────────────────────────────────────

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      setMousePos({ x, y });

      // Check if hovering over employee
      const activeEmployees = employees.filter(
        (emp) => emp.hasArrived && !emp.hasLeft
      );
      let found: Employee | null = null;
      for (const emp of activeEmployees) {
        const dist = Math.sqrt((emp.x - x) ** 2 + (emp.y - y) ** 2);
        if (dist < 10) {
          found = emp;
          break;
        }
      }
      setHoveredEmployee(found);
    },
    [employees]
  );

  const handleCanvasClick = useCallback(() => {
    if (hoveredEmployee) {
      addMessage(`FOCUSING ON SUBJECT ${hoveredEmployee.designation}`);
    }
  }, [hoveredEmployee, addMessage]);

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

  // Calculate stats
  const activeEmployees = employees.filter((e) => e.hasArrived && !e.hasLeft);
  const avgProductivity =
    activeEmployees.length > 0
      ? activeEmployees.reduce((sum, e) => sum + e.productivity, 0) /
        activeEmployees.length
      : 0;
  const workingCount = activeEmployees.filter(
    (e) => e.state === "working" || e.state === "thinking"
  ).length;

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <div
            className={`status-indicator ${
              observationStatus === "NOMINAL"
                ? "bg-[var(--system-green)]"
                : "bg-[var(--system-amber)]"
            }`}
          />
          <h2 className="font-designation text-[var(--void-gray-600)]">
            DEPARTMENT OVERVIEW
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-system text-[var(--void-gray-500)]">
            {formatTime(simTime)}
          </span>
          <span className="font-system text-[var(--void-gray-400)]">
            [{observationStatus}]
          </span>
          <button
            className="font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
            onClick={onExit}
            type="button"
          >
            [ESC]
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="relative flex-1 overflow-auto p-2">
          <div className="relative mx-auto w-fit">
            <div className="scan-lines pointer-events-none absolute inset-0 z-10" />
            <canvas
              className="cursor-crosshair border border-[var(--void-gray-200)]"
              height={CANVAS_HEIGHT}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              ref={canvasRef}
              width={CANVAS_WIDTH}
            />

            {/* Hover tooltip */}
            {hoveredEmployee && (
              <div
                className="pointer-events-none absolute z-20 border border-[var(--void-gray-200)] bg-white/95 px-2 py-1 font-system text-[9px]"
                style={{
                  left: `${(hoveredEmployee.x / CANVAS_WIDTH) * 100}%`,
                  top: `${(hoveredEmployee.y / CANVAS_HEIGHT) * 100}%`,
                  transform: "translate(12px, -50%)",
                }}
              >
                <div className="font-designation text-[10px] text-[var(--void-gray-600)]">
                  {hoveredEmployee.firstName}
                </div>
                <div className="text-[var(--void-gray-400)]">
                  {hoveredEmployee.designation} •{" "}
                  {hoveredEmployee.role.toUpperCase()}
                </div>
                <div className="mt-1 text-[var(--void-gray-400)]">
                  STATUS:{" "}
                  {hoveredEmployee.isAnomaly
                    ? "ANOMALY"
                    : hoveredEmployee.state.toUpperCase()}
                </div>
                <div className="text-[var(--void-gray-400)]">
                  ENERGY: {Math.round(hoveredEmployee.energy)}%
                </div>
                <div className="text-[var(--void-gray-400)]">
                  TASKS: {hoveredEmployee.tasksDone}
                </div>
                <div className="text-[var(--void-gray-300)]">
                  {hoveredEmployee.personality.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-44 border-[var(--void-gray-200)] border-l p-2 text-[9px]">
          {/* Stats */}
          <div className="mb-3 space-y-1 border-[var(--void-gray-100)] border-b pb-3">
            <div className="font-system text-[var(--void-gray-400)]">
              <span className="text-[var(--void-gray-300)]">SUBJECTS</span>{" "}
              {activeEmployees.length}/{NUM_EMPLOYEES}
            </div>
            <div className="font-system text-[var(--void-gray-400)]">
              <span className="text-[var(--void-gray-300)]">WORKING</span>{" "}
              {workingCount}
            </div>
            <div className="font-system text-[var(--void-gray-400)]">
              <span className="text-[var(--void-gray-300)]">ANOMALIES</span>{" "}
              <span
                className={anomalyCount > 0 ? "text-[var(--system-red)]" : ""}
              >
                {anomalyCount}
              </span>
            </div>
            <div className="font-system text-[var(--void-gray-400)]">
              <span className="text-[var(--void-gray-300)]">PRODUCTIVITY</span>{" "}
              {avgProductivity.toFixed(1)}%
            </div>
            <div className="font-system text-[var(--void-gray-400)]">
              <span className="text-[var(--void-gray-300)]">ZONE</span>{" "}
              SECTOR-7G
            </div>
          </div>

          {/* Activity log */}
          <div>
            <div className="mb-1 font-system text-[8px] text-[var(--void-gray-300)]">
              ACTIVITY LOG
            </div>
            <div className="max-h-20 space-y-0.5 overflow-auto">
              {systemMessages.map((msg, i) => (
                <div
                  className={`font-system ${
                    msg.type === "anomaly"
                      ? "text-[var(--system-red)]"
                      : msg.type === "cryptic"
                        ? "text-[var(--system-amber)]"
                        : i === 0
                          ? "text-[var(--void-gray-500)]"
                          : "text-[var(--void-gray-300)]"
                  }`}
                  key={msg.timestamp}
                >
                  {msg.text}
                </div>
              ))}
              {systemMessages.length === 0 && (
                <div className="font-system text-[var(--void-gray-300)]">
                  AWAITING ACTIVITY
                </div>
              )}
            </div>
          </div>

          {/* Chat box - Intercepted Communications */}
          <div className="mt-2 border-[var(--void-gray-100)] border-t pt-2">
            <div className="mb-1 font-system text-[8px] text-[var(--void-gray-300)]">
              INTERCEPTED COMMS
            </div>
            <div className="max-h-28 space-y-0.5 overflow-auto">
              {chatMessages.slice(0, 12).map((msg) => (
                <div className="font-system leading-tight" key={msg.id}>
                  <span
                    className="font-medium"
                    style={{ color: msg.speakerColor }}
                  >
                    {msg.speakerName}:
                  </span>{" "}
                  <span className="text-[var(--void-gray-400)]">
                    {msg.text}
                  </span>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="font-system text-[var(--void-gray-300)]">
                  NO TRANSMISSIONS
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-[var(--void-gray-100)] border-t px-4 py-1">
        <p className="text-center font-system text-[9px] text-[var(--void-gray-300)]">
          OBSERVATION ACTIVE • ALL MOVEMENT LOGGED • THE WORK CONTINUES
        </p>
      </div>
    </div>
  );
}
