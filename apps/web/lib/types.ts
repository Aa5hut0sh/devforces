//Auth
export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "User";
  createdAt: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

// Contets
export interface Contest {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "LIVE" | "ENDED" | "PRACTICE";
  mode: "CONTEST" | "PRACTICE";
}

export interface ContestDetail extends Contest {
  mode: "CONTEST" | "PRACTICE";
  contestToChallengeMapping: {
    index: number;
    challenge: Pick<Challenge, "id" | "title" | "maxPoints" | "editableFiles">;
  }[];
}

// challanges
export interface TestSpec {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: Record<string, unknown>;
  expect: {
    status: number;
    body?: Record<string, unknown>;
    bodyContains?: Record<string, unknown>;
    jsonSchema?: {
      required?: string[];
    };
  };
  weight: number;
  saveAs?: Record<string, string>;
}

export interface Challenge {
  id: string;
  title: string;
  notionDocId: string;
  maxPoints: number;
  editableFiles: string[];
  testSpec: TestSpec[];
  timeLimitSeconds: number;
}

// Submission

export type SubmissionStatus = "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "ERROR";

export interface TestResult {
  name: string;
  passed: boolean;
  weight: number;
  earnedWeight: number;
  actualStatus?: number;
  expectedStatus: number;
  actualBody?: unknown;
  failReason?: string;
  error?: string;
}

export interface Submission {
  id: string;
  userId: string;
  contestId: string;
  challengeId: string;
  status: SubmissionStatus;
  points: number;
  testResults: TestResult[];
  fullFiles: Record<string, string>;
  createdAt: string;
}

export interface SubmissionStatusResponse {
  id: string;
  status: SubmissionStatus;
  points: number;
  testResults: TestResult[] | null;
  createdAt: string;
  gradedAt: string | null;
}


export interface SubmitPayload {
  files: Record<string, string>;
}

export interface SubmitResponse {
  submissionId: string;
  status: "PENDING";
}

// Progress

export interface Progress {
  completed: boolean;
  files: Record<string, string>;      
  currentChallenge: {
    id: string;
    title: string;
    notionDocId: string;
    maxPoints: number;
    editableFiles: string[];
    index: number;
  } | null;
}
//leaderboard

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;          // not "userName"
  score: number;         // not "totalPoints"
}

export interface Leaderboard {
  contestId: string;
  entries: LeaderboardEntry[];
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  me: { rank: number; score: number; userId: string } | null;
}

//FileTree

export interface FileTree {
  [path: string]: string; // path -> content
}


//api Error

export interface ApiError {
  message: string;
  statusCode: number;
}


//Admin 
export interface CreateContestPayload {
  title: string;
  description?: string;
  boilerplateId: string;
  startTime: string; // ISO string
  endTime: string;
  mode?: "CONTEST" | "PRACTICE";
}

export interface UpdateContestPayload {
  title?: string;
  description?: string;
  boilerplateId?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateChallengePayload {
  title: string;
  notionDocId: string;
  maxPoints: number;
  editableFiles: string[];
  testSpec: TestSpec[];
  timeLimitSeconds?: number;
}

export interface UpdateChallengePayload {
  title?: string;
  notionDocId?: string;
  maxPoints?: number;
  editableFiles?: string[];
  testSpec?: TestSpec[];
  timeLimitSeconds?: number;
}

export interface MapChallengePayload {
  challengeId: string;
  index: number;
}

export interface AdminContest extends Contest {
  boilerplateId: string;
  createdAt: string;
}

export interface AdminChallenge {
  id: string;
  title: string;
  notionDocId: string;
  maxPoints: number;
  editableFiles: string[];
  testSpec: TestSpec[];
  timeLimitSeconds: number;
  createdAt: string;
}