"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { electoralAreas } from "../../data/electoralData";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6xQ3q41bzRYMgNyvqCbCvzmosNM4Fc1COcUVvxy5VTRsJ4qpN_d0BNtF430Ki3DnT/exec";

// ==================== TYPES ====================
type PanelMember = {
  id: string;
  username: string;
  password: string;
  role: "admin" | "panel_member";
  assignedAreas: string[]; // Electoral areas assigned to this panel member
  fullName: string;
};

type VettingDecision = {
  id: string;
  panelMemberId: string;
  panelMemberName: string;
  decision: "APPROVED" | "REJECTED" | "PENDING";
  timestamp: string;
  comments: string;
  vettingQuestions: {
    aspirantPresent: boolean;
    partyMembershipCardSighted: boolean;
    nameMatchesPartyRegister: boolean;
    votersIdOrGhanaCardSighted: boolean;
    passportPhotoMatches: boolean;
    membershipConfirmedAtStation: boolean;
  };
};

type DelegateRecord = {
  id: string;
  surname: string;
  firstname: string;
  middlename?: string;
  phone: string;
  age?: string | number;
  electoralArea: string;
  station: string;
  stationCode: string;
  position: string;
  delegateType: "Old Delegate" | "New Delegate";
  status: "ISSUED" | "RETURNED" | "REJECTED" | "PENDING_VERIFICATION" | "APPROVED";
  issuedDate?: string;
  returnedDate?: string;
  decisions: VettingDecision[];
  currentDecision: "APPROVED" | "REJECTED" | "PENDING";
  overallComment?: string;
  notes?: string;
};

type Account = {
  id: string;
  username: string;
  password: string;
  role: string;
};

// ==================== DEFAULT DATA ====================
const DEFAULT_ACCOUNTS: PanelMember[] = [
  { id: "admin", username: "admin", password: "delegate123", role: "admin", assignedAreas: [], fullName: "System Administrator" },
  { id: "panel1", username: "panel1", password: "panel123", role: "panel_member", assignedAreas: ["AHAFO YE TWIA AKWAMU", "KWAHU ATIBIE"], fullName: "John Smith" },
  { id: "panel2", username: "panel2", password: "panel123", role: "panel_member", assignedAreas: ["DAMPASE", "OTI AKWAMU"], fullName: "Jane Doe" },
];

const POSITIONS = ["CHAIRMAN", "SECRETARY", "ORGANIZER", "WOMEN ORGANIZER", "YOUTH ORGANIZER", "COMMUNICATION OFFICER", "ELECTORAL AFFAIRS OFFICER"];
const DELEGATE_TYPES = ["Old Delegate", "New Delegate"];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📊", roles: ["admin"] },
  { id: "issue", label: "Issue Form", icon: "📝", roles: ["admin"] },
  { id: "vetting", label: "Vetting Workspace", icon: "✓", roles: ["admin", "panel_member"] },
  { id: "panel", label: "Panel Members", icon: "👥", roles: ["admin"] },
  { id: "reports", label: "Reports", icon: "📋", roles: ["admin"] },
];

// ==================== COMPONENTS ====================

// Single Vetting Card with full decision tracking
function SingleVettingCard({
  record,
  onDecision,
  currentDecision,
  overallComment,
  setOverallComment,
  vettingQuestions,
  setVettingQuestions,
  panelMember,
  decisionHistory
}: {
  record: DelegateRecord;
  onDecision: (decision: "APPROVED" | "REJECTED" | "PENDING", comment: string, questions: any) => void;
  currentDecision: "APPROVED" | "REJECTED" | "PENDING";
  overallComment: string;
  setOverallComment: (c: string) => void;
  vettingQuestions: {
    aspirantPresent: boolean;
    partyMembershipCardSighted: boolean;
    nameMatchesPartyRegister: boolean;
    votersIdOrGhanaCardSighted: boolean;
    passportPhotoMatches: boolean;
    membershipConfirmedAtStation: boolean;
  };
  setVettingQuestions: (q: any) => void;
  panelMember: PanelMember;
  decisionHistory: VettingDecision[];
}) {
  const [showHistory, setShowHistory] = useState(false);

  const hasConflict = record.phone && panelMember.role === "admin";

  return (
    <div className="border-t border-slate-200 pt-6">
      {/* Conflict Warning */}
      {hasConflict && (
        <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-4">
          <h3 className="font-bold text-red-700">⚠️ Duplicate Phone Detected</h3>
          <p className="text-sm text-red-600">This phone number is used by multiple delegates. Please verify identity carefully.</p>
        </div>
      )}

      {/* Original Application Details */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-lg mb-2">Original Application</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-slate-500 text-sm">Name:</span>
            <p className="font-medium">{record.surname} {record.firstname}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Phone:</span>
            <p className="font-medium">{record.phone}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Position:</span>
            <p className="font-medium">{record.position}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === "RETURNED" ? "bg-green-100 text-green-700" : record.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-slate-200"}`}>{record.status}</span>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Electoral Area:</span>
            <p className="font-medium">{record.electoralArea}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Station:</span>
            <p className="font-medium">{record.station}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Type:</span>
            <p className="font-medium">{record.delegateType}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Issued:</span>
            <p className="font-medium">{record.issuedDate ? new Date(record.issuedDate).toLocaleDateString() : "-"}</p>
          </div>
        </div>
      </div>

      {/* Vetting Questions Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-lg mb-4">Vetting Questions Checklist</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={vettingQuestions.aspirantPresent}
              onChange={(e) => setVettingQuestions({ ...vettingQuestions, aspirantPresent: e.target.checked })}
              className="mt-1 w-5 h-5"
            />
            <div>
              <span className="font-medium">Aspirant present in person</span>
              <p className="text-sm text-slate-600">The aspirant/delegate is physically present</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={vettingQuestions.partyMembershipCardSighted}
              onChange={(e) => setVettingQuestions({ ...vettingQuestions, partyMembershipCardSighted: e.target.checked })}
              className="mt-1 w-5 h-5"
            />
            <div>
              <span className="font-medium">Party Membership ID Card sighted</span>
              <p className="text-sm text-slate-600">Valid party membership card was presented</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={vettingQuestions.nameMatchesPartyRegister}
              onChange={(e) => setVettingQuestions({ ...vettingQuestions, nameMatchesPartyRegister: e.target.checked })}
              className="mt-1 w-5 h-5"
            />
            <div>
              <span className="font-medium">Name matches Party Register for this Polling Station</span>
              <p className="text-sm text-slate-600">Verified against the official party register</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={vettingQuestions.votersIdOrGhanaCardSighted}
              onChange={(e) => setVettingQuestions({ ...vettingQuestions, votersIdOrGhanaCardSighted: e.target.checked })}
              className="mt-1 w-5 h-5"
            />
            <div>
              <span className="font-medium">National Voters ID or Ghana Card sighted</span>
              <p className="text-sm text-slate-600">Presented valid national ID (used if Party ID unavailable)</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={vettingQuestions.passportPhotoMatches}
              onChange={(e) => setVettingQuestions({ ...vettingQuestions, passportPhotoMatches: e.target.checked })}
              className="mt-1 w-5 h-5"
            />
            <div>
              <span className="font-medium">Passport photo (red background) matches applicant</span>
              <p className="text-sm text-slate-600">Applicant's appearance matches the photo on the ID</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={vettingQuestions.membershipConfirmedAtStation}
              onChange={(e) => setVettingQuestions({ ...vettingQuestions, membershipConfirmedAtStation: e.target.checked })}
              className="mt-1 w-5 h-5"
            />
            <div>
              <span className="font-medium">Membership Registration confirmed at THIS Polling Station</span>
              <p className="text-sm text-slate-600">Registration verified at this specific polling station</p>
            </div>
          </label>
        </div>
      </div>

      {/* Comment & Notes Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-lg mb-2">Comments & Notes</h3>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          className="w-full px-4 py-3 border border-blue-200 rounded-lg bg-white"
          rows={3}
          placeholder="Add your comments, observations, or notes regarding this delegate's application..."
        />
      </div>

      {/* Decision Section */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-lg mb-4">Decision</h3>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => onDecision("APPROVED", overallComment, vettingQuestions)}
            className={`flex-1 font-semibold py-3 rounded-xl transition-colors ${record.currentDecision === "APPROVED" ? "bg-green-600 text-white" : "bg-green-100 hover:bg-green-200 text-green-700"}`}
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onDecision("REJECTED", overallComment, vettingQuestions)}
            className={`flex-1 font-semibold py-3 rounded-xl transition-colors ${record.currentDecision === "REJECTED" ? "bg-red-600 text-white" : "bg-red-100 hover:bg-red-200 text-red-700"}`}
          >
            ✗ Reject
          </button>
          <button
            onClick={() => onDecision("PENDING", overallComment, vettingQuestions)}
            className={`flex-1 font-semibold py-3 rounded-xl transition-colors ${record.currentDecision === "PENDING" ? "bg-amber-600 text-white" : "bg-amber-100 hover:bg-amber-200 text-amber-700"}`}
          >
            ⏳ Pending
          </button>
        </div>

        {/* Current Decision Display */}
        <div className="text-center p-3 rounded-lg bg-slate-100">
          <span className="text-sm text-slate-600">Current Decision: </span>
          <span className={`font-bold px-3 py-1 rounded ${record.currentDecision === "APPROVED" ? "bg-green-200 text-green-800" : record.currentDecision === "REJECTED" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"}`}>
            {record.currentDecision}
          </span>
        </div>
      </div>

      {/* Decision History */}
      {decisionHistory.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full font-bold text-lg mb-2"
          >
            <span>Decision History</span>
            <span>{showHistory ? "▼" : "▶"}</span>
          </button>
          {showHistory && (
            <div className="space-y-2 mt-4">
              {decisionHistory.map((decision) => (
                <div key={decision.id} className="border-l-4 border-slate-300 pl-4 py-2 bg-white rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{decision.panelMemberName}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${decision.decision === "APPROVED" ? "bg-green-100 text-green-700" : decision.decision === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {decision.decision}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{decision.comments || "No comment"}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(decision.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Bulk Vetting Table
function BulkVettingTable({ records, persistRecords }: { records: DelegateRecord[]; persistRecords: (r: DelegateRecord[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDecision, setBulkDecision] = useState<"APPROVED" | "REJECTED" | "PENDING">("APPROVED");
  const [bulkComment, setBulkComment] = useState("");

  const handleToggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDecision = () => {
    if (selectedIds.length === 0) return;

    const now = new Date().toISOString();
    const updated = records.map(r => {
      if (!selectedIds.includes(String(r.id))) return r;

        const newDecision: VettingDecision = {
          id: `dec-${Date.now()}-${Math.random()}`,
          panelMemberId: "admin",
          panelMemberName: "Administrator",
          decision: bulkDecision,
          timestamp: now,
          comments: bulkComment,
          vettingQuestions: {
            aspirantPresent: true,
            partyMembershipCardSighted: true,
            nameMatchesPartyRegister: true,
            votersIdOrGhanaCardSighted: true,
            passportPhotoMatches: true,
            membershipConfirmedAtStation: true,
          },
      };

      return {
        ...r,
        decisions: [...(r.decisions || []), newDecision],
        currentDecision: bulkDecision,
        status: bulkDecision === "APPROVED" ? "RETURNED" : bulkDecision === "REJECTED" ? "REJECTED" : "PENDING_VERIFICATION",
        overallComment: bulkComment,
      };
    });

    persistRecords(updated);
    setSelectedIds([]);
    setBulkComment("");
  };

  if (records.length === 0) {
    return <div className="text-center py-8 text-slate-500">No pending records found</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={bulkDecision}
          onChange={(e) => setBulkDecision(e.target.value as any)}
          className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
        >
          <option value="APPROVED">Approve</option>
          <option value="REJECTED">Reject</option>
          <option value="PENDING">Mark Pending</option>
        </select>
        <input
          type="text"
          value={bulkComment}
          onChange={(e) => setBulkComment(e.target.value)}
          placeholder="Bulk comment (optional)"
          className="px-4 py-2 border border-slate-300 rounded-lg flex-1 min-w-[200px]"
        />
        <button
          onClick={handleBulkDecision}
          disabled={selectedIds.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 font-medium"
        >
          Apply to {selectedIds.length} selected
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left py-3 px-2"><input type="checkbox" onChange={(e) => e.target.checked ? setSelectedIds(records.map(r => String(r.id))) : setSelectedIds([])} /></th>
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-left py-3 px-2">Phone</th>
              <th className="text-left py-3 px-2">Position</th>
              <th className="text-left py-3 px-2">Station</th>
              <th className="text-left py-3 px-2">Area</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Decision</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-3 px-2"><input type="checkbox" checked={selectedIds.includes(String(r.id))} onChange={() => handleToggle(String(r.id))} /></td>
                <td className="py-3 px-2 font-medium">{r.surname} {r.firstname}</td>
                <td className="py-3 px-2">{r.phone}</td>
                <td className="py-3 px-2">{r.position}</td>
                <td className="py-3 px-2">{r.station}</td>
                <td className="py-3 px-2">{r.electoralArea}</td>
                <td className="py-3 px-2"><span className="px-2 py-1 bg-slate-200 rounded text-xs">{r.status}</span></td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${r.currentDecision === "APPROVED" ? "bg-green-100 text-green-700" : r.currentDecision === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {r.currentDecision}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function AdminPage() {
  const [panelMembers, setPanelMembers] = useState<PanelMember[]>([]);
  const [delegateRecords, setDelegateRecords] = useState<DelegateRecord[]>([]);
  const [message, setMessage] = useState("");

  // Authentication
  const [currentUser, setCurrentUser] = useState<PanelMember | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  // Force vetting tab for panel members
  useEffect(() => {
    if (currentUser?.role === "panel_member" && activeNav !== "vetting") {
      setActiveNav("vetting");
    }
  }, [currentUser]);

  // Issue Form
  const [issueForm, setIssueForm] = useState<Record<string, any>>({});
  const [issueStations, setIssueStations] = useState<{name: string; code: string}[]>([]);

  // Vetting State
  const [vettingRecords, setVettingRecords] = useState<DelegateRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DelegateRecord | null>(null);
  const [vettingSearchArea, setVettingSearchArea] = useState("");
  const [vettingSearchStation, setVettingSearchStation] = useState("");
  const [vettingSearchStations, setVettingSearchStations] = useState<{name: string; code: string}[]>([]);
  const [vettingViewMode, setVettingViewMode] = useState<"list" | "assigned">("list");

  // Vetting Form State
  const [overallComment, setOverallComment] = useState("");
  const [vettingQuestions, setVettingQuestions] = useState({
    aspirantPresent: false,
    partyMembershipCardSighted: false,
    nameMatchesPartyRegister: false,
    votersIdOrGhanaCardSighted: false,
    passportPhotoMatches: false,
    membershipConfirmedAtStation: false,
  });

  // Panel Member Form
  const [panelForm, setPanelForm] = useState({
    username: "",
    password: "",
    fullName: "",
    assignedAreas: [] as string[],
  });

  // Report Filters
  const [reportFilterStatus, setReportFilterStatus] = useState("");
  const [reportFilterArea, setReportFilterArea] = useState("");
  const [reportFilterStation, setReportFilterStation] = useState("");
  const [reportFilterPosition, setReportFilterPosition] = useState("");
  const [reportFilterDelegateType, setReportFilterDelegateType] = useState("");
  const [reportView, setReportView] = useState<"summary" | "contests" | "detailed">("summary");
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  const [expandedStations, setExpandedStations] = useState<string[]>([]);

  // Edit State
  const [editingRecord, setEditingRecord] = useState<DelegateRecord | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editStations, setEditStations] = useState<{name: string; code: string}[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("panelMembers");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PanelMember[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default panel members exist (one-time seed)
          const hasPanelMember = parsed.some(acc => acc.role === "panel_member");
          if (!hasPanelMember) {
            const defaultPanelMembers = DEFAULT_ACCOUNTS.filter(acc => acc.role === "panel_member");
            const merged = [...parsed, ...defaultPanelMembers];
            localStorage.setItem("panelMembers", JSON.stringify(merged));
            setPanelMembers(merged);
          } else {
            setPanelMembers(parsed);
          }
        }
      } catch {
        localStorage.setItem("panelMembers", JSON.stringify(DEFAULT_ACCOUNTS));
        setPanelMembers(DEFAULT_ACCOUNTS);
      }
    } else {
      localStorage.setItem("panelMembers", JSON.stringify(DEFAULT_ACCOUNTS));
      setPanelMembers(DEFAULT_ACCOUNTS);
    }

    const savedRecords = localStorage.getItem("delegateRecords");
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        const migrated = parsed.map((r: any) => ({
          ...r,
          decisions: r.decisions?.map((d: any) => ({
            ...d,
            vettingQuestions: {
              aspirantPresent: d.vettingQuestions?.formComplete || d.vettingQuestions?.aspirantPresent || false,
              partyMembershipCardSighted: d.vettingQuestions?.photoIdVerified || d.vettingQuestions?.partyMembershipCardSighted || false,
              nameMatchesPartyRegister: d.vettingQuestions?.eligibilityConfirmed || d.vettingQuestions?.nameMatchesPartyRegister || false,
              votersIdOrGhanaCardSighted: d.vettingQuestions?.positionMatches || d.vettingQuestions?.votersIdOrGhanaCardSighted || false,
              passportPhotoMatches: d.vettingQuestions?.noDuplicate || d.vettingQuestions?.passportPhotoMatches || false,
              membershipConfirmedAtStation: d.vettingQuestions?.finalApproval || d.vettingQuestions?.membershipConfirmedAtStation || false,
            }
          })) || [],
          currentDecision: r.currentDecision || "PENDING",
          overallComment: r.overallComment || "",
        }));
        setDelegateRecords(migrated);
      } catch {
        setDelegateRecords([]);
      }
    }

    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as PanelMember;
        setCurrentUser(parsedUser);
        setIsAuthorized(parsedUser.role === "admin" || parsedUser.role === "panel_member");
      } catch {
        setCurrentUser(null);
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(false);
    }

    setAuthChecked(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  // Persist records
  const persistRecords = (newRecords: DelegateRecord[]) => {
    setDelegateRecords(newRecords);
    localStorage.setItem("delegateRecords", JSON.stringify(newRecords));
  };

  // Stats computation
  const getStats = () => {
    const assignedRecords = currentUser?.role === "panel_member" && currentUser.assignedAreas.length > 0
      ? delegateRecords.filter(r => currentUser.assignedAreas.includes(r.electoralArea))
      : delegateRecords;

    return {
      total: assignedRecords.length,
      issued: assignedRecords.filter(r => r.status === "ISSUED").length,
      returned: assignedRecords.filter(r => r.status === "RETURNED").length,
      approved: assignedRecords.filter(r => r.currentDecision === "APPROVED").length,
      rejected: assignedRecords.filter(r => r.currentDecision === "REJECTED").length,
      pending: assignedRecords.filter(r => r.currentDecision === "PENDING").length,
      contests: Object.values(assignedRecords.reduce((acc, r) => {
        const key = `${r.electoralArea}|${r.station}|${r.position}`;
        if (!acc[key]) acc[key] = { count: 0 };
        acc[key].count++;
        return acc;
      }, {} as Record<string, { count: number }>)).filter(c => c.count > 1).length,
    };
  };

  const stats = getStats();

  // Area-based filtering for panel members
  const getFilteredRecords = (areaFilter?: string, stationFilter?: string) => {
    let filtered = delegateRecords;

    if (currentUser?.role === "panel_member" && currentUser.assignedAreas.length > 0) {
      filtered = filtered.filter(r => currentUser.assignedAreas.includes(r.electoralArea));
    }

    if (areaFilter) {
      filtered = filtered.filter(r => r.electoralArea === areaFilter);
    }

    if (stationFilter) {
      filtered = filtered.filter(r => r.station === stationFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.phone || '').includes(searchTerm) ||
        r.electoralArea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Issue Form Handler
  const handleAreaChange = (area: string) => {
    const selected = electoralAreas.find(a => a.name === area);
    const stations = selected ? selected.pollingStations : [];
    setIssueStations(stations);
    setIssueForm({ ...issueForm, electoralArea: area, station: "", stationCode: "" });
  };

  const handleStationChange = (stationCode: string) => {
    const selectedStation = issueStations.find(s => s.code === stationCode);
    setIssueForm({ ...issueForm, station: selectedStation?.name || "", stationCode });
  };

  const handleIssueSubmit = () => {
    if (!issueForm.surname || !issueForm.firstname || !issueForm.electoralArea || !issueForm.station || !issueForm.position || !issueForm.delegateType || !issueForm.phone) {
      setMessage("Please fill in all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(issueForm.phone)) {
      setMessage("Phone number must be exactly 10 digits.");
      return;
    }

    const existing = delegateRecords.find(r => r.phone === issueForm.phone);
    if (existing) {
      const update = window.confirm(`A delegate with phone ${issueForm.phone} already exists.\n\nExisting: ${existing.surname} ${existing.firstname} (${existing.position})\n\nUpdate existing record?`);
      if (update) {
        const updated = delegateRecords.map(r => r.phone === issueForm.phone ? { ...r, ...issueForm } : r);
        persistRecords(updated);
        setMessage("Record updated successfully!");
      }
      return;
    }

    const newRecord: DelegateRecord = {
      id: Date.now().toString(),
      ...issueForm,
      decisions: [],
      currentDecision: "PENDING",
      status: "ISSUED",
      issuedDate: new Date().toISOString(),
    };

    persistRecords([newRecord, ...delegateRecords]);
    setIssueForm({});
    setIssueStations([]);
    setMessage("Form issued successfully!");
  };

  // Vetting Decision Handler
  const handleVettingDecision = (decision: "APPROVED" | "REJECTED" | "PENDING") => {
    if (!selectedRecord || !currentUser) return;

    const now = new Date().toISOString();
    const newDecision: VettingDecision = {
      id: `dec-${Date.now()}`,
      panelMemberId: currentUser.id,
      panelMemberName: currentUser.fullName || currentUser.username,
      decision,
      timestamp: now,
      comments: overallComment,
      vettingQuestions,
    };

    const updatedRecords = delegateRecords.map(r => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          decisions: [...(r.decisions || []), newDecision],
          currentDecision: decision,
          status: decision === "APPROVED" ? "RETURNED" : decision === "REJECTED" ? "REJECTED" : "PENDING_VERIFICATION",
          overallComment: overallComment,
        };
      }
      return r;
    });

    persistRecords(updatedRecords);
    setSelectedRecord({
      ...selectedRecord,
      decisions: [...(selectedRecord.decisions || []), newDecision],
      currentDecision: decision,
      status: decision === "APPROVED" ? "RETURNED" : decision === "REJECTED" ? "REJECTED" : "PENDING_VERIFICATION",
      overallComment,
    });

    setMessage(`Decision recorded: ${decision}`);
  };

  // Panel Member Management
  const addPanelMember = () => {
    if (!panelForm.username || !panelForm.password || !panelForm.fullName) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const exists = panelMembers.find(m => m.username === panelForm.username);
    if (exists) {
      setMessage("Username already exists.");
      return;
    }

    const newMember: PanelMember = {
      id: `panel-${Date.now()}`,
      username: panelForm.username,
      password: panelForm.password,
      role: "panel_member",
      assignedAreas: panelForm.assignedAreas,
      fullName: panelForm.fullName,
    };

    const updated = [...panelMembers, newMember];
    setPanelMembers(updated);
    localStorage.setItem("panelMembers", JSON.stringify(updated));
    setPanelForm({ username: "", password: "", fullName: "", assignedAreas: [] });
    setMessage("Panel member added successfully!");
  };

  const removePanelMember = (id: string) => {
    if (id === "admin") {
      setMessage("Cannot remove admin account.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this panel member?")) {
      const updated = panelMembers.filter(m => m.id !== id);
      setPanelMembers(updated);
      localStorage.setItem("panelMembers", JSON.stringify(updated));
      setMessage("Panel member removed.");
    }
  };

  const toggleAreaAssignment = (area: string) => {
    setPanelForm(prev => ({
      ...prev,
      assignedAreas: prev.assignedAreas.includes(area)
        ? prev.assignedAreas.filter(a => a !== area)
        : [...prev.assignedAreas, area],
    }));
  };

  // Edit Record
  const handleEditRecord = (record: DelegateRecord) => {
    setEditingRecord(record);
    setEditForm({ ...record });
    const selected = electoralAreas.find(a => a.name === record.electoralArea);
    setEditStations(selected ? selected.pollingStations : []);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;

    const existingPhone = delegateRecords.find(r => r.phone === editForm.phone && r.id !== editingRecord.id);
    if (existingPhone) {
      setMessage("A delegate with this phone number already exists.");
      return;
    }

    const updatedRecords = delegateRecords.map(r => r.id === editingRecord.id ? { ...r, ...editForm } : r);
    persistRecords(updatedRecords);
    setEditingRecord(null);
    setEditForm({});
    setMessage("Record updated successfully!");
  };

  // Report generation
  const generateReport = () => {
    let filtered = delegateRecords;

    if (currentUser?.role === "panel_member" && currentUser.assignedAreas.length > 0) {
      filtered = filtered.filter(r => currentUser!.assignedAreas!.includes(r.electoralArea));
    }

    if (reportFilterStatus === "RETURNED/VERIFIED") filtered = filtered.filter(r => r.status === "RETURNED" && r.currentDecision === "APPROVED");
    else if (reportFilterStatus) filtered = filtered.filter(r => r.status === reportFilterStatus);

    if (reportFilterArea) filtered = filtered.filter(r => r.electoralArea === reportFilterArea);
    if (reportFilterStation) filtered = filtered.filter(r => r.station === reportFilterStation);
    if (reportFilterPosition) filtered = filtered.filter(r => r.position === reportFilterPosition);
    if (reportFilterDelegateType) filtered = filtered.filter(r => r.delegateType === reportFilterDelegateType);

    return delegateRecords.reduce((acc, r) => {
      const area = r.electoralArea || "Unknown";
      const station = r.station || "Unknown";
      const position = r.position || "Unknown";
      if (!acc[area]) acc[area] = {};
      if (!acc[area][station]) acc[area][station] = {};
      if (!acc[area][station][position]) acc[area][station][position] = [];
      acc[area][station][position].push(r);
      return acc;
    }, {} as Record<string, Record<string, Record<string, DelegateRecord[]>>>);
  };

  const getUniqueAreas = () => [...new Set(delegateRecords.map(r => r.electoralArea))].sort();

  // Auth guard
  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <p>Checking access...</p>
    </div>
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-red-800 py-8 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white/95 rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-6">You do not have permission to access the admin dashboard.</p>
          <Link href="/" className="inline-block bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800">
            Back to Issuance
          </Link>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold">Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS
            .filter(item => item.roles.includes(currentUser?.role || "admin"))
            .map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === item.id ? "bg-blue-600" : "hover:bg-slate-800"}`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-2">
          {currentUser?.role === "admin" && (
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="text-xl">🏠</span>
              {sidebarOpen && <span>Back to Home</span>}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-red-400 hover:text-red-300"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Message Banner */}
          {message && (
            <div className={`mb-4 p-4 rounded-xl border ${message.includes("❌") || message.includes("Please") || message.includes("Cannot") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {message}
              <button onClick={() => setMessage("")} className="ml-4 font-bold">×</button>
            </div>
          )}

          {/* DASHBOARD */}
          {activeNav === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-slate-600">Overview of delegate form management</p>
                </div>
                <div className="text-sm text-slate-500">
                  Logged in as: {currentUser?.fullName || currentUser?.username} ({currentUser?.role})
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.total}</div>
                  <div className="text-blue-100 mt-1">Total</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.issued}</div>
                  <div className="text-amber-100 mt-1">Issued</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.approved}</div>
                  <div className="text-green-100 mt-1">Approved</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.rejected}</div>
                  <div className="text-red-100 mt-1">Rejected</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.pending}</div>
                  <div className="text-amber-100 mt-1">Pending</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.contests}</div>
                  <div className="text-purple-100 mt-1">Contests</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.returned}</div>
                  <div className="text-cyan-100 mt-1">Returned</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">By Electoral Area</h2>
                  <div className="space-y-3">
                    {Object.entries(delegateRecords.reduce((acc, r) => { acc[r.electoralArea] = (acc[r.electoralArea] || 0) + 1; return acc; }, {} as Record<string, number>))
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([area, count]) => (
                        <div key={area} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">{area}</span>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">By Position</h2>
                  <div className="space-y-3">
                    {Object.entries(delegateRecords.reduce((acc, r) => { acc[r.position] = (acc[r.position] || 0) + 1; return acc; }, {} as Record<string, number>))
                      .sort(([,a], [,b]) => b - a)
                      .map(([pos, count]) => (
                        <div key={pos} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">{pos}</span>
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ISSUE FORM */}
          {activeNav === "issue" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-slate-900">Issue Delegate Form</h1>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Surname *</label>
                    <input
                      value={issueForm.surname || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, surname: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter surname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <input
                      value={issueForm.firstname || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, firstname: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                    <input
                      value={issueForm.middlename || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, middlename: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number * (10 digits)</label>
                    <input
                      type="tel"
                      value={issueForm.phone || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 0244123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={issueForm.age || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, age: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Age"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Electoral Area *</label>
                    <select
                      value={issueForm.electoralArea || ""}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Electoral Area</option>
                      {electoralAreas.map((area, i) => <option key={i} value={area.name}>{area.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Polling Station *</label>
                    <select
                      value={issueForm.stationCode || ""}
                      onChange={(e) => handleStationChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      disabled={issueStations.length === 0}
                    >
                      <option value="">Select Polling Station</option>
                      {issueStations.map((s, i) => <option key={i} value={s.code}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                    <select
                      value={issueForm.position || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, position: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Position</option>
                      {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Delegate Type *</label>
                    <select
                      value={issueForm.delegateType || ""}
                      onChange={(e) => setIssueForm({ ...issueForm, delegateType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Delegate Type</option>
                      {DELEGATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleIssueSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Issue Form
                </button>
              </div>
            </div>
          )}

          {/* VETTING WORKSPACE */}
          {activeNav === "vetting" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-slate-900">Vetting Workspace</h1>

              {/* View Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setVettingViewMode("list")}
                  className={`px-4 py-2 rounded-lg font-medium ${vettingViewMode === "list" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  📋 View All Records
                </button>
                {currentUser?.role === "panel_member" && currentUser.assignedAreas.length > 0 && (
                  <button
                    onClick={() => setVettingViewMode("assigned")}
                    className={`px-4 py-2 rounded-lg font-medium ${vettingViewMode === "assigned" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700"}`}
                  >
                    🎯 My Assigned Areas
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-slate-700">{getFilteredRecords().length}</div>
                  <div className="text-sm text-slate-600">Total</div>
                </div>
                <div className="bg-amber-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-amber-700">{getFilteredRecords().filter(r => r.currentDecision === "PENDING").length}</div>
                  <div className="text-sm text-amber-600">Pending</div>
                </div>
                <div className="bg-green-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-700">{getFilteredRecords().filter(r => r.currentDecision === "APPROVED").length}</div>
                  <div className="text-sm text-green-600">Approved</div>
                </div>
                <div className="bg-red-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-red-700">{getFilteredRecords().filter(r => r.currentDecision === "REJECTED").length}</div>
                  <div className="text-sm text-red-600">Rejected</div>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-700">{getFilteredRecords().filter(r => r.currentDecision !== "PENDING").length}</div>
                  <div className="text-sm text-blue-600">Reviewed</div>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Search & Filter</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, area, station, position..."
                    className="flex-1 min-w-[250px] px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={vettingSearchArea}
                    onChange={(e) => {
                      setVettingSearchArea(e.target.value);
                      const area = electoralAreas.find(a => a.name === e.target.value);
                      setVettingSearchStations(area ? area.pollingStations : []);
                      setVettingSearchStation("");
                    }}
                    className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">All Electoral Areas</option>
                    {electoralAreas.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                  <select
                    value={vettingSearchStation}
                    onChange={(e) => setVettingSearchStation(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white"
                    disabled={!vettingSearchArea}
                  >
                    <option value="">All Polling Stations</option>
                    {vettingSearchStations.map((s) => <option key={s.code} value={s.name}>{s.name} ({s.code})</option>)}
                  </select>
                  <select
                    value={reportFilterStatus}
                    onChange={(e) => setReportFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="ISSUED">Issued</option>
                    <option value="RETURNED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setVettingSearchArea("");
                      setVettingSearchStation("");
                      setReportFilterStatus("");
                    }}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-lg"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Records Table */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  {vettingViewMode === "assigned" ? "My Assigned Areas" : "All Records"}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left py-3 px-3">Name</th>
                        <th className="text-left py-3 px-3">Phone</th>
                        <th className="text-left py-3 px-3">Position</th>
                        <th className="text-left py-3 px-3">Electoral Area</th>
                        <th className="text-left py-3 px-3">Station</th>
                        <th className="text-left py-3 px-3">Status</th>
                        <th className="text-left py-3 px-3">Decision</th>
                        <th className="text-center py-3 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredRecords(vettingSearchArea, vettingSearchStation)
                        .filter(r => !reportFilterStatus || r.currentDecision === reportFilterStatus || r.status === reportFilterStatus)
                        .map((r) => (
                          <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-3 font-medium">{r.surname} {r.firstname}</td>
                            <td className="py-3 px-3">{r.phone}</td>
                            <td className="py-3 px-3">{r.position}</td>
                            <td className="py-3 px-3">{r.electoralArea}</td>
                            <td className="py-3 px-3">{r.station}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-1 rounded text-xs ${r.status === "RETURNED" ? "bg-green-100 text-green-700" : r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-slate-200"}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${r.currentDecision === "APPROVED" ? "bg-green-100 text-green-700" : r.currentDecision === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                {r.currentDecision}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setOverallComment(r.overallComment || "");
                                  const lastDecision = r.decisions?.length > 0 ? r.decisions[r.decisions.length - 1] : null;
                                  setVettingQuestions({
                                    aspirantPresent: lastDecision?.vettingQuestions.aspirantPresent || false,
                                    partyMembershipCardSighted: lastDecision?.vettingQuestions.partyMembershipCardSighted || false,
                                    nameMatchesPartyRegister: lastDecision?.vettingQuestions.nameMatchesPartyRegister || false,
                                    votersIdOrGhanaCardSighted: lastDecision?.vettingQuestions.votersIdOrGhanaCardSighted || false,
                                    passportPhotoMatches: lastDecision?.vettingQuestions.passportPhotoMatches || false,
                                    membershipConfirmedAtStation: lastDecision?.vettingQuestions.membershipConfirmedAtStation || false,
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Vetting
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {getFilteredRecords(vettingSearchArea, vettingSearchStation).length === 0 && (
                    <div className="text-center py-8 text-slate-500">No records found</div>
                  )}
                </div>
              </div>

              {/* Vetting Detail Panel */}
              {selectedRecord && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900">
                      Vetting: {selectedRecord.surname} {selectedRecord.firstname}
                    </h2>
                    <button
                      onClick={() => setSelectedRecord(null)}
                      className="text-slate-500 hover:text-slate-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <SingleVettingCard
                    record={selectedRecord}
                    onDecision={handleVettingDecision}
                    currentDecision={selectedRecord.currentDecision}
                    overallComment={overallComment}
                    setOverallComment={setOverallComment}
                    vettingQuestions={vettingQuestions}
                    setVettingQuestions={setVettingQuestions}
                    panelMember={currentUser!}
                    decisionHistory={selectedRecord.decisions || []}
                  />
                </div>
              )}
            </div>
          )}

          {/* PANEL MEMBERS */}
          {activeNav === "panel" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-slate-900">Panel Member Management</h1>

              {/* Add Panel Member Form */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Panel Member</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      value={panelForm.fullName}
                      onChange={(e) => setPanelForm({ ...panelForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                    <input
                      value={panelForm.username}
                      onChange={(e) => setPanelForm({ ...panelForm, username: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={panelForm.password}
                      onChange={(e) => setPanelForm({ ...panelForm, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Electoral Areas *</label>
                  <div className="flex flex-wrap gap-2">
                    {electoralAreas.map(area => (
                      <button
                        key={area.name}
                        type="button"
                        onClick={() => toggleAreaAssignment(area.name)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          panelForm.assignedAreas.includes(area.name)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {area.name}
                      </button>
                    ))}
                  </div>
                  {panelForm.assignedAreas.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">At least one area must be selected</p>
                  )}
                </div>

                <button
                  onClick={addPanelMember}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium"
                >
                  Add Panel Member
                </button>
              </div>

              {/* Panel Members List */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Existing Panel Members</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left py-3 px-3">Username</th>
                        <th className="text-left py-3 px-3">Full Name</th>
                        <th className="text-left py-3 px-3">Assigned Areas</th>
                        <th className="text-left py-3 px-3">Role</th>
                        <th className="text-center py-3 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {panelMembers.map(member => (
                        <tr key={member.id} className="border-b border-slate-100">
                          <td className="py-3 px-3 font-medium">{member.username}</td>
                          <td className="py-3 px-3">{member.fullName}</td>
                          <td className="py-3 px-3">
                            {member.assignedAreas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {member.assignedAreas.map(area => (
                                  <span key={area} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">All Areas (Admin)</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${member.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-200 text-slate-700"}`}>
                              {member.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {member.id !== "admin" && (
                              <button
                                onClick={() => removePanelMember(member.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {activeNav === "reports" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-900">Final Election Report</h1>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const report = generateReport();
                      // Export logic...
                      setMessage("Export CSV functionality would be implemented here");
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setMessage("Print PDF functionality would be implemented here");
                    }}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Print PDF
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border">
                <select
                  value={reportFilterArea}
                  onChange={(e) => { setReportFilterArea(e.target.value); setReportFilterStation(""); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">All Electoral Areas</option>
                  {electoralAreas.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                </select>
                <select
                  value={reportFilterStation}
                  onChange={(e) => setReportFilterStation(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                  disabled={!reportFilterArea}
                >
                  <option value="">All Polling Stations</option>
                  {getUniqueAreas()
                    .filter(a => !reportFilterArea || a === reportFilterArea)
                    .flatMap(a => electoralAreas.find(ea => ea.name === a)?.pollingStations || [])
                    .map((s, i) => <option key={i} value={s.code}>{s.name}</option>)
                  }
                </select>
                <select
                  value={reportFilterPosition}
                  onChange={(e) => setReportFilterPosition(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">All Positions</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={reportFilterDelegateType}
                  onChange={(e) => setReportFilterDelegateType(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">All Delegate Types</option>
                  {DELEGATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={reportFilterStatus}
                  onChange={(e) => setReportFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">All Status</option>
                  <option value="ISSUED">Issued</option>
                  <option value="RETURNED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PENDING_VERIFICATION">Pending</option>
                  <option value="APPROVED">Approved</option>
                </select>
                <button
                  onClick={() => {
                    setReportFilterArea("");
                    setReportFilterStation("");
                    setReportFilterPosition("");
                    setReportFilterDelegateType("");
                    setReportFilterStatus("");
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >
                  Clear Filters
                </button>
              </div>

              {/* Report View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setReportView("summary")}
                  className={`px-4 py-2 rounded-lg font-medium ${reportView === "summary" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border"}`}
                >
                  Summary View
                </button>
                <button
                  onClick={() => setReportView("detailed")}
                  className={`px-4 py-2 rounded-lg font-medium ${reportView === "detailed" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border"}`}
                >
                  Detailed View
                </button>
              </div>

              {/* Report Content */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Delegate Records</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Phone</th>
                        <th className="text-left py-3 px-4">Area</th>
                        <th className="text-left py-3 px-4">Station</th>
                        <th className="text-left py-3 px-4">Position</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delegateRecords
                        .filter(r =>
                          (!reportFilterArea || r.electoralArea === reportFilterArea) &&
                          (!reportFilterStation || r.stationCode === reportFilterStation) &&
                          (!reportFilterPosition || r.position === reportFilterPosition) &&
                          (!reportFilterDelegateType || r.delegateType === reportFilterDelegateType) &&
                          (!reportFilterStatus || (reportFilterStatus === "APPROVED" ? r.currentDecision === "APPROVED" : r.status === reportFilterStatus))
                        )
                        .map((record) => (
                          <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{record.surname} {record.firstname}</td>
                            <td className="py-3 px-4">{record.phone}</td>
                            <td className="py-3 px-4">{record.electoralArea}</td>
                            <td className="py-3 px-4">{record.station}</td>
                            <td className="py-3 px-4">{record.position}</td>
                            <td className="py-3 px-4">{record.delegateType}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === "RETURNED" ? "bg-green-100 text-green-700" : record.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-700"}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.currentDecision === "APPROVED" ? "bg-green-100 text-green-700" : record.currentDecision === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                {record.currentDecision}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {delegateRecords.filter(r =>
                    (!reportFilterArea || r.electoralArea === reportFilterArea) &&
                    (!reportFilterStation || r.stationCode === reportFilterStation) &&
                    (!reportFilterPosition || r.position === reportFilterPosition) &&
                    (!reportFilterDelegateType || r.delegateType === reportFilterDelegateType) &&
                    (!reportFilterStatus || (reportFilterStatus === "APPROVED" ? r.currentDecision === "APPROVED" : r.status === reportFilterStatus))
                  ).length === 0 && (
                    <div className="text-center py-8 text-slate-500">No records found</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}