export type DelegateStatus = "ISSUED" | "RETURNED" | "VERIFIED" | "REJECTED";

export type DelegateType = "Old Delegate" | "New Delegate";

export type Position = 
  | "CHAIRMAN"
  | "SECRETARY"
  | "ORGANIZER"
  | "WOMEN ORGANIZER"
  | "YOUTH ORGANIZER"
  | "COMMUNICATION OFFICER"
  | "ELECTORAL AFFAIRS OFFICER";

export type VettingDecision = "APPROVED" | "REJECTED" | "PENDING";

export interface PollingStation {
  name: string;
  code: string;
}

export interface ElectoralArea {
  name: string;
  pollingStations: PollingStation[];
}

export interface VettingQuestion {
  id: string;
  question: string;
  answer?: boolean;
  comment?: string;
}

export interface VettingAudit {
  id: number;
  delegateId: number;
  panelMemberId: string;
  panelMemberName: string;
  decision: VettingDecision;
  questions: VettingQuestion[];
  comments: string;
  timestamp: string;
}

export interface DelegateRecord {
  id: number;
  surname: string;
  firstname: string;
  middlename?: string;
  phone: string;
  age?: string;
  electoralArea: string;
  station: string;
  stationCode: string;
  position: string;
  delegateType: DelegateType;
  status: DelegateStatus;
  issuedDate: string;
  returnedDate?: string;
  rejectionReason?: string;
  verified?: boolean;
  positionFilled?: string;
  vetting?: {
    decision: VettingDecision;
    panelMemberId: string;
    panelMemberName: string;
    questions: VettingQuestion[];
    comments: string;
    vettedAt?: string;
  };
}

export interface Account {
  id: string;
  username: string;
  password: string;
  role: "admin" | "panel";
  assignedArea?: string;
  fullName: string;
}

export interface Contest {
  electoralArea: string;
  station: string;
  stationCode: string;
  position: string;
  count: number;
  candidates: DelegateRecord[];
}

export interface DashboardStats {
  totalIssued: number;
  totalReturned: number;
  totalVerified: number;
  totalRejected: number;
  totalContests: number;
  totalRecords: number;
}

export const POSITIONS: Position[] = [
  "CHAIRMAN",
  "SECRETARY",
  "ORGANIZER",
  "WOMEN ORGANIZER",
  "YOUTH ORGANIZER",
  "COMMUNICATION OFFICER",
  "ELECTORAL AFFAIRS OFFICER",
];

export const DELEGATE_TYPES: DelegateType[] = [
  "Old Delegate",
  "New Delegate",
];

export const DEFAULT_VETTING_QUESTIONS: VettingQuestion[] = [
  { id: "q1", question: "Is the delegate a registered party member?" },
  { id: "q2", question: "Is the delegate a registered voter in this constituency?" },
  { id: "q3", question: "Is the delegate's information consistent with records?" },
  { id: "q4", question: "Does the delegate have any disciplinary issues?" },
  { id: "q5", question: "Is the delegate eligible for the position applied?" },
  { id: "q6", question: "Is the delegate physically present for vetting?" },
  { id: "q7", question: "Are all required documents provided?" },
];

export const PANEL_ACCOUNTS: Account[] = [
  { id: "panel1", username: "panel1", password: "panel123", role: "panel", assignedArea: "OSABENE MILE 50", fullName: "Panel Member 1" },
  { id: "panel2", username: "panel2", password: "panel123", role: "panel", assignedArea: "ADWESO ESTATE", fullName: "Panel Member 2" },
  { id: "panel3", username: "panel3", password: "panel123", role: "panel", assignedArea: "ADWESO TOWN", fullName: "Panel Member 3" },
  { id: "panel4", username: "panel4", password: "panel123", role: "panel", assignedArea: "TWO STREAMS", fullName: "Panel Member 4" },
  { id: "panel5", username: "panel5", password: "panel123", role: "panel", assignedArea: "NYEREDE NORTH", fullName: "Panel Member 5" },
  { id: "admin", username: "admin", password: "delegate123", role: "admin", fullName: "System Admin" },
];