"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { electoralAreas } from "../../data/electoralData";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6xQ3q41bzRYMgNyvqCbCvzmosNM4Fc1COcUVvxy5VTRsJ4qpN_d0BNtF430Ki3DnT/exec";

type Account = {
  id: string;
  username: string;
  password: string;
  role: string;
};

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "admin", username: "admin", password: "delegate123", role: "admin" },
];

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "issue", label: "Issue Form", icon: "📝" },
  { id: "return", label: "Return Page", icon: "🔁" },
  { id: "reports", label: "Reports", icon: "📋" },
];

const POSITIONS = ["CHAIRMAN", "SECRETARY", "ORGANIZER", "WOMEN ORGANIZER", "YOUTH ORGANIZER", "COMMUNICATION OFFICER", "ELECTORAL AFFAIRS OFFICER"];
const DELEGATE_TYPES = ["Old Delegate", "New Delegate"];

function SingleVettingCard({ record, onVerify, onReject, verificationResult, returnedForm, setReturnedForm, rejectionReason, setRejectionReason, allRecords }: {
  record: Record<string, any>;
  onVerify: () => void;
  onReject: () => void;
  verificationResult: "ACCEPTED" | "REJECTED" | null;
  returnedForm: Record<string, any>;
  setReturnedForm: (f: Record<string, any>) => void;
  rejectionReason: string;
  setRejectionReason: (r: string) => void;
  allRecords?: Record<string, any>[];
}) {
  const hasConflict = record.phone && allRecords ? allRecords.filter(r => r.phone === record.phone && r.id !== record.id).length > 0 : false;
  
  return (
    <div className="border-t border-slate-200 pt-6">
      {hasConflict && (
        <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-4">
          <h3 className="font-bold text-red-700">⚠️ Duplicate Phone Detected</h3>
          <p className="text-sm text-red-600">This phone number is used by multiple delegates. Please verify identity carefully.</p>
        </div>
      )}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-lg mb-2">Original Application</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><span className="text-slate-500 text-sm">Name:</span><p className="font-medium">{record.surname} {record.firstname}</p></div>
          <div><span className="text-slate-500 text-sm">Phone:</span><p className="font-medium">{record.phone}</p></div>
          <div><span className="text-slate-500 text-sm">Position:</span><p className="font-medium">{record.position}</p></div>
          <div><span className="text-slate-500 text-sm">Status:</span><span className={`px-2 py-1 rounded text-xs font-medium ${record.status === "RETURNED" ? "bg-green-100 text-green-700" : "bg-slate-200"}`}>{record.status}</span></div>
          <div><span className="text-slate-500 text-sm">Electoral Area:</span><p className="font-medium">{record.electoralArea}</p></div>
          <div><span className="text-slate-500 text-sm">Station:</span><p className="font-medium">{record.station}</p></div>
          <div><span className="text-slate-500 text-sm">Type:</span><p className="font-medium">{record.delegateType}</p></div>
          <div><span className="text-slate-500 text-sm">Issued:</span><p className="font-medium">{record.issuedDate ? new Date(record.issuedDate).toLocaleDateString() : "-"}</p></div>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-lg mb-4">Verify Returned Form</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Position Filled</label>
          <select value={returnedForm.positionFilled || ""} onChange={(e) => setReturnedForm({...returnedForm, positionFilled: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
            <option value="">Select Position</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason (if rejecting)</label>
          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg" rows={2} placeholder="Enter reason..." />
        </div>
        <div className="flex gap-3">
          <button onClick={onVerify} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl">✓ Verify</button>
          <button onClick={onReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl">✗ Reject</button>
        </div>
      </div>
      {verificationResult && (
        <div className={`${verificationResult === "ACCEPTED" ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"} border-2 rounded-xl p-6 text-center`}>
          <div className="text-4xl mb-2">{verificationResult === "ACCEPTED" ? "✓" : "✗"}</div>
          <h3 className="text-xl font-bold">{verificationResult === "ACCEPTED" ? "ACCEPTED / VERIFIED" : "REJECTED"}</h3>
        </div>
      )}
    </div>
  );
}

function BulkVettingTable({ records, persistRecords }: { records: Record<string, any>[]; persistRecords: (r: Record<string, any>[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const handleToggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleBulkVerify = () => {
    if (selectedIds.length === 0) return;
    const updated = records.map(r => selectedIds.includes(String(r.id)) ? { ...r, status: "RETURNED", verified: true, returnedDate: new Date().toISOString() } : r);
    persistRecords(updated as any);
    setSelectedIds([]);
  };
  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    const updated = records.map(r => selectedIds.includes(String(r.id)) ? { ...r, status: "REJECTED", returnedDate: new Date().toISOString() } : r);
    persistRecords(updated as any);
    setSelectedIds([]);
  };
  
  if (records.length === 0) {
    return <div className="text-center py-8 text-slate-500">No pending records found</div>;
  }
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={handleBulkVerify} disabled={selectedIds.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">✓ Verify Selected ({selectedIds.length})</button>
        <button onClick={handleBulkReject} disabled={selectedIds.length === 0} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">✗ Reject Selected ({selectedIds.length})</button>
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
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Status</th>
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
                <td className="py-3 px-2">{r.delegateType}</td>
                <td className="py-3 px-2"><span className="px-2 py-1 bg-slate-200 rounded text-xs">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AreaVettingView({ records, area }: { records: Record<string, any>[]; area: string }) {
  const filtered = area ? records.filter(r => r.electoralArea === area) : records;
  const stations = [...new Set(filtered.map(r => r.station))].sort();
  const [expandedStations, setExpandedStations] = useState<string[]>([]);
  const toggleStation = (s: string) => setExpandedStations(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  
  return (
    <div className="space-y-4">
      {stations.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No records found</div>
      ) : (
        stations.map((station) => {
          const stationRecords = filtered.filter(r => r.station === station);
          return (
            <div key={station} className="border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleStation(station)} className="w-full bg-slate-100 p-4 flex justify-between items-center hover:bg-slate-200">
                <span className="font-bold">{station}</span>
                <span>{expandedStations.includes(station) ? "▼" : "▶"} ({stationRecords.length})</span>
              </button>
              {expandedStations.includes(station) && (
                <div className="p-4 space-y-2">
                  {stationRecords.map((r) => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div>
                        <span className="font-medium">{r.surname} {r.firstname}</span>
                        <span className="text-slate-500 ml-2">- {r.position}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${r.status === "RETURNED" ? "bg-green-100 text-green-700" : r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-slate-200"}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function AdminPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editStations, setEditStations] = useState<{name: string; code: string}[]>([]);
  const [selectedElectoralArea, setSelectedElectoralArea] = useState<string>("");
  const [selectedPollingStation, setSelectedPollingStation] = useState<string>("");
  
  const [reportFilterStatus, setReportFilterStatus] = useState("");
  const [reportFilterArea, setReportFilterArea] = useState("");
  const [reportFilterPosition, setReportFilterPosition] = useState("");
  const [reportFilterDelegateType, setReportFilterDelegateType] = useState("");
  const [reportFilterStations, setReportFilterStations] = useState<{name: string; code: string}[]>([]);
  const [reportView, setReportView] = useState<"summary" | "contests" | "detailed">("summary");
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  const [expandedStations, setExpandedStations] = useState<string[]>([]);
  const [reportFilterStation, setReportFilterStation] = useState("");
  
  const [returnSearchPhone, setReturnSearchPhone] = useState("");
  const [foundRecord, setFoundRecord] = useState<Record<string, any> | null>(null);
  const [returnedForm, setReturnedForm] = useState<Record<string, any>>({});
  const [verificationResult, setVerificationResult] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [returnSearchMode, setReturnSearchMode] = useState<"phone" | "station" | "area">("phone");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [stationStations, setStationStations] = useState<{name: string; code: string}[]>([]);
  const [pendingBulkIds, setPendingBulkIds] = useState<string[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editRecordForm, setEditRecordForm] = useState<Record<string, any>>({});
  const [issueForm, setIssueForm] = useState<Record<string, any>>({});
  const [issueStations, setIssueStations] = useState<{name: string; code: string}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("delegateAccounts");
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch {
        setAccounts(DEFAULT_ACCOUNTS);
      }
    } else {
      localStorage.setItem("delegateAccounts", JSON.stringify(DEFAULT_ACCOUNTS));
      setAccounts(DEFAULT_ACCOUNTS);
    }

    const savedRecords = localStorage.getItem("delegateRecords");
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch {
        setRecords([]);
      }
    }

    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as Account;
        setCurrentUser(parsedUser);
        setIsAuthorized(parsedUser.role === "admin");
      } catch {
        setCurrentUser(null);
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(false);
    }

    setAuthChecked(true);
  }, []);

  const persistRecords = (newRecords: Record<string, any>[]) => {
    setRecords(newRecords);
    localStorage.setItem("delegateRecords", JSON.stringify(newRecords));
  };

  const stats = {
    issued: records.filter(r => r.status === "ISSUED").length,
    returned: records.filter(r => r.status === "RETURNED").length,
    verified: records.filter(r => r.status === "RETURNED" && r.verified).length,
    rejected: records.filter(r => r.status === "REJECTED").length,
    total: records.length,
    contests: Object.values(records.reduce((acc, r) => {
      const key = `${r.electoralArea}|${r.station}|${r.position}`;
      if (!acc[key]) {
        acc[key] = { electoralArea: r.electoralArea, station: r.station, position: r.position, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { electoralArea: string; station: string; position: string; count: number }>)).filter(c => c.count > 1).length,
  };

  const filteredRecords = records.filter(r => 
    (!searchTerm || 
     r.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     String(r.phone || '').includes(searchTerm) ||
     r.electoralArea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.position?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedElectoralArea || r.electoralArea === selectedElectoralArea) &&
    (!selectedPollingStation || r.station === selectedPollingStation) &&
    (!reportFilterArea || r.electoralArea === reportFilterArea) &&
    (!reportFilterStation || r.station === reportFilterStation) &&
    (!reportFilterPosition || r.position === reportFilterPosition) &&
    (!reportFilterDelegateType || r.delegateType === reportFilterDelegateType) &&
    (!reportFilterStatus || r.status === reportFilterStatus || (reportFilterStatus === "RETURNED/VERIFIED" && r.status === "RETURNED"))
  );

  const handleAreaChange = (area: string, formSetter: (f: Record<string, any>) => void, currentForm: Record<string, any>) => {
    const selected = electoralAreas.find((a) => a.name === area);
    const stations = selected ? selected.pollingStations : [];
    if (formSetter === setIssueForm) setIssueStations(stations);
    if (formSetter === setEditForm) setEditStations(stations);
    formSetter({ ...currentForm, electoralArea: area, station: "", stationCode: "" });
  };

  const handleStationChange = (stationCode: string, formSetter: (f: Record<string, any>) => void, currentForm: Record<string, any>, allStations: {name: string; code: string}[]) => {
    const selectedStation = allStations.find(s => s.code === stationCode);
    formSetter({ ...currentForm, station: selectedStation?.name || "", stationCode });
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

    const existing = records.find(r => r.phone === issueForm.phone);
    if (existing) {
      const update = window.confirm(`A delegate with phone ${issueForm.phone} already exists.\n\nExisting: ${existing.surname} ${existing.firstname} (${existing.position})\n\nUpdate existing record?`);
      if (update) {
        const updated = records.map(r => r.phone === issueForm.phone ? { ...r, ...issueForm } : r);
        persistRecords(updated);
        setMessage("Record updated successfully!");
      }
      return;
    }

    const newRecord = {
      id: Date.now(),
      ...issueForm,
      status: "ISSUED",
      issuedDate: new Date().toISOString(),
    };
    persistRecords([newRecord, ...records]);
    setIssueForm({});
    setIssueStations([]);
    setMessage("Form issued successfully!");
  };

  const handleSearchReturn = (phone: string) => {
    const found = records.find(r => r.phone === phone && (r.status === "ISSUED" || r.status === "RETURNED-MISMATCH"));
    if (found) {
      setFoundRecord(found);
      setReturnedForm({});
      setVerificationResult(null);
      setRejectionReason("");
    } else {
      setFoundRecord(null);
      setMessage("No issued form found for this phone number.");
    }
  };

  const handleVerifyReturn = () => {
    if (!foundRecord || !returnedForm.positionFilled) {
      setMessage("Please fill in the position filled.");
      return;
    }

    const positionMatches = foundRecord.position === returnedForm.positionFilled;
    if (positionMatches) {
      setVerificationResult("ACCEPTED");
      const updated = records.map(r => r.id === foundRecord.id ? { ...r, status: "RETURNED", verified: true, returnedDate: new Date().toISOString(), positionFilled: returnedForm.positionFilled } : r);
      persistRecords(updated);
      setMessage("✅ ACCEPTED - Position verified!");
    } else {
      setVerificationResult("REJECTED");
      const updated = records.map(r => r.id === foundRecord.id ? { ...r, status: "REJECTED", returnedDate: new Date().toISOString(), positionFilled: returnedForm.positionFilled, rejectionReason: "Position mismatch" } : r);
      persistRecords(updated);
      setMessage("❌ REJECTED - Position does not match!");
    }
  };

  const handleRejectWithReason = () => {
    if (!foundRecord || !rejectionReason.trim()) {
      setMessage("Please provide a reason for rejection.");
      return;
    }
    const updated = records.map(r => r.id === foundRecord.id ? { ...r, status: "REJECTED", returnedDate: new Date().toISOString(), rejectionReason } : r);
    persistRecords(updated);
    setVerificationResult("REJECTED");
    setMessage("Form rejected.");
  };

  const handleEditRecord = (record: Record<string, any>) => {
    setEditingRecord(record);
    setEditForm({ ...record });
    const selected = electoralAreas.find((a) => a.name === record.electoralArea);
    setEditStations(selected ? selected.pollingStations : []);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;

    const existingPhone = records.find(r => r.phone === editForm.phone && r.id !== editingRecord.id);
    if (existingPhone) {
      setMessage("A delegate with this phone number already exists.");
      return;
    }

    const updatedRecords = records.map(r => r.id === editingRecord.id ? { ...r, ...editForm } : r);
    persistRecords(updatedRecords);
    setEditingRecord(null);
    setEditForm({});
    setMessage("Record updated successfully!");
  };

  const generateReport = () => {
    let filtered = records;
    if (reportFilterStatus === "RETURNED/VERIFIED") filtered = filtered.filter(r => r.status === "RETURNED");
    else if (reportFilterStatus) filtered = filtered.filter(r => r.status === reportFilterStatus);
    if (reportFilterArea) filtered = filtered.filter(r => r.electoralArea === reportFilterArea);
    if (reportFilterStation) filtered = filtered.filter(r => r.station === reportFilterStation);
    if (reportFilterPosition) filtered = filtered.filter(r => r.position === reportFilterPosition);
    if (reportFilterDelegateType) filtered = filtered.filter(r => r.delegateType === reportFilterDelegateType);
    
    const report: Record<string, any> = {};
    filtered.forEach((record) => {
      const area = record.electoralArea || "Unknown";
      const station = record.station || "Unknown";
      const position = record.position || "Unknown";
      if (!report[area]) report[area] = {};
      if (!report[area][station]) report[area][station] = {};
      if (!report[area][station][position]) report[area][station][position] = [];
      report[area][station][position].push(record);
    });
    return report;
  };

  const exportReportToCSV = () => {
    const report = generateReport();
    const lines = ["Electoral Area,Polling Station,Position,Candidate Name,Phone,Delegate Type,Status,Issued Date,Returned Date"];
    Object.entries(report).forEach(([area, stations]: any) => {
      Object.entries(stations).forEach(([station, positions]: any) => {
        Object.entries(positions).forEach(([position, candidates]: any) => {
          candidates.forEach((c: any) => {
            lines.push(`"${area}","${station}","${position}","${c.surname} ${c.firstname}","${c.phone}","${c.delegateType}","${c.status}","${c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : ""}","${c.returnedDate ? new Date(c.returnedDate).toLocaleDateString() : ""}"`);
          });
        });
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `delegate-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportReportToExcel = () => {
    const report = generateReport();
    let html = `<html><head><meta charset="UTF-8"><style>
      table { border-collapse: collapse; width: 100%; font-family: Arial; }
      th, td { border: 1px solid #ddd; padding: 8px; }
      th { background-color: #1e40af; color: white; }
      .contest { background-color: #fef2f2; }
      .unopposed { background-color: #f0fdf4; }
    </style></head><body>
    <h1>NEW JUABEN SOUTH - Delegate Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <table>
      <tr><th>Electoral Area</th><th>Polling Station</th><th>Position</th><th>Candidate Name</th><th>Phone</th><th>Type</th><th>Status</th><th>Issued</th><th>Returned</th></tr>`;
    
    Object.entries(report).forEach(([area, stations]: any) => {
      Object.entries(stations).forEach(([station, positions]: any) => {
        Object.entries(positions).forEach(([position, candidates]: any) => {
          const isContest = candidates.length > 1;
          candidates.forEach((c: any) => {
            html += `<tr class="${isContest ? 'contest' : 'unopposed'}">
              <td>${area}</td><td>${station}</td><td>${position}</td>
              <td>${c.surname} ${c.firstname}</td><td>${c.phone}</td>
              <td>${c.delegateType}</td><td>${c.status}</td>
              <td>${c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : ""}</td>
              <td>${c.returnedDate ? new Date(c.returnedDate).toLocaleDateString() : ""}</td>
            </tr>`;
          });
        });
      });
    });
    html += "</table></body></html>";
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `delegate-report-${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
  };

  const printReport = () => {
    const report = generateReport();
    const reportStats = {
      total: records.length,
      contests: contests.length,
      unopposed: Object.values(records.reduce((acc, r) => {
        const key = `${r.electoralArea}|${r.station}|${r.position}`;
        if (!acc[key]) acc[key] = 0;
        acc[key]++;
        return acc;
      }, {} as Record<string, number>)).filter(c => c === 1).length,
      returnRate: records.length > 0 ? Math.round((records.filter(r => r.status === "RETURNED").length / records.length) * 100) : 0,
      verifiedRate: records.filter(r => r.status === "RETURNED").length > 0 ? Math.round((records.filter(r => r.verified).length / records.filter(r => r.status === "RETURNED").length) * 100) : 0
    };
    
    let printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`<!DOCTYPE html>
    <html><head><title>Final Election Report</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      h1 { color: #1e40af; text-align: center; }
      .header { text-align: center; margin-bottom: 20px; }
      .stats { display: flex; justify-content: space-around; margin: 20px 0; }
      .stat { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
      .stat-num { font-size: 24px; font-weight: bold; }
      .area-header { background: #1e40af; color: white; padding: 10px; margin-top: 20px; font-weight: bold; }
      .station-header { padding: 10px; margin: 10px 0; border-left: 4px solid #3b82f6; }
      .position-block { padding: 10px; margin: 5px 0; border-radius: 5px; }
      .contest { background: #fef2f2; border: 1px solid #fecaca; }
      .unopposed { background: #f0fdf4; border: 1px solid #bbf7d0; }
      .badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; }
      .contest .badge { background: #fecaca; color: #991b1b; }
      .unopposed .badge { background: #bbf7d0; color: #166534; }
      .candidate { padding: 5px; margin: 3px 0; background: white; border: 1px solid #eee; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #1e40af; color: white; }
    </style></head><body>
    <div class="header">
      <h1>NEW JUABEN SOUTH CONSTITUENCY</h1>
      <p>Final Election Report - ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-num">${reportStats.total}</div><div>Total Delegates</div></div>
      <div class="stat"><div class="stat-num">${reportStats.contests}</div><div>Contests</div></div>
      <div class="stat"><div class="stat-num">${reportStats.unopposed}</div><div>Unopposed</div></div>
      <div class="stat"><div class="stat-num">${reportStats.returnRate}%</div><div>Return Rate</div></div>
      <div class="stat"><div class="stat-num">${reportStats.verifiedRate}%</div><div>Verified Rate</div></div>
    </div>
    <h2>Contests Only</h2>
    <table><tr><th>Area</th><th>Station</th><th>Position</th><th>Candidates</th></tr>`);
    
    contests.forEach((c: any) => {
      printWindow.document.write(`<tr><td>${c.electoralArea}</td><td>${c.station}</td><td>${c.position}</td><td>${c.count}</td></tr>`);
    });
    
    printWindow.document.write(`</table><h2>Full Report</h2>`);
    
    Object.entries(report).forEach(([area, stations]: any) => {
      printWindow.document.write(`<div class="area-header">${area}</div>`);
      Object.entries(stations).forEach(([station, positions]: any) => {
        printWindow.document.write(`<div class="station-header"><strong>${station}</strong></div>`);
        Object.entries(positions).forEach(([position, candidates]: any) => {
          const isContest = candidates.length > 1;
          printWindow.document.write(`<div class="position-block ${isContest ? 'contest' : 'unopposed'}">
            <span class="badge">${isContest ? 'CONTEST' : 'UNOPPOSED'}</span>
            <strong>${position}</strong> (${candidates.length} applicant${candidates.length > 1 ? 's' : ''})
            ${candidates.map((c: any) => `<div class="candidate">${c.surname} ${c.firstname} - ${c.delegateType} - ${c.status}</div>`).join('')}
          </div>`);
        });
      });
    });
    
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  const getAreaStats = (areaName: string) => {
    const areaRecords = records.filter(r => r.electoralArea === areaName);
    return {
      total: areaRecords.length,
      issued: areaRecords.filter(r => r.status === "ISSUED").length,
      returned: areaRecords.filter(r => r.status === "RETURNED").length,
      verified: areaRecords.filter(r => r.verified).length,
      rejected: areaRecords.filter(r => r.status === "REJECTED").length,
      contests: Object.values(areaRecords.reduce((acc, r) => {
        const key = `${r.station}|${r.position}`;
        if (!acc[key]) acc[key] = 0;
        acc[key]++;
        return acc;
      }, {} as Record<string, number>)).filter(c => c > 1).length
    };
  };

  const getStationPositions = (areaName: string, stationName: string) => {
    const stationRecords = records.filter(r => r.electoralArea === areaName && r.station === stationName);
    const positions: Record<string, any> = {};
    stationRecords.forEach(r => {
      if (!positions[r.position]) {
        positions[r.position] = {
          name: r.position,
          applicants: [],
          oldDelegates: 0,
          newDelegates: 0,
          count: 0
        };
      }
      positions[r.position].applicants.push(r);
      positions[r.position].count++;
      if (r.delegateType === "Old Delegate") positions[r.position].oldDelegates++;
      else positions[r.position].newDelegates++;
    });
    return Object.values(positions);
  };

  const toggleArea = (area: string) => {
    setExpandedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const toggleStation = (station: string) => {
    setExpandedStations(prev => prev.includes(station) ? prev.filter(s => s !== station) : [...prev, station]);
  };

  const getUniqueAreas = () => [...new Set(records.map(r => r.electoralArea))].sort();
  const getUniqueStations = (area?: string) => [...new Set(records.filter(r => !area || r.electoralArea === area).map(r => r.station))].sort();

  const contests = Object.values(records.reduce((acc, r) => {
    const key = `${r.electoralArea}|${r.station}|${r.position}`;
    if (!acc[key]) acc[key] = { electoralArea: r.electoralArea, station: r.station, stationCode: r.stationCode, position: r.position, count: 0, candidates: [] };
    acc[key].count += 1;
    acc[key].candidates.push(`${r.surname} ${r.firstname}`);
    return acc;
  }, {} as Record<string, any>)).filter(c => c.count > 1);

  const overallStats = {
    total: records.length,
    contests: contests.length,
    unopposed: Object.values(records.reduce((acc, r) => {
      const key = `${r.electoralArea}|${r.station}|${r.position}`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>)).filter(c => c === 1).length,
    returnRate: records.length > 0 ? Math.round((records.filter(r => r.status === "RETURNED").length / records.length) * 100) : 0,
    verifiedRate: records.filter(r => r.status === "RETURNED").length > 0 ? Math.round((records.filter(r => r.verified).length / records.filter(r => r.status === "RETURNED").length) * 100) : 0,
    oldDelegates: records.filter(r => r.delegateType === "Old Delegate").length,
    newDelegates: records.filter(r => r.delegateType === "New Delegate").length
  };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><p>Checking access...</p></div>;
  if (!isAuthorized) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-red-800 py-8 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white/95 rounded-3xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
        <p className="text-slate-600 mb-6">You do not have permission to access the admin dashboard.</p>
        <Link href="/" className="inline-block bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800">Back to Issuance</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold">Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">{sidebarOpen ? "◀" : "▶"}</button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveNav(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === item.id ? "bg-blue-600" : "hover:bg-slate-800"}`}>
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <span className="text-xl">🏠</span>
            {sidebarOpen && <span>Back to Home</span>}
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {message && (
            <div className={`mb-4 p-4 rounded-xl ${message.includes("❌") || message.includes("Please") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} border`}>
              {message}
              <button onClick={() => setMessage("")} className="ml-4 font-bold">×</button>
            </div>
          )}

          {activeNav === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-slate-600">Overview of delegate form management</p>
                </div>
                <div className="text-sm text-slate-500">Last updated: {new Date().toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.issued}</div>
                  <div className="text-blue-100 mt-1">Total Issued</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.returned}</div>
                  <div className="text-amber-100 mt-1">Returned</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.verified}</div>
                  <div className="text-green-100 mt-1">Verified</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.rejected}</div>
                  <div className="text-red-100 mt-1">Rejected</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-4xl font-bold">{stats.contests}</div>
                  <div className="text-purple-100 mt-1">Contests</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Election Contests</h2>
                {contests.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-lg font-medium">No contests detected</p>
                    <p className="text-sm">All positions have single candidates</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-slate-600 font-semibold">Electoral Area</th>
                          <th className="text-left py-3 px-4 text-slate-600 font-semibold">Polling Station</th>
                          <th className="text-left py-3 px-4 text-slate-600 font-semibold">Position</th>
                          <th className="text-center py-3 px-4 text-slate-600 font-semibold">Applicants</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contests.map((contest: any, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-red-50">
                            <td className="py-3 px-4 font-medium text-slate-900">{contest.electoralArea}</td>
                            <td className="py-3 px-4 text-slate-700">{contest.station}</td>
                            <td className="py-3 px-4 text-slate-700">{contest.position}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">{contest.count}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">By Electoral Area</h2>
                  <div className="space-y-3">
                    {Object.entries(records.reduce((acc, r) => { acc[r.electoralArea] = (acc[r.electoralArea] || 0) + 1; return acc; }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a).slice(0, 5).map(([area, count]) => (
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
                    {Object.entries(records.reduce((acc, r) => { acc[r.position] = (acc[r.position] || 0) + 1; return acc; }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a).map(([pos, count]) => (
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

          {activeNav === "issue" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-slate-900">Issue Form</h1>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Surname *</label>
                    <input value={issueForm.surname || ""} onChange={(e) => setIssueForm({...issueForm, surname: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter surname" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <input value={issueForm.firstname || ""} onChange={(e) => setIssueForm({...issueForm, firstname: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter first name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                    <input value={issueForm.middlename || ""} onChange={(e) => setIssueForm({...issueForm, middlename: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number * (10 digits)</label>
                    <input type="tel" value={issueForm.phone || ""} onChange={(e) => setIssueForm({...issueForm, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 0244123456" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                    <input type="number" value={issueForm.age || ""} onChange={(e) => setIssueForm({...issueForm, age: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Age" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Electoral Area *</label>
                    <select value={issueForm.electoralArea || ""} onChange={(e) => handleAreaChange(e.target.value, setIssueForm, issueForm)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="">Select Electoral Area</option>
                      {electoralAreas.map((area, i) => <option key={i} value={area.name}>{area.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Polling Station *</label>
                    <select value={issueForm.stationCode || ""} onChange={(e) => handleStationChange(e.target.value, setIssueForm, issueForm, issueStations)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" disabled={issueStations.length === 0}>
                      <option value="">Select Polling Station</option>
                      {issueStations.map((s, i) => <option key={i} value={s.code}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                    <select value={issueForm.position || ""} onChange={(e) => setIssueForm({...issueForm, position: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="">Select Position</option>
                      {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Delegate Type *</label>
                    <select value={issueForm.delegateType || ""} onChange={(e) => setIssueForm({...issueForm, delegateType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="">Select Delegate Type</option>
                      {DELEGATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleIssueSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">Issue Form</button>
              </div>
            </div>
          )}

          {activeNav === "return" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-slate-900">Vetting & Verification Center</h1>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  <button onClick={() => setReturnSearchMode("phone")} className={`px-4 py-2 rounded-lg font-medium ${returnSearchMode === "phone" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>🔍 By Phone</button>
                  <button onClick={() => setReturnSearchMode("station")} className={`px-4 py-2 rounded-lg font-medium ${returnSearchMode === "station" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>🏢 By Station</button>
                  <button onClick={() => setReturnSearchMode("area")} className={`px-4 py-2 rounded-lg font-medium ${returnSearchMode === "area" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>🗺️ By Area</button>
                </div>

                {returnSearchMode === "phone" && (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <input type="tel" value={returnSearchPhone} onChange={(e) => setReturnSearchPhone(e.target.value)} placeholder="Enter 10-digit phone number" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button onClick={() => handleSearchReturn(returnSearchPhone)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">Search</button>
                    </div>
                    {foundRecord && <SingleVettingCard record={foundRecord} onVerify={handleVerifyReturn} onReject={handleRejectWithReason} verificationResult={verificationResult} returnedForm={returnedForm} setReturnedForm={setReturnedForm} rejectionReason={rejectionReason} setRejectionReason={setRejectionReason} allRecords={records} />}
                  </div>
                )}

                {returnSearchMode === "station" && (
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <select value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); const area = electoralAreas.find(a => a.name === e.target.value); setStationStations(area ? area.pollingStations : []); setSelectedStation(""); }} className="flex-1 min-w-[200px] px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                        <option value="">Select Electoral Area</option>
                        {electoralAreas.map((a, i) => <option key={i} value={a.name}>{a.name}</option>)}
                      </select>
                      <select value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2.5 border border-slate-300 rounded-lg bg-white" disabled={!selectedArea}>
                        <option value="">Select Polling Station</option>
                        {stationStations.map((s, i) => <option key={i} value={s.name}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                     <BulkVettingTable records={records.filter(r => (r.status === "ISSUED" || r.status === "RETURNED-MISMATCH") && (!selectedArea || r.electoralArea === selectedArea) && (!selectedStation || r.station === selectedStation))} persistRecords={persistRecords} />
                  </div>
                )}

                {returnSearchMode === "area" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Electoral Area</label>
                      <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                        <option value="">All Electoral Areas</option>
                        {electoralAreas.map((a, i) => <option key={i} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                    <AreaVettingView records={records} area={selectedArea} />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Vetting Dashboard</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-slate-700">{records.filter(r => r.status === "ISSUED").length}</div>
                    <div className="text-sm text-slate-600">Pending</div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-700">{records.filter(r => r.status === "RETURNED").length}</div>
                    <div className="text-sm text-green-600">Verified</div>
                  </div>
                  <div className="bg-red-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-red-700">{records.filter(r => r.status === "REJECTED").length}</div>
                    <div className="text-sm text-red-600">Rejected</div>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-700">{records.length}</div>
                    <div className="text-sm text-amber-600">Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === "reports" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-900">Final Election Report</h1>
                <div className="flex flex-wrap gap-2">
                  <button onClick={exportReportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">Export CSV</button>
                  <button onClick={exportReportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium">Export Excel</button>
                  <button onClick={printReport} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium">Print PDF</button>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setReportView("summary")} className={`px-4 py-2 rounded-lg font-medium ${reportView === "summary" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border"}`}>Summary View</button>
                <button onClick={() => setReportView("contests")} className={`px-4 py-2 rounded-lg font-medium ${reportView === "contests" ? "bg-red-600 text-white" : "bg-white text-slate-700 border"}`}>Contests Only</button>
                <button onClick={() => setReportView("detailed")} className={`px-4 py-2 rounded-lg font-medium ${reportView === "detailed" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border"}`}>Detailed View</button>
              </div>

              <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border">
                <select value={reportFilterArea} onChange={(e) => { setReportFilterArea(e.target.value); setReportFilterStation(""); }} className="px-4 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">All Electoral Areas</option>
                  {electoralAreas.map((a, i) => <option key={i} value={a.name}>{a.name}</option>)}
                </select>
                <select value={reportFilterStation} onChange={(e) => setReportFilterStation(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg bg-white" disabled={!reportFilterArea}>
                  <option value="">All Polling Stations</option>
                  {getUniqueStations(reportFilterArea || undefined).map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
                <select value={reportFilterPosition} onChange={(e) => setReportFilterPosition(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">All Positions</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={reportFilterDelegateType} onChange={(e) => setReportFilterDelegateType(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">All Delegate Types</option>
                  {DELEGATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={reportFilterStatus} onChange={(e) => setReportFilterStatus(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">All Status</option>
                  <option value="ISSUED">Issued</option>
                  <option value="RETURNED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button onClick={() => { setReportFilterArea(""); setReportFilterStation(""); setReportFilterPosition(""); setReportFilterDelegateType(""); setReportFilterStatus(""); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg">Clear Filters</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
                  <div className="text-3xl font-bold">{overallStats.total}</div>
                  <div className="text-sm opacity-90">Total Delegates</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-xl text-white">
                  <div className="text-3xl font-bold">{overallStats.returnRate}%</div>
                  <div className="text-sm opacity-90">Return Rate</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl text-white">
                  <div className="text-3xl font-bold">{overallStats.verifiedRate}%</div>
                  <div className="text-sm opacity-90">Verification Rate</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-rose-500 p-4 rounded-xl text-white">
                  <div className="text-3xl font-bold">{overallStats.contests}</div>
                  <div className="text-sm opacity-90">Contests</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-violet-500 p-4 rounded-xl text-white">
                  <div className="text-3xl font-bold">{overallStats.unopposed}</div>
                  <div className="text-sm opacity-90">Unopposed</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-teal-500 p-4 rounded-xl text-white">
                  <div className="text-3xl font-bold">{overallStats.oldDelegates}</div>
                  <div className="text-sm opacity-90">Old Delegates</div>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-xl text-white">
                  <div className="text-3xl font-bold">{overallStats.newDelegates}</div>
                  <div className="text-sm opacity-90">New Delegates</div>
                </div>
              </div>

              {reportView === "summary" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Electoral Area Summary</h2>
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="text-left py-3 px-4">Electoral Area</th>
                          <th className="text-center py-3 px-2">Issued</th>
                          <th className="text-center py-3 px-2">Returned</th>
                          <th className="text-center py-3 px-2">Verified</th>
                          <th className="text-center py-3 px-2">Rejected</th>
                          <th className="text-center py-3 px-2">Contests</th>
                          <th className="text-center py-3 px-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getUniqueAreas().filter(area => !reportFilterArea || area === reportFilterArea).map((area) => {
                          const areaStats = getAreaStats(area);
                          return (
                            <tr key={area} className="border-b border-slate-200 hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium">{area}</td>
                              <td className="text-center py-3 px-2">{areaStats.issued}</td>
                              <td className="text-center py-3 px-2">{areaStats.returned}</td>
                              <td className="text-center py-3 px-2 text-green-600 font-medium">{areaStats.verified}</td>
                              <td className="text-center py-3 px-2 text-red-600 font-medium">{areaStats.rejected}</td>
                              <td className="text-center py-3 px-2">
                                {areaStats.contests > 0 ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-bold">{areaStats.contests}</span> : <span className="text-slate-400">0</span>}
                              </td>
                              <td className="text-center py-3 px-2 font-bold">{areaStats.total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportView === "contests" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Election Contests</h2>
                  {contests.filter(c => !reportFilterArea || c.electoralArea === reportFilterArea).length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                      <div className="text-5xl mb-4">✅</div>
                      <h3 className="text-xl font-bold text-slate-700">No Contests Found</h3>
                      <p className="text-slate-500">All positions have single candidates</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-red-700 text-white">
                          <tr>
                            <th className="text-left py-3 px-4">Electoral Area</th>
                            <th className="text-left py-3 px-4">Polling Station</th>
                            <th className="text-left py-3 px-4">Position</th>
                            <th className="text-center py-3 px-2">Candidates</th>
                            <th className="text-left py-3 px-4">Applicant Names</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contests.filter(c => !reportFilterArea || c.electoralArea === reportFilterArea).map((contest: any, i) => (
                            <tr key={i} className="border-b border-red-100 bg-red-50 hover:bg-red-100">
                              <td className="py-3 px-4 font-medium">{contest.electoralArea}</td>
                              <td className="py-3 px-4">{contest.station}</td>
                              <td className="py-3 px-4 font-semibold">{contest.position}</td>
                              <td className="text-center py-3 px-2"><span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold">{contest.count}</span></td>
                              <td className="py-3 px-4 text-slate-700">{contest.candidates.join(", ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {reportView === "detailed" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Detailed Breakdown</h2>
                  {getUniqueAreas().filter(area => !reportFilterArea || area === reportFilterArea).map((area) => {
                    const stations = getUniqueStations(area).filter(s => !reportFilterStation || s === reportFilterStation);
                    return (
                      <div key={area} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <button onClick={() => toggleArea(area)} className="w-full bg-slate-800 text-white p-4 flex items-center justify-between hover:bg-slate-700">
                          <span className="font-bold text-lg">{area}</span>
                          <span>{expandedAreas.includes(area) ? "▼" : "▶"}</span>
                        </button>
                        {expandedAreas.includes(area) && (
                          <div className="p-4 space-y-3">
                            {stations.map((station) => {
                              const positions = getStationPositions(area, station);
                              return (
                                <div key={station} className="border border-slate-200 rounded-lg overflow-hidden">
                                  <button onClick={() => toggleStation(station)} className="w-full bg-blue-50 text-slate-800 p-3 flex items-center justify-between hover:bg-blue-100">
                                    <span className="font-semibold">{station}</span>
                                    <span>{expandedStations.includes(station) ? "▼" : "▶"}</span>
                                  </button>
                                  {expandedStations.includes(station) && (
                                    <div className="p-3 space-y-2">
                                      {positions.map((pos: any) => {
                                        const isContest = pos.count > 1;
                                        return (
                                          <div key={pos.name} className={`p-3 rounded-lg ${isContest ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-semibold">{pos.name}</span>
                                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${isContest ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
                                                {isContest ? "CONTEST" : "UNOPPOSED"} ({pos.count})
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                              <div>Old Delegates: <span className="font-medium">{pos.oldDelegates}</span></div>
                                              <div>New Delegates: <span className="font-medium">{pos.newDelegates}</span></div>
                                            </div>
                                            <div className="space-y-1">
                                              {pos.applicants.map((app: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded border">
                                                  <span>{idx + 1}. {app.surname} {app.firstname}</span>
                                                  <span className={`px-2 py-0.5 rounded text-xs ${app.status === "RETURNED" ? "bg-green-100 text-green-700" : app.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-slate-200"}`}>{app.status}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">All Records</h2>
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
                        <th className="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{record.surname} {record.firstname}</td>
                          <td className="py-3 px-4">{record.phone}</td>
                          <td className="py-3 px-4">{record.electoralArea}</td>
                          <td className="py-3 px-4">{record.station}</td>
                          <td className="py-3 px-4">{record.position}</td>
                          <td className="py-3 px-4">{record.delegateType}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === "RETURNED" ? "bg-green-100 text-green-700" : record.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-700"}`}>{record.status}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => handleEditRecord(record)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecords.length === 0 && <div className="text-center py-8 text-slate-500">No records found</div>}
                </div>
              </div>

              {editingRecord && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Record</h2>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <input value={editForm.surname || ""} onChange={(e) => setEditForm({...editForm, surname: e.target.value})} className="px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Surname" />
                    <input value={editForm.firstname || ""} onChange={(e) => setEditForm({...editForm, firstname: e.target.value})} className="px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="First Name" />
                    <input value={editForm.middlename || ""} onChange={(e) => setEditForm({...editForm, middlename: e.target.value})} className="px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Middle Name" />
                    <input value={editForm.phone || ""} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Phone" />
                    <input type="number" value={editForm.age || ""} onChange={(e) => setEditForm({...editForm, age: e.target.value})} className="px-4 py-2.5 border border-slate-300 rounded-lg" placeholder="Age" />
                    <select value={editForm.electoralArea || ""} onChange={(e) => handleAreaChange(e.target.value, setEditForm, editForm)} className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                      <option value="">Select Area</option>
                      {electoralAreas.map((a, i) => <option key={i} value={a.name}>{a.name}</option>)}
                    </select>
                    <select value={editForm.stationCode || ""} onChange={(e) => handleStationChange(e.target.value, setEditForm, editForm, editStations)} className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white" disabled={editStations.length === 0}>
                      <option value="">Select Station</option>
                      {editStations.map((s, i) => <option key={i} value={s.code}>{s.name}</option>)}
                    </select>
                    <select value={editForm.position || ""} onChange={(e) => setEditForm({...editForm, position: e.target.value})} className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                      <option value="">Select Position</option>
                      {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={editForm.delegateType || ""} onChange={(e) => setEditForm({...editForm, delegateType: e.target.value})} className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                      <option value="">Select Type</option>
                      {DELEGATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium">Save Changes</button>
                    <button onClick={() => { setEditingRecord(null); setEditForm({}); }} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-medium">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
