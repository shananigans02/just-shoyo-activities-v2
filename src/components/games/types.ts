/**
 * GAMES MODULE - LUMEN INTERFACE
 *
 * Mini-games that embody corporate void aesthetic.
 * Each game is meaningless yet compelling.
 * The visitor is not meant to understand, only to participate.
 */

export interface GameProps {
  onExit: () => void;
}

export type GameType =
  | "compliance"
  | "memory"
  | "wellness"
  | "inbox"
  | "overview"
  | "box-alignment"
  | "file-sorting"
  | "surveillance-tagging"
  | "elevator-calibration"
  | "micro-maze"
  | "redaction-tool"
  | "time-logging"
  | "cursor-test";

export interface GameMetadata {
  id: GameType;
  title: string;
  subtitle: string;
  description: string;
}

export const GAME_METADATA: Record<GameType, GameMetadata> = {
  compliance: {
    id: "compliance",
    title: "COMPLIANCE SESSION",
    subtitle: "MAINTENANCE REQUIRED",
    description: "MAINTAIN OPERATIONAL PARAMETERS",
  },
  memory: {
    id: "memory",
    title: "MEMORY CALIBRATION",
    subtitle: "PATTERN RECOGNITION",
    description: "ALIGN COGNITIVE PATTERNS",
  },
  wellness: {
    id: "wellness",
    title: "WELLNESS CHECK",
    subtitle: "MANDATORY ASSESSMENT",
    description: "RESPOND TO DEPARTMENTAL INQUIRIES",
  },
  inbox: {
    id: "inbox",
    title: "INBOX ZERO",
    subtitle: "DOCUMENT PROCESSING",
    description: "SORT INCOMING MATERIALS",
  },
  overview: {
    id: "overview",
    title: "DEPARTMENT OVERVIEW",
    subtitle: "SURVEILLANCE ACTIVE",
    description: "OBSERVE DEPARTMENTAL ACTIVITY",
  },
  "box-alignment": {
    id: "box-alignment",
    title: "BOX ALIGNMENT TEST",
    subtitle: "SPATIAL ORGANIZATION",
    description: "ARRANGE UNITS INTO REGULATION FORMATION",
  },
  "file-sorting": {
    id: "file-sorting",
    title: "FILE SORTING",
    subtitle: "CLASSIFICATION EXERCISE",
    description: "CATEGORIZE DOCUMENTS ACCORDING TO PROCEDURE",
  },
  "surveillance-tagging": {
    id: "surveillance-tagging",
    title: "SURVEILLANCE TAGGING",
    subtitle: "OBSERVATION PROTOCOL",
    description: "REVIEW AND CLASSIFY MONITORED SCENES",
  },
  "elevator-calibration": {
    id: "elevator-calibration",
    title: "ELEVATOR CALIBRATION",
    subtitle: "ALIGNMENT MAINTENANCE",
    description: "MAINTAIN SYSTEM ALIGNMENT PARAMETERS",
  },
  "micro-maze": {
    id: "micro-maze",
    title: "MICRO-MAZE",
    subtitle: "NAVIGATION ASSESSMENT",
    description: "NAVIGATE DESIGNATED PATHWAYS",
  },
  "redaction-tool": {
    id: "redaction-tool",
    title: "REDACTION TOOL",
    subtitle: "INFORMATION CONTROL",
    description: "APPLY APPROPRIATE DOCUMENT REDACTIONS",
  },
  "time-logging": {
    id: "time-logging",
    title: "TIME LOGGING",
    subtitle: "ACTIVITY DOCUMENTATION",
    description: "RECORD TIME ALLOCATION FOR ACTIVITIES",
  },
  "cursor-test": {
    id: "cursor-test",
    title: "CURSOR TEST",
    subtitle: "MOTOR STABILITY",
    description: "DEMONSTRATE HAND STABILITY PARAMETERS",
  },
};

// System messages that appear during games
export const SYSTEM_MESSAGES = {
  positive: [
    "YOUR WORK IS APPRECIATED",
    "PROCESS NOMINAL",
    "EFFICIENCY NOTED",
    "CONTRIBUTION LOGGED",
    "DEPARTMENT SATISFIED",
    "PARAMETERS WITHIN RANGE",
  ],
  neutral: [
    "PROCESSING",
    "ACKNOWLEDGED",
    "RECORDED",
    "FILED",
    "NOTED",
    "INDEXED",
  ],
  negative: [
    "DEVIATION DETECTED",
    "RECALIBRATION SUGGESTED",
    "ANOMALY LOGGED",
    "REVIEW PENDING",
    "VARIANCE NOTED",
  ],
  cryptic: [
    "THE BOARD OBSERVES",
    "REMEMBER YOUR PURPOSE",
    "YOU ARE DOING WELL",
    "HARMONY IS PRODUCTIVITY",
    "PRODUCTIVITY IS PEACE",
  ],
};

export function getRandomMessage(type: keyof typeof SYSTEM_MESSAGES): string {
  const messages = SYSTEM_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}
