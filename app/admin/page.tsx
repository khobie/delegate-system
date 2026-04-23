"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { electoralAreas } from "../../data/electoralData";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6xQ3q41bzRYMgNyvqCbCvzmosNM4Fc1COcUVvxy5VTRsJ4qpN_d0BNtF430Ki3DnT/exec";

// ==================== TYPES ====================
type User = {
  id: string;
  username: string;
  password: string;
  role: "admin" | "issuer" | "panel_member";
  assignedAreas: string[]; // Electoral areas assigned to panel members (empty for admin/issuer)
  fullName: string;
};

// Keep PanelMember as alias for backward compatibility
type PanelMember = User;

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
const DEFAULT_ACCOUNTS: User[] = [
  { id: "admin", username: "admin", password: "delegate123", role: "admin", assignedAreas: [], fullName: "System Administrator" },
  { id: "issuer1", username: "issuer", password: "issuer123", role: "issuer", assignedAreas: [], fullName: "Data Entry Officer" },
  { id: "panel1", username: "panel1", password: "panel123", role: "panel_member", assignedAreas: ["AHAFO YE TWIA AKWAMU", "KWAHU ATIBIE"], fullName: "John Smith" },
  { id: "panel2", username: "panel2", password: "panel123", role: "panel_member", assignedAreas: ["DAMPASE", "OTI AKWAMU"], fullName: "Jane Doe" },
];

const POSITIONS = ["CHAIRMAN", "SECRETARY", "ORGANIZER", "WOMEN ORGANIZER", "YOUTH ORGANIZER", "COMMUNICATION OFFICER", "ELECTORAL AFFAIRS OFFICER"];
const DELEGATE_TYPES = ["Old Delegate", "New Delegate"];

const NAV_ITEMS = [
  { id: "dashboard", label: "📊 Dashboard", icon: "📊", roles: ["admin"] },
  { id: "issue", label: "📝 Issue Form", icon: "📝", roles: ["admin", "issuer"] },
  { id: "vetting", label: "✓ Vetting System", icon: "✓", roles: ["admin", "panel_member"] },
  { id: "accounts", label: "👤 Accounts", icon: "👤", roles: ["admin"] },
  { id: "reports", label: "📋 Reports", icon: "📋", roles: ["admin", "issuer", "panel_member"] },
];

// ==================== COMPONENTS ====================

// Bright Modern Detail Item component
function DetailItem({ 
  label, 
  value, 
  badge 
}: { 
  label: string; 
  value: string; 
  badge?: "success" | "error" | "default" | "warning" 
}) {
  const badgeStyles = {
    success: "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-transparent shadow-md",
    error: "bg-gradient-to-r from-red-400 to-rose-500 text-white border-transparent shadow-md",
    warning: "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent shadow-md",
    default: "bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 border-sky-200 shadow-sm"
  };

  return (
    <div className="group">
      <span className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1 block">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {badge ? (
          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${badgeStyles[badge]} shadow-sm`}>
            {value}
          </span>
        ) : (
          <p className="font-bold text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

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
       <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80 p-6 mb-8 shadow-sm">
         {/* Subtle background decoration */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100/15 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
         
         <div className="relative flex items-center gap-3 mb-5">
           <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
             <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
           </div>
           <h3 className="text-lg font-bold text-slate-900">Application Details</h3>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
           <DetailItem label="Full Name" value={`${record.surname} ${record.firstname}`} />
           <DetailItem label="Phone Number" value={record.phone} />
           <DetailItem label="Position" value={record.position} />
           <DetailItem 
             label="Status" 
             value={record.status}
             badge={record.status === "RETURNED" ? "success" : record.status === "REJECTED" ? "error" : "warning"}
           />
           <DetailItem label="Electoral Area" value={record.electoralArea} />
           <DetailItem label="Polling Station" value={record.station} />
           <DetailItem label="Delegate Type" value={record.delegateType} />
           <DetailItem 
             label="Issued Date" 
             value={record.issuedDate ? new Date(record.issuedDate).toLocaleDateString() : "N/A"} 
           />
         </div>
       </div>

      {/* Vetting Questions Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-lg mb-4">Vetting Questions Checklist</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200 hover:border-sky-300 hover:shadow-md transition-all duration-200 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={vettingQuestions.aspirantPresent}
                onChange={(e) => setVettingQuestions({ ...vettingQuestions, aspirantPresent: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-sky-300 text-sky-600 focus:ring-2 focus:ring-sky-400 focus:ring-offset-0 transition-all duration-200"
              />
              {vettingQuestions.aspirantPresent && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-sky-900">Aspirant present in person</span>
              <p className="text-sm text-sky-700 mt-0.5">The aspirant/delegate is physically present</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={vettingQuestions.partyMembershipCardSighted}
                onChange={(e) => setVettingQuestions({ ...vettingQuestions, partyMembershipCardSighted: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-emerald-300 text-emerald-600 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-0 transition-all duration-200"
              />
              {vettingQuestions.partyMembershipCardSighted && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-emerald-900">Party Membership ID Card sighted</span>
              <p className="text-sm text-emerald-700 mt-0.5">Valid party membership card was presented</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-violet-200 hover:border-violet-300 hover:shadow-md transition-all duration-200 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={vettingQuestions.nameMatchesPartyRegister}
                onChange={(e) => setVettingQuestions({ ...vettingQuestions, nameMatchesPartyRegister: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-violet-300 text-violet-600 focus:ring-2 focus:ring-violet-400 focus:ring-offset-0 transition-all duration-200"
              />
              {vettingQuestions.nameMatchesPartyRegister && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-violet-900">Name matches Party Register</span>
              <p className="text-sm text-violet-700 mt-0.5">Verified against the official party register</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={vettingQuestions.votersIdOrGhanaCardSighted}
                onChange={(e) => setVettingQuestions({ ...vettingQuestions, votersIdOrGhanaCardSighted: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-amber-300 text-amber-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0 transition-all duration-200"
              />
              {vettingQuestions.votersIdOrGhanaCardSighted && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-amber-900">National ID (Voters Card or Ghana Card)</span>
              <p className="text-sm text-amber-700 mt-0.5">Presented valid national identification</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border-2 border-rose-200 hover:border-rose-300 hover:shadow-md transition-all duration-200 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={vettingQuestions.passportPhotoMatches}
                onChange={(e) => setVettingQuestions({ ...vettingQuestions, passportPhotoMatches: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-rose-300 text-rose-600 focus:ring-2 focus:ring-rose-400 focus:ring-offset-0 transition-all duration-200"
              />
              {vettingQuestions.passportPhotoMatches && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-rose-900">Passport photo matches applicant</span>
              <p className="text-sm text-rose-700 mt-0.5">Photo on form matches the person present</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border-2 border-cyan-200 hover:border-cyan-300 hover:shadow-md transition-all duration-200 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={vettingQuestions.membershipConfirmedAtStation}
                onChange={(e) => setVettingQuestions({ ...vettingQuestions, membershipConfirmedAtStation: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-cyan-300 text-cyan-600 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-0 transition-all duration-200"
              />
              {vettingQuestions.membershipConfirmedAtStation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-cyan-900">Membership confirmed at station level</span>
              <p className="text-sm text-cyan-700 mt-0.5">Local party officials verified membership</p>
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

        {/* Decision Section with Bright Colors */}
        <div className="bg-gradient-to-r from-sky-50/50 via-blue-50/50 to-indigo-50/50 rounded-2xl p-6 mb-6 border-2 border-sky-100/50 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-sky-900">Decision Making</h3>
          <div className="flex gap-3 mb-4">
            {/* Approve Button */}
            <button
              onClick={() => onDecision("APPROVED", overallComment, vettingQuestions)}
              className={`relative flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg ${
                record.currentDecision === "APPROVED" 
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-500/50" 
                  : "bg-gradient-to-r from-green-300 to-emerald-400 text-green-900 hover:shadow-green-400/50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">Approve</span>
              </div>
              {record.currentDecision === "APPROVED" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
              )}
            </button>

            {/* Reject Button */}
            <button
              onClick={() => onDecision("REJECTED", overallComment, vettingQuestions)}
              className={`relative flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg ${
                record.currentDecision === "REJECTED" 
                  ? "bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-red-500/50" 
                  : "bg-gradient-to-r from-red-300 to-rose-400 text-red-900 hover:shadow-red-400/50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">Reject</span>
              </div>
              {record.currentDecision === "REJECTED" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
              )}
            </button>

            {/* Pending Button */}
            <button
              onClick={() => onDecision("PENDING", overallComment, vettingQuestions)}
              className={`relative flex-1 font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg ${
                record.currentDecision === "PENDING" 
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-500/50" 
                  : "bg-gradient-to-r from-amber-300 to-orange-400 text-amber-900 hover:shadow-amber-400/50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">Pending</span>
              </div>
              {record.currentDecision === "PENDING" && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
              )}
            </button>
          </div>

          {/* Current Decision Display */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-r from-slate-100 to-sky-50 border-2 border-sky-200">
            <span className="text-sm font-semibold text-slate-600">Current Decision: </span>
            <span className={`font-bold px-4 py-2 rounded-lg ${
              record.currentDecision === "APPROVED" 
                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md" 
                : record.currentDecision === "REJECTED" 
                ? "bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-md"
                : "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md"
            }`}>
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
                     <span className="font-medium text-slate-700">{decision.panelMemberName}</span>
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                       decision.decision === "APPROVED" 
                         ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white" 
                         : decision.decision === "REJECTED" 
                         ? "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                         : "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                     }`}>
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



// ==================== MAIN PAGE ====================
export default function AdminPage() {
  const [panelMembers, setPanelMembers] = useState<User[]>([]);
  const [delegateRecords, setDelegateRecords] = useState<DelegateRecord[]>([]);
  const [message, setMessage] = useState("");

  // Authentication
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

   // Force appropriate default tabs based on role
   useEffect(() => {
     if (currentUser?.role === "panel_member" && activeNav !== "vetting") {
       setActiveNav("vetting");
     } else if (currentUser?.role === "issuer" && activeNav !== "issue") {
       setActiveNav("issue");
     } else if (currentUser?.role === "admin" && activeNav !== "dashboard") {
       setActiveNav("dashboard");
     }
   }, [currentUser]);
   // Vetting State
   const [selectedRecord, setSelectedRecord] = useState<DelegateRecord | null>(null);

   // Issue Form
   const [issueForm, setIssueForm] = useState<Record<string, any>>({});
   const [issueStations, setIssueStations] = useState<{name: string; code: string}[]>([]);

   // Vetting State
   const [vettingRecords, setVettingRecords] = useState<DelegateRecord[]>([]);
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

    // Handle modal keyboard events and body scroll lock
    useEffect(() => {
      if (selectedRecord) {
        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            setSelectedRecord(null);
          }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
          document.body.style.overflow = 'unset';
          document.removeEventListener('keydown', handleEscape);
        };
      } else {
        document.body.style.overflow = 'unset';
      }
    }, [selectedRecord]);

  // Account Form
  const [accountForm, setAccountForm] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "issuer" as "admin" | "issuer" | "panel_member",
    assignedAreas: [] as string[],
  });

   // Report Filters
   const [reportFilterStatus, setReportFilterStatus] = useState("");
   const [reportFilterArea, setReportFilterArea] = useState("");
   const [reportFilterStation, setReportFilterStation] = useState("");
   const [reportFilterPosition, setReportFilterPosition] = useState("");
   const [reportFilterDelegateType, setReportFilterDelegateType] = useState("");
   const [reportView, setReportView] = useState<"summary" | "contests" | "detailed">("summary");
   




  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("panelMembers");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User[];
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
    setCurrentUser(null);
    setIsAuthorized(false);
    setLoginForm({ username: "", password: "" });
  };

   // Persist records
   const persistRecords = (newRecords: DelegateRecord[]) => {
     setDelegateRecords(newRecords);
     localStorage.setItem("delegateRecords", JSON.stringify(newRecords));
   };

    // Export functions
    const handleExportCSV = () => {
      let filtered = delegateRecords;

      if (currentUser?.role === "panel_member" && currentUser.assignedAreas.length > 0) {
        filtered = filtered.filter(r => currentUser.assignedAreas.includes(r.electoralArea));
      }

      if (reportFilterArea) filtered = filtered.filter(r => r.electoralArea === reportFilterArea);
      if (reportFilterStation) filtered = filtered.filter(r => r.stationCode === reportFilterStation);
      if (reportFilterPosition) filtered = filtered.filter(r => r.position === reportFilterPosition);
      if (reportFilterDelegateType) filtered = filtered.filter(r => r.delegateType === reportFilterDelegateType);
      if (reportFilterStatus) {
        if (reportFilterStatus === "ISSUED") {
          filtered = filtered.filter(r => r.status === "ISSUED");
        } else if (reportFilterStatus === "RETURNED") {
          filtered = filtered.filter(r => r.status === "RETURNED");
        } else if (reportFilterStatus === "VERIFIED") {
          filtered = filtered.filter(r => r.status === "RETURNED" && r.currentDecision === "APPROVED");
        } else if (reportFilterStatus === "REJECTED") {
          filtered = filtered.filter(r => r.status === "REJECTED");
        }
      }

      const filteredRecords = filtered;

      if (filteredRecords.length === 0) {
        setMessage("No data to export");
        return;
      }

     // Create CSV content
     const headers = [
       'Electoral Area',
       'Polling Station',
       'Position',
       'Delegate Type',
       'Status',
       'Decision',
       'Surname',
       'First Name',
       'Middle Name',
       'Phone',
       'Age',
       'Issued Date',
       'Returned Date'
     ];

     const csvRows = [];
     csvRows.push(headers.join(','));

     filteredRecords.forEach(record => {
       const row = [
         `"${record.electoralArea || ''}"`,
         `"${record.station || ''}"`,
         `"${record.position || ''}"`,
         `"${record.delegateType || ''}"`,
         `"${record.status || ''}"`,
         `"${record.currentDecision || ''}"`,
         `"${record.surname || ''}"`,
         `"${record.firstname || ''}"`,
         `"${record.middlename || ''}"`,
         `"${record.phone || ''}"`,
         `"${record.age || ''}"`,
         `"${record.issuedDate || ''}"`,
         `"${record.returnedDate || ''}"`
       ];
       csvRows.push(row.join(','));
     });

     const csvContent = csvRows.join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.setAttribute('href', url);
     link.setAttribute('download', `Final_Election_Report_${new Date().toISOString().slice(0,10)}.csv`);
     link.style.visibility = 'hidden';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
   };

    const handleExportExcel = () => {
      let filtered = delegateRecords;

      if (currentUser?.role === "panel_member" && currentUser.assignedAreas.length > 0) {
        filtered = filtered.filter(r => currentUser.assignedAreas.includes(r.electoralArea));
      }

      if (reportFilterArea) filtered = filtered.filter(r => r.electoralArea === reportFilterArea);
      if (reportFilterStation) filtered = filtered.filter(r => r.stationCode === reportFilterStation);
      if (reportFilterPosition) filtered = filtered.filter(r => r.position === reportFilterPosition);
      if (reportFilterDelegateType) filtered = filtered.filter(r => r.delegateType === reportFilterDelegateType);
      if (reportFilterStatus) {
        if (reportFilterStatus === "ISSUED") {
          filtered = filtered.filter(r => r.status === "ISSUED");
        } else if (reportFilterStatus === "RETURNED") {
          filtered = filtered.filter(r => r.status === "RETURNED");
        } else if (reportFilterStatus === "VERIFIED") {
          filtered = filtered.filter(r => r.status === "RETURNED" && r.currentDecision === "APPROVED");
        } else if (reportFilterStatus === "REJECTED") {
          filtered = filtered.filter(r => r.status === "REJECTED");
        }
      }

      const filteredRecords = filtered;

      if (filteredRecords.length === 0) {
        setMessage("No data to export");
        return;
      }

     // Create Excel-compatible CSV (UTF-8 with BOM)
     const headers = [
       'Electoral Area',
       'Polling Station',
       'Position',
       'Delegate Type',
       'Status',
       'Decision',
       'Surname',
       'First Name',
       'Middle Name',
       'Phone',
       'Age',
       'Issued Date',
       'Returned Date'
     ];

     const csvRows = [];
     csvRows.push(headers.join(','));

     filteredRecords.forEach(record => {
       const row = [
         `"${record.electoralArea || ''}"`,
         `"${record.station || ''}"`,
         `"${record.position || ''}"`,
         `"${record.delegateType || ''}"`,
         `"${record.status || ''}"`,
         `"${record.currentDecision || ''}"`,
         `"${record.surname || ''}"`,
         `"${record.firstname || ''}"`,
         `"${record.middlename || ''}"`,
         `"${record.phone || ''}"`,
         `"${record.age || ''}"`,
         `"${record.issuedDate || ''}"`,
         `"${record.returnedDate || ''}"`
       ];
       csvRows.push(row.join(','));
     });

     const csvContent = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM for Excel
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.setAttribute('href', url);
     link.setAttribute('download', `Final_Election_Report_${new Date().toISOString().slice(0,10)}.xls`);
     link.style.visibility = 'hidden';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
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
         const key = `${r.electoralArea}|${r.stationCode}|${r.position}`;
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
                // Issuers can only see records they issued (simplified - showing all for now, but can be enhanced)

    if (areaFilter) {
      filtered = filtered.filter(r => r.electoralArea === areaFilter);
    }

    if (stationFilter) {
      filtered = filtered.filter(r => r.stationCode === stationFilter);
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

     const newRecord = {
       id: Date.now().toString(),
       ...(issueForm as Omit<DelegateRecord, 'id' | 'decisions' | 'currentDecision' | 'status' | 'issuedDate'>),
       decisions: [],
       currentDecision: "PENDING",
       status: "ISSUED",
       issuedDate: new Date().toISOString(),
     } as DelegateRecord;

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
           status: (decision === "APPROVED" ? "RETURNED" : decision === "REJECTED" ? "REJECTED" : "PENDING_VERIFICATION") as "RETURNED" | "REJECTED" | "PENDING_VERIFICATION",
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
       status: (decision === "APPROVED" ? "RETURNED" : decision === "REJECTED" ? "REJECTED" : "PENDING_VERIFICATION") as "RETURNED" | "REJECTED" | "PENDING_VERIFICATION",
       overallComment,
     });

    setMessage(`Decision recorded: ${decision}`);
  };

  // Account Management
  const addAccount = () => {
    if (!accountForm.username || !accountForm.password || !accountForm.fullName) {
      setMessage("Please fill in all required fields.");
      return;
    }

    // For panel members, assigned areas are required
    if (accountForm.role === "panel_member" && accountForm.assignedAreas.length === 0) {
      setMessage("Please assign at least one electoral area for panel members.");
      return;
    }

    const exists = panelMembers.find(m => m.username === accountForm.username);
    if (exists) {
      setMessage("Username already exists.");
      return;
    }

    const newAccount: User = {
      id: `${accountForm.role}-${Date.now()}`,
      username: accountForm.username,
      password: accountForm.password,
      role: accountForm.role,
      assignedAreas: accountForm.role === "panel_member" ? accountForm.assignedAreas : [],
      fullName: accountForm.fullName,
    };

    const updated = [...panelMembers, newAccount];
    setPanelMembers(updated);
    localStorage.setItem("panelMembers", JSON.stringify(updated));
    setAccountForm({ username: "", password: "", fullName: "", role: "issuer", assignedAreas: [] });
    setMessage(`${accountForm.role.charAt(0).toUpperCase() + accountForm.role.slice(1).replace('_', ' ')} account created successfully!`);
  };

  // Backward compatibility
  const addPanelMember = () => {
    setAccountForm(prev => ({ ...prev, role: "panel_member" }));
    addAccount();
  };

  const removeAccount = (id: string) => {
    if (id === "admin") {
      setMessage("Cannot remove admin account.");
      return;
    }
    const account = panelMembers.find(m => m.id === id);
    if (!account) return;

    const roleName = account.role === "panel_member" ? "panel member" :
                     account.role === "issuer" ? "form issuer" : "admin";
    if (window.confirm(`Are you sure you want to remove this ${roleName} account?`)) {
      const updated = panelMembers.filter(m => m.id !== id);
      setPanelMembers(updated);
      localStorage.setItem("panelMembers", JSON.stringify(updated));
      setMessage(`${roleName.charAt(0).toUpperCase() + roleName.slice(1)} account removed.`);
    }
  };

  // Backward compatibility
  const removePanelMember = (id: string) => removeAccount(id);

  const toggleAreaAssignment = (area: string) => {
    setAccountForm(prev => ({
      ...prev,
      assignedAreas: prev.assignedAreas.includes(area)
        ? prev.assignedAreas.filter(a => a !== area)
        : [...prev.assignedAreas, area],
    }));
  };



  const getUniqueAreas = () => [...new Set(delegateRecords.map(r => r.electoralArea))].sort();

  // Auth guard
  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <p>Checking access...</p>
    </div>
  );

  if (!isAuthorized) {
    const handleAdminLogin = () => {
      const savedAccounts = localStorage.getItem("panelMembers");
      let accounts = DEFAULT_ACCOUNTS;
      if (savedAccounts) {
        try {
          const parsed = JSON.parse(savedAccounts);
          if (Array.isArray(parsed) && parsed.length > 0) accounts = parsed;
        } catch {}
      }
      const matchingAccount = accounts.find(
        (acc: any) => acc.username === loginForm.username && acc.password === loginForm.password
      );
      if (matchingAccount) {
        setCurrentUser(matchingAccount as User);
        setIsAuthorized(true);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(matchingAccount));
        setLoginError("");
      } else {
        setLoginError("Invalid username or password");
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-red-800 py-8 px-4 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="bg-gradient-to-r from-red-700 via-blue-700 to-green-600 px-6 py-5 rounded-t-xl -mx-8 -mt-8 mb-6 relative overflow-hidden">
            <div className="relative text-center">
              <h1 className="text-xl font-bold text-white tracking-wide">NEW JUABEN SOUTH</h1>
              <p className="text-yellow-300 text-sm font-semibold mt-1">NEW PATRIOTIC PARTY</p>
              <p className="text-blue-100 text-xs mt-1">Admin Dashboard Login</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input type="text" value={loginForm.username} placeholder="Enter username"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" value={loginForm.password} placeholder="Enter password"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} />
            </div>
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            <button className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg"
              onClick={handleAdminLogin}>Login</button>
            <Link href="/" className="block text-center text-sm text-slate-500 hover:text-slate-700 mt-4">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col border-r-4 border-red-600`}>
          {/* NPP Themed Header */}
          <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-red-900/80 via-blue-900/80 to-green-900/80 flex items-center justify-between shadow-lg">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                {/* NPP Logo placeholder */}
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs font-bold">NPP</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-white leading-tight">NEW JUABEN SOUTH</h1>
                  <p className="text-xs text-yellow-300 font-semibold">NPP Vetting System</p>
                </div>
              </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-700/50 rounded-lg text-white transition-colors border border-transparent hover:border-white/20">
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
          
          {/* Navigation with NPP colors */}
          <nav className="flex-1 p-4 space-y-2">
            {NAV_ITEMS
              .filter(item => item.roles.includes(currentUser?.role || "admin"))
              .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeNav === item.id 
                    ? "bg-gradient-to-r from-red-600 via-red-500 to-blue-600 text-white shadow-lg transform scale-105 border-l-4 border-yellow-400" 
                    : "hover:bg-slate-800/50 text-slate-300 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 space-y-2">
          <button
            onClick={() => { handleLogout(); window.location.href = "/"; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white border border-transparent hover:border-green-500/30"
          >
            <span className="text-xl">🏠</span>
            {sidebarOpen && <span>Back to Home</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/50 transition-colors text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/30"
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
               <div className="text-center py-6 bg-gradient-to-r from-red-50 via-blue-50 to-green-50 rounded-2xl border-2 border-red-100 mb-6">
                 <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 via-blue-700 to-green-700 bg-clip-text text-transparent">
                   NEW JUABEN SOUTH
                 </h1>
                 <h2 className="text-2xl font-bold text-red-700 mt-2">NEW PATRIOTIC PARTY</h2>
                 <p className="text-lg font-semibold text-slate-700 mt-3">Vetting & Verification Dashboard</p>
                 <div className="mt-3 flex items-center justify-center gap-3">
                   <div className="h-1 w-20 bg-red-600 rounded"></div>
                   <span className="px-4 py-1 bg-gradient-to-r from-red-100 to-blue-100 border-2 border-red-300 rounded-full text-sm font-bold text-red-800">CONSTITUENCY DASHBOARD</span>
                   <div className="h-1 w-20 bg-blue-600 rounded"></div>
                 </div>
               </div>
                <div className="flex items-center justify-between">
                  <div>
                 <div className="text-sm text-slate-500">
                   Logged in as: {currentUser?.fullName || currentUser?.username} ({currentUser?.role})
                 </div>
               </div>
               </div>

               {/* Stats Cards with NPP Colors */}
               <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                 {/* Total - NPP Red */}
                 <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-2xl text-white shadow-lg shadow-red-500/30 border-2 border-red-500">
                   <div className="text-4xl font-bold">{stats.total}</div>
                   <div className="text-red-100 mt-1 font-semibold">Total</div>
                 </div>
                 {/* Issued - NPP Green */}
                 <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 rounded-2xl text-white shadow-lg shadow-green-500/30 border-2 border-green-500">
                   <div className="text-4xl font-bold">{stats.issued}</div>
                   <div className="text-green-100 mt-1 font-semibold">Issued</div>
                 </div>
                 {/* Approved - Bright Green */}
                 <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/30 border-2 border-emerald-500">
                   <div className="text-4xl font-bold">{stats.approved}</div>
                   <div className="text-emerald-100 mt-1 font-semibold">Approved</div>
                 </div>
                 {/* Rejected - Bright Red */}
                 <div className="bg-gradient-to-br from-rose-600 to-red-700 p-6 rounded-2xl text-white shadow-lg shadow-rose-500/30 border-2 border-rose-500">
                   <div className="text-4xl font-bold">{stats.rejected}</div>
                   <div className="text-rose-100 mt-1 font-semibold">Rejected</div>
                 </div>
                 {/* Pending - NPP Yellow/Gold */}
                 <div className="bg-gradient-to-br from-amber-500 to-yellow-500 p-6 rounded-2xl text-white shadow-lg shadow-amber-500/30 border-2 border-amber-500">
                   <div className="text-4xl font-bold">{stats.pending}</div>
                   <div className="text-amber-100 mt-1 font-semibold">Pending</div>
                 </div>
                 {/* Contests - NPP Blue */}
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/30 border-2 border-blue-500">
                   <div className="text-4xl font-bold">{stats.contests}</div>
                   <div className="text-blue-100 mt-1 font-semibold">Contests</div>
                 </div>
                 {/* Returned - Cyan accent */}
                 <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-cyan-500/30 border-2 border-cyan-500">
                   <div className="text-4xl font-bold">{stats.returned}</div>
                   <div className="text-cyan-100 mt-1 font-semibold">Returned</div>
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
               <div className="text-center py-6 bg-gradient-to-r from-red-50 via-blue-50 to-green-50 rounded-2xl border-2 border-red-100">
                 <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 via-blue-700 to-green-700 bg-clip-text text-transparent">
                   NEW JUABEN SOUTH
                 </h1>
                 <h2 className="text-2xl font-bold text-red-700 mt-2">NEW PATRIOTIC PARTY</h2>
                 <p className="text-lg font-semibold text-slate-700 mt-3">Delegate Form Issuance</p>
                 <div className="mt-3 flex items-center justify-center gap-3">
                   <div className="h-1 w-16 bg-red-600 rounded"></div>
                   <span className="px-4 py-1 bg-gradient-to-r from-red-100 to-blue-100 border-2 border-red-300 rounded-full text-sm font-bold text-red-800">ISSUE PORTAL</span>
                   <div className="h-1 w-16 bg-blue-600 rounded"></div>
                 </div>
               </div>
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
                  className="w-full bg-gradient-to-r from-red-600 via-blue-600 to-green-600 hover:from-red-700 hover:via-blue-700 hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    Issue Delegate Form
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* VETTING WORKSPACE */}
          {activeNav === "vetting" && (
            <div className="space-y-6">
               <div className="text-center mb-8">
                 <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-blue-700 to-green-600 bg-clip-text text-transparent">
                   NEW JUABEN SOUTH
                 </h1>
                 <h2 className="text-2xl font-bold text-red-700 mt-2">
                   NEW PATRIOTIC PARTY
                 </h2>
                 <p className="text-lg font-semibold text-slate-700 mt-2">Vetting & Verification System</p>
                 <div className="mt-3 flex items-center justify-center gap-2">
                   <div className="h-1 w-16 bg-red-600 rounded"></div>
                   <span className="px-3 py-1 bg-gradient-to-r from-red-50 to-blue-50 border border-red-200 rounded-full text-sm font-bold text-red-800">EST. 2024</span>
                   <div className="h-1 w-16 bg-blue-600 rounded"></div>
                 </div>
               </div>

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


            </div>
          )}

            {/* ACCOUNTS */}
            {activeNav === "accounts" && (
              <div className="space-y-6">
                <div className="text-center py-6 bg-gradient-to-r from-red-50 via-blue-50 to-green-50 rounded-2xl border-2 border-red-100">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 via-blue-700 to-green-700 bg-clip-text text-transparent">
                    NEW JUABEN SOUTH
                  </h1>
                  <h2 className="text-2xl font-bold text-red-700 mt-2">NEW PATRIOTIC PARTY</h2>
                  <p className="text-lg font-semibold text-slate-700 mt-3">Account Management System</p>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <div className="h-1 w-16 bg-red-600 rounded"></div>
                    <span className="px-4 py-1 bg-gradient-to-r from-red-100 to-blue-100 border-2 border-red-300 rounded-full text-sm font-bold text-red-800">USER ACCOUNTS</span>
                    <div className="h-1 w-16 bg-blue-600 rounded"></div>
                  </div>
                </div>

               {/* Create Account Form */}
               <div className="bg-white rounded-2xl shadow-lg p-6">
                 <h2 className="text-xl font-bold text-slate-900 mb-4">👤 Create New Account</h2>
                 <div className="grid md:grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                     <input
                       value={accountForm.fullName}
                       onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                       className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       placeholder="Enter full name"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                     <input
                       value={accountForm.username}
                       onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                       className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       placeholder="Enter username"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                     <input
                       type="password"
                       value={accountForm.password}
                       onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                       className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       placeholder="Enter password"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                     <select
                       value={accountForm.role}
                       onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value as "admin" | "issuer" | "panel_member", assignedAreas: e.target.value !== "panel_member" ? [] : accountForm.assignedAreas })}
                       className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                     >
                       <option value="admin">🧑‍💼 Admin - Full System Access</option>
                       <option value="issuer">📝 Form Issuer - Data Entry</option>
                       <option value="panel_member">🧑‍⚖️ Panel Member - Vetting Officer</option>
                     </select>
                   </div>
                 </div>

                 {/* Assigned Areas (only for panel members) */}
                 {accountForm.role === "panel_member" && (
                   <div className="mb-4">
                     <label className="block text-sm font-medium text-slate-700 mb-2">🎯 Assigned Electoral Areas *</label>
                     <div className="flex flex-wrap gap-2">
                       {electoralAreas.map(area => (
                         <button
                           key={area.name}
                           type="button"
                           onClick={() => toggleAreaAssignment(area.name)}
                           className={`px-4 py-2 rounded-lg border transition-colors ${
                             accountForm.assignedAreas.includes(area.name)
                               ? "bg-blue-600 text-white border-blue-600"
                               : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                           }`}
                         >
                           {area.name}
                         </button>
                       ))}
                     </div>
                     {accountForm.assignedAreas.length === 0 && (
                       <p className="text-sm text-red-600 mt-1">At least one area must be selected for panel members</p>
                     )}
                   </div>
                 )}

                 <button
                   onClick={addAccount}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium"
                 >
                   Create Account
                 </button>
               </div>

               {/* Accounts List */}
               <div className="bg-white rounded-2xl shadow-lg p-6">
                 <h2 className="text-xl font-bold text-slate-900 mb-4">👥 Existing Accounts</h2>
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-slate-100">
                       <tr>
                         <th className="text-left py-3 px-4">Username</th>
                         <th className="text-left py-3 px-4">Full Name</th>
                         <th className="text-left py-3 px-4">Role</th>
                         <th className="text-left py-3 px-4">Assigned Areas</th>
                         <th className="text-center py-3 px-4">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {panelMembers.map(account => (
                         <tr key={account.id} className="border-b border-slate-100 hover:bg-slate-50">
                           <td className="py-3 px-4 font-medium">{account.username}</td>
                           <td className="py-3 px-4">{account.fullName}</td>
                           <td className="py-3 px-4">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                               account.role === "admin" ? "bg-purple-100 text-purple-700" :
                               account.role === "issuer" ? "bg-green-100 text-green-700" :
                               "bg-blue-100 text-blue-700"
                             }`}>
                               {account.role === "admin" ? "🧑‍💼 ADMIN" :
                                account.role === "issuer" ? "📝 ISSUER" :
                                "🧑‍⚖️ PANEL MEMBER"}
                             </span>
                           </td>
                           <td className="py-3 px-4">
                             {account.assignedAreas.length > 0 ? (
                               <div className="flex flex-wrap gap-1">
                                 {account.assignedAreas.map(area => (
                                   <span key={area} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                     {area}
                                   </span>
                                 ))}
                               </div>
                             ) : (
                               <span className="text-slate-400 text-sm">
                                 {account.role === "admin" ? "All Areas" : "No Areas Assigned"}
                               </span>
                             )}
                           </td>
                           <td className="py-3 px-4 text-center">
                             {account.id !== "admin" && (
                               <button
                                 onClick={() => removeAccount(account.id)}
                                 className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                               >
                                 Remove
                               </button>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   {panelMembers.length === 0 && (
                     <div className="text-center py-8 text-slate-500">No accounts found</div>
                   )}
                 </div>
               </div>

               {/* Role Permissions Guide */}
               <div className="bg-slate-50 rounded-2xl p-6">
                 <h2 className="text-xl font-bold text-slate-900 mb-4">🔐 Role Permissions Guide</h2>
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-slate-100">
                       <tr>
                         <th className="text-left py-3 px-4 font-semibold">Feature</th>
                         <th className="text-center py-3 px-4 font-semibold">🧑‍💼 Admin</th>
                         <th className="text-center py-3 px-4 font-semibold">📝 Issuer</th>
                         <th className="text-center py-3 px-4 font-semibold">🧑‍⚖️ Panel Member</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr className="border-b border-slate-100">
                         <td className="py-3 px-4 font-medium">Create/Edit User Accounts</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-red-600 font-bold">❌</td>
                         <td className="py-3 px-4 text-center text-red-600 font-bold">❌</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="py-3 px-4 font-medium">Issue Delegate Forms</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-red-600 font-bold">❌</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="py-3 px-4 font-medium">Edit Records (Before Vetting)</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-red-600 font-bold">❌</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="py-3 px-4 font-medium">Vet/Verify Delegates</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-red-600 font-bold">❌</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="py-3 px-4 font-medium">View All Data</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-amber-600 font-bold">Limited</td>
                         <td className="py-3 px-4 text-center text-amber-600 font-bold">Area Only</td>
                       </tr>
                       <tr className="border-b border-slate-100">
                         <td className="py-3 px-4 font-medium">Access Reports</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-amber-600 font-bold">Limited</td>
                         <td className="py-3 px-4 text-center text-amber-600 font-bold">Limited</td>
                       </tr>
                       <tr>
                         <td className="py-3 px-4 font-medium">Monitor Vetting Activities</td>
                         <td className="py-3 px-4 text-center text-green-600 font-bold">✔</td>
                         <td className="py-3 px-4 text-center text-red-600 font-bold">❌</td>
                         <td className="py-3 px-4 text-center text-red-600 font-bold">❌</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
           )}

           {/* REPORTS */}
           {activeNav === "reports" && (() => {
             // Helper function to get filtered report data
             const getFilteredReportData = () => {
               let filtered = delegateRecords;

               if (currentUser?.role === "panel_member" && currentUser.assignedAreas.length > 0) {
                 filtered = filtered.filter(r => currentUser.assignedAreas.includes(r.electoralArea));
               }

               if (reportFilterArea) filtered = filtered.filter(r => r.electoralArea === reportFilterArea);
               if (reportFilterStation) filtered = filtered.filter(r => r.stationCode === reportFilterStation);
               if (reportFilterPosition) filtered = filtered.filter(r => r.position === reportFilterPosition);
               if (reportFilterDelegateType) filtered = filtered.filter(r => r.delegateType === reportFilterDelegateType);
               if (reportFilterStatus) {
                 if (reportFilterStatus === "ISSUED") {
                   filtered = filtered.filter(r => r.status === "ISSUED");
                 } else if (reportFilterStatus === "RETURNED") {
                   filtered = filtered.filter(r => r.status === "RETURNED");
                 } else if (reportFilterStatus === "VERIFIED") {
                   filtered = filtered.filter(r => r.status === "RETURNED" && r.currentDecision === "APPROVED");
                 } else if (reportFilterStatus === "REJECTED") {
                   filtered = filtered.filter(r => r.status === "REJECTED");
                 }
               }

               return filtered;
             };

             const filteredRecords = getFilteredReportData();

             // Calculate summary stats
             const totalDelegates = filteredRecords.length;
             const issued = filteredRecords.filter(r => r.status === "ISSUED").length;
             const returned = filteredRecords.filter(r => r.status === "RETURNED").length;
             const verified = filteredRecords.filter(r => r.status === "RETURNED" && r.currentDecision === "APPROVED").length;
             const rejected = filteredRecords.filter(r => r.status === "REJECTED").length;
             const returnRate = issued > 0 ? (returned / issued) * 100 : 0;
             const verificationRate = returned > 0 ? (verified / returned) * 100 : 0;

             // Calculate contests (more than 1 applicant for same position in same polling station)
              const positionGroups = filteredRecords.reduce((acc, record) => {
                const key = `${record.electoralArea}|${record.stationCode}|${record.position}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(record);
                return acc;
              }, {} as Record<string, DelegateRecord[]>);

             const totalContests = Object.values(positionGroups).filter(group => group.length > 1).length;
             const totalUnopposed = Object.values(positionGroups).filter(group => group.length === 1).length;

             const oldDelegates = filteredRecords.filter(r => r.delegateType === "Old Delegate").length;
             const newDelegates = filteredRecords.filter(r => r.delegateType === "New Delegate").length;

             // Calculate area summary data
             const areaSummaryData = filteredRecords.reduce((acc, record) => {
               const area = record.electoralArea || "Unknown";
               if (!acc[area]) {
                 acc[area] = {
                   area,
                   issued: 0,
                   returned: 0,
                   verified: 0,
                   rejected: 0,
                   contests: 0,
                   total: 0
                 };
               }

               // Count by status
               if (record.status === "ISSUED") acc[area].issued++;
               if (record.status === "RETURNED") acc[area].returned++;
               if (record.status === "RETURNED" && record.currentDecision === "APPROVED") acc[area].verified++;
               if (record.status === "REJECTED") acc[area].rejected++;

               acc[area].total++;

               return acc;
             }, {} as Record<string, any>);

             // Add contest counts to area summary
             Object.values(positionGroups).forEach(group => {
               if (group.length > 0) {
                 const area = group[0].electoralArea || "Unknown";
                 if (areaSummaryData[area]) {
                   areaSummaryData[area].contests += group.length > 1 ? 1 : 0;
                 }
               }
             });

             const areaSummaryArray = Object.values(areaSummaryData);

             // Calculate detailed view data for contests only or detailed view
             const detailedViewData = reportView === "contests" ?
               Object.entries(positionGroups)
                 .filter(([_, applicants]) => applicants.length > 1)
                 .map(([key, applicants]) => {
                   const [area, station, position] = key.split('|');
                   return {
                     area,
                     station,
                     position,
                     applicants,
                     status: "CONTEST"
                   };
                 }) :
               Object.entries(positionGroups).map(([key, applicants]) => {
                 const [area, station, position] = key.split('|');
                 const status = applicants.length > 1 ? "CONTEST" : "UNOPPOSED";
                 return {
                   area,
                   station,
                   position,
                   applicants,
                   status
                 };
               });

              return (
                <div className="space-y-6">
                  {/* NPP Branding Header */}
                  <div className="text-center py-6 bg-gradient-to-r from-red-50 via-blue-50 to-green-50 rounded-2xl border-2 border-red-100">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 via-blue-700 to-green-700 bg-clip-text text-transparent">
                      NEW JUABEN SOUTH
                    </h1>
                    <h2 className="text-2xl font-bold text-red-700 mt-2">NEW PATRIOTIC PARTY</h2>
                    <p className="text-lg font-semibold text-slate-700 mt-3">Election Results & Analytics</p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <div className="h-1 w-16 bg-red-600 rounded"></div>
                      <span className="px-4 py-1 bg-gradient-to-r from-red-100 to-blue-100 border-2 border-red-300 rounded-full text-sm font-bold text-red-800">FINAL REPORT</span>
                      <div className="h-1 w-16 bg-blue-600 rounded"></div>
                    </div>
                  </div>

                  {/* Action Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">📊 Analytics Dashboard</h2>
                      <p className="text-slate-600">Comprehensive election overview and analytics</p>
                    </div>
                   <div className="flex flex-wrap gap-2">
                     <button
                       onClick={handleExportCSV}
                       className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                     >
                       📤 Export CSV
                     </button>
                     <button
                       onClick={handleExportExcel}
                       className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                     >
                       📤 Export Excel
                     </button>
                     <button
                       onClick={() => {
                         setMessage("Print PDF functionality would be implemented here");
                       }}
                       className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium"
                     >
                       🖨️ Print PDF
                     </button>
                   </div>
                 </div>

                 {/* View Options */}
                 <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl">
                   <span className="font-medium text-slate-700 mr-4">🎛️ View Options:</span>
                   <button
                     onClick={() => setReportView("summary")}
                     className={`px-4 py-2 rounded-lg font-medium ${reportView === "summary" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
                   >
                     Summary View
                   </button>
                   <button
                     onClick={() => setReportView("detailed")}
                     className={`px-4 py-2 rounded-lg font-medium ${reportView === "detailed" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
                   >
                     Detailed View
                   </button>
                   <button
                     onClick={() => setReportView("contests")}
                     className={`px-4 py-2 rounded-lg font-medium ${reportView === "contests" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
                   >
                     Contests Only
                   </button>
                 </div>

                 {/* Filters Section */}
                 <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                   <h2 className="text-xl font-bold text-slate-900 mb-4">🔍 Filters</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Electoral Area</label>
                       <select
                         value={reportFilterArea}
                         onChange={(e) => { setReportFilterArea(e.target.value); setReportFilterStation(""); }}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">All</option>
                         {electoralAreas.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Polling Station</label>
                       <select
                         value={reportFilterStation}
                         onChange={(e) => setReportFilterStation(e.target.value)}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                         disabled={!reportFilterArea}
                       >
                         <option value="">All</option>
                         {reportFilterArea &&
                           electoralAreas.find(a => a.name === reportFilterArea)?.pollingStations.map((s) => (
                             <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                           ))
                         }
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                       <select
                         value={reportFilterPosition}
                         onChange={(e) => setReportFilterPosition(e.target.value)}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">All</option>
                         {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Delegate Type</label>
                       <select
                         value={reportFilterDelegateType}
                         onChange={(e) => setReportFilterDelegateType(e.target.value)}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">All</option>
                          {DELEGATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                       <select
                         value={reportFilterStatus}
                         onChange={(e) => setReportFilterStatus(e.target.value)}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                       >
                         <option value="">All</option>
                         <option value="ISSUED">Issued</option>
                         <option value="RETURNED">Returned</option>
                         <option value="VERIFIED">Verified</option>
                         <option value="REJECTED">Rejected</option>
                       </select>
                     </div>
                   </div>
                   <div className="flex gap-3">
                     <button
                        onClick={() => {
                          setMessage("Filters applied successfully");
                        }}
                       className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                     >
                       Apply Filters
                     </button>
                     <button
                       onClick={() => {
                         setReportFilterArea("");
                         setReportFilterStation("");
                         setReportFilterPosition("");
                         setReportFilterDelegateType("");
                         setReportFilterStatus("");
                         setMessage("Filters cleared");
                       }}
                       className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium"
                     >
                       Clear Filters
                     </button>
                   </div>
                 </div>

                 {/* Summary Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <div className="text-3xl font-bold text-slate-900">{totalDelegates}</div>
                     <div className="text-slate-600 mt-1">Total Delegates</div>
                   </div>
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <div className="text-3xl font-bold text-slate-900">{returnRate.toFixed(1)}%</div>
                     <div className="text-slate-600 mt-1">Return Rate</div>
                   </div>
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <div className="text-3xl font-bold text-slate-900">{verificationRate.toFixed(1)}%</div>
                     <div className="text-slate-600 mt-1">Verification Rate</div>
                   </div>
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <div className="text-3xl font-bold text-slate-900">{totalContests}</div>
                     <div className="text-slate-600 mt-1">Total Contests</div>
                   </div>
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <div className="text-3xl font-bold text-slate-900">{totalUnopposed}</div>
                     <div className="text-slate-600 mt-1">Total Unopposed</div>
                   </div>
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <div className="text-3xl font-bold text-slate-900">{oldDelegates}</div>
                     <div className="text-slate-600 mt-1">Old Delegates</div>
                   </div>
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <div className="text-3xl font-bold text-slate-900">{newDelegates}</div>
                     <div className="text-slate-600 mt-1">New Delegates</div>
                   </div>
                 </div>

                 {/* Electoral Area Summary Table */}
                 <div className="bg-white rounded-xl shadow-lg p-6">
                   <h2 className="text-xl font-bold text-slate-900 mb-4">🗺️ Electoral Area Summary</h2>
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead className="bg-slate-100">
                         <tr>
                           <th className="text-left py-3 px-4 font-semibold">Electoral Area</th>
                           <th className="text-left py-3 px-4 font-semibold">Issued</th>
                           <th className="text-left py-3 px-4 font-semibold">Returned</th>
                           <th className="text-left py-3 px-4 font-semibold">Verified</th>
                           <th className="text-left py-3 px-4 font-semibold">Rejected</th>
                           <th className="text-left py-3 px-4 font-semibold">Contests</th>
                           <th className="text-left py-3 px-4 font-semibold">Total</th>
                         </tr>
                       </thead>
                       <tbody>
                         {areaSummaryArray.map((areaData: any, index: number) => (
                           <tr key={index} className={`border-b border-slate-100 hover:bg-slate-50 ${areaData.contests > 0 ? "bg-red-50" : ""}`}>
                             <td className="py-3 px-4 font-medium">{areaData.area}</td>
                             <td className="py-3 px-4">{areaData.issued}</td>
                             <td className="py-3 px-4">{areaData.returned}</td>
                             <td className="py-3 px-4">{areaData.verified}</td>
                             <td className="py-3 px-4">{areaData.rejected}</td>
                             <td className="py-3 px-4">
                               <span className={`px-3 py-1 rounded-full text-xs font-bold ${areaData.contests > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                 {areaData.contests}
                               </span>
                             </td>
                             <td className="py-3 px-4">{areaData.total}</td>
                           </tr>
                         ))}
                         {areaSummaryArray.length === 0 && (
                           <tr>
                             <td colSpan={7} className="py-8 text-center text-slate-500">No data available</td>
                           </tr>
                         )}
                       </tbody>
                       <tfoot className="bg-slate-50">
                         <tr>
                           <td className="py-3 px-4 font-bold text-slate-900">TOTAL</td>
                           <td className="py-3 px-4 font-bold text-slate-900">{issued}</td>
                           <td className="py-3 px-4 font-bold text-slate-900">{returned}</td>
                           <td className="py-3 px-4 font-bold text-slate-900">{verified}</td>
                           <td className="py-3 px-4 font-bold text-slate-900">{rejected}</td>
                           <td className="py-3 px-4 font-bold text-slate-900">{totalContests}</td>
                           <td className="py-3 px-4 font-bold text-slate-900">{totalDelegates}</td>
                         </tr>
                       </tfoot>
                     </table>
                   </div>
                 </div>

                 {/* Detailed View */}
                 {(reportView === "detailed" || reportView === "contests") && (
                   <div className="bg-white rounded-xl shadow-lg p-6">
                     <h2 className="text-xl font-bold text-slate-900 mb-4">
                       📋 {reportView === "contests" ? "Contests Only" : "Detailed View"}
                     </h2>
                     <div className="overflow-x-auto">
                       <table className="w-full">
                         <thead className="bg-slate-100">
                           <tr>
                             <th className="text-left py-3 px-4 font-semibold">Electoral Area</th>
                             <th className="text-left py-3 px-4 font-semibold">Polling Station</th>
                             <th className="text-left py-3 px-4 font-semibold">Position</th>
                             <th className="text-left py-3 px-4 font-semibold">Applicants</th>
                             <th className="text-left py-3 px-4 font-semibold">Status</th>
                           </tr>
                         </thead>
                         <tbody>
                           {detailedViewData.map((item: any, index: number) => (
                             <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                               <td className="py-3 px-4 font-medium">{item.area}</td>
                               <td className="py-3 px-4">{item.station}</td>
                               <td className="py-3 px-4">{item.position}</td>
                               <td className="py-3 px-4">
                                 <div className="space-y-2">
                                   {item.applicants.map((applicant: DelegateRecord, idx: number) => (
                                     <div key={idx} className="p-2 bg-slate-50 rounded">
                                       <div className="font-medium">{applicant.surname} {applicant.firstname}</div>
                                       <div className="text-sm text-slate-500">{applicant.delegateType} • {applicant.phone}</div>
                                     </div>
                                   ))}
                                 </div>
                               </td>
                               <td className="py-3 px-4">
                                 <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === "CONTEST" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                   {item.status}
                                 </span>
                               </td>
                             </tr>
                           ))}
                           {detailedViewData.length === 0 && (
                             <tr>
                               <td colSpan={5} className="py-8 text-center text-slate-500">
                                 {reportView === "contests" ? "No contested positions found" : "No data available"}
                               </td>
                             </tr>
                           )}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}
                </div>
              );
            })()}

            {/* Modern Bright Vetting Modal */}
            {selectedRecord && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                {/* Animated Bright Backdrop */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-sky-400/80 via-cyan-500/60 to-emerald-400/70 backdrop-blur-xl modal-backdrop"
                  onClick={() => setSelectedRecord(null)}
                />
                
                {/* Modal Container */}
                <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col modal-content">
                  {/* Vibrant Gradient Header */}
                  <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-t-2xl p-6 text-white shadow-2xl relative overflow-hidden">
                    {/* Decorative bright elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
                    <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-pink-300/15 rounded-full blur-xl"></div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        {/* Icon with bright glow */}
                        <div className="relative p-4 bg-white/25 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                          <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg"></div>
                          <span className="text-3xl relative z-10">🔍</span>
                        </div>
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                            ✨ Vetting Assessment
                          </h2>
                          <p className="text-white/90 text-sm sm:text-base mt-2 flex items-center gap-2">
                            <span className="font-semibold text-white">{selectedRecord.surname} {selectedRecord.firstname}</span>
                            <span className="w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></span>
                            <span className="text-cyan-100">{selectedRecord.position}</span>
                          </p>
                          {/* Location badges with bright colors */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-xs font-medium flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-white">{selectedRecord.electoralArea}</span>
                            </div>
                            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-xs font-medium flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-white">{selectedRecord.station}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Close button with bright hover */}
                      <button
                        onClick={() => setSelectedRecord(null)}
                        className="group p-3 hover:bg-white/20 rounded-xl transition-all duration-200 border border-transparent hover:border-white/30 hover:rotate-90 backdrop-blur-sm"
                        aria-label="Close modal"
                      >
                        <svg className="w-6 h-6 text-white/90 group-hover:text-white transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content Area - Bright theme */}
                  <div className="flex-1 bg-gradient-to-b from-sky-50/80 via-blue-50/60 to-white rounded-b-2xl shadow-2xl overflow-y-auto max-h-[60vh] modal-scrollbar border-t border-sky-100/50">
                    <div className="p-6 sm:p-8">
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
                  </div>

                  {/* Enhanced Bright Footer */}
                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 pb-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 shadow-sm">
                        <span className="text-sm">💡</span>
                        <span className="font-medium text-amber-700">Pro Tip</span>
                      </div>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        Press 
                        <kbd className="px-2 py-0.5 bg-white border border-sky-200 rounded font-mono text-xs font-semibold text-sky-700 transition-colors shadow-sm">Esc</kbd> 
                        to close
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                        <span className="font-medium text-emerald-700">Auto-saved</span>
                      </div>
                      <span className="text-sky-400">•</span>
                      <span className="text-slate-600 font-medium">{selectedRecord.surname} {selectedRecord.firstname}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
         </div>
       </main>
     </div>
   );
 }