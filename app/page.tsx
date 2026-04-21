"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { electoralAreas } from "../data/electoralData";

type Account = {
  id?: string;
  username: string;
  password: string;
  role: string;
};

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6xQ3q41bzRYMgNyvqCbCvzmosNM4Fc1COcUVvxy5VTRsJ4qpN_d0BNtF430Ki3DnT/exec";

const DEFAULT_ACCOUNTS: Account[] = [
  { username: "admin", password: "delegate123", role: "admin" },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  
  const [form, setForm] = useState<Record<string, any>>({});
  const [stations, setStations] = useState<{ name: string; code: string }[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("issue");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterElectoralArea, setFilterElectoralArea] = useState("");
  const [filterPollingStation, setFilterPollingStation] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterDelegateType, setFilterDelegateType] = useState("");
  const [filterStations, setFilterStations] = useState<{ name: string; code: string }[]>([]);
  const recordsPerPage = 20;

  // Return form verification state
  const [returnSearchPhone, setReturnSearchPhone] = useState("");
  const [foundRecord, setFoundRecord] = useState<any>(null);
  const [returnedForm, setReturnedForm] = useState<Record<string, any>>({});
  const [verificationMessage, setVerificationMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(SCRIPT_URL + "?action=GET_ALL");
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const mapped = data.map((r: any, i: number) => ({ ...r, id: i + 1 }));
          setRecords(mapped as any);
          localStorage.setItem("delegateRecords", JSON.stringify(mapped));
          return;
        }
      } catch (e) {
        console.log("Failed to fetch remote records, using local storage");
      }

      // Fallback to localStorage
      const saved = localStorage.getItem("delegateRecords");
      if (saved) {
        try {
          setRecords(JSON.parse(saved) as any);
        } catch {
          setRecords([]);
        }
      }
    };
    
    fetchRecords();

    const savedAccounts = localStorage.getItem("delegateAccounts");
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts) as Account[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
        }
      } catch {
        setAccounts(DEFAULT_ACCOUNTS);
        localStorage.setItem("delegateAccounts", JSON.stringify(DEFAULT_ACCOUNTS));
      }
    } else {
      localStorage.setItem("delegateAccounts", JSON.stringify(DEFAULT_ACCOUNTS));
    }

    const loggedIn = localStorage.getItem("isLoggedIn");
    const savedUser = localStorage.getItem("currentUser");
    if (loggedIn === "true" && savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser) as Account);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin" && activeTab !== "issue") {
      setActiveTab("issue");
    }
  }, [currentUser, activeTab]);

  type RecordItem = {
  id?: number;
  [key: string]: any;
};

const saveRecords = (newRecords: RecordItem[]) => {
  setRecords(newRecords);
  localStorage.setItem("delegateRecords", JSON.stringify(newRecords));
};

  const handleLogin = () => {
    const matchingAccount = accounts.find(
      (account) => account.username === loginForm.username && account.password === loginForm.password
    );

    if (matchingAccount) {
      setIsLoggedIn(true);
      setCurrentUser(matchingAccount);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify(matchingAccount));
      setLoginError("");
      return;
    }

    setLoginError("Invalid username or password");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    setActiveTab("issue");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleAreaChange = (e: any) => {
    const selected = electoralAreas.find((a) => a.name === e.target.value);
    setStations(selected ? selected.pollingStations : []);
    setForm({ ...form, electoralArea: e.target.value, station: "", stationCode: "" });
  };

  const handleStationChange = (e: any) => {
    const selectedStation = stations.find(s => s.code === e.target.value);
    setForm({ ...form, station: selectedStation?.name || "", stationCode: e.target.value });
  };

  const handleFilterAreaChange = (e: any) => {
    const selected = electoralAreas.find((a) => a.name === e.target.value);
    setFilterElectoralArea(e.target.value);
    setFilterStations(selected ? selected.pollingStations : []);
    setFilterPollingStation("");
  };

  const positions = ["CHAIRMAN", "SECRETARY", "ORGANIZER", "WOMEN ORGANIZER", "YOUTH ORGANIZER", "COMMUNICATION OFFICER", "ELECTORAL AFFAIRS OFFICER"];
  const delegateTypes = ["Old Delegate", "New Delegate"];

  const getFilteredRecordsByArea = () => {
    return records.filter((r) => {
      if (filterElectoralArea && r.electoralArea !== filterElectoralArea) return false;
      if (filterPollingStation && r.station !== filterPollingStation) return false;
      if (filterPosition && r.position !== filterPosition) return false;
      if (filterDelegateType && r.delegateType !== filterDelegateType) return false;
      return true;
    });
  };

  const recordsFilteredByAnalytics = getFilteredRecordsByArea();
  const analyticsCount = recordsFilteredByAnalytics.length;

  const handleExportToCSV = () => {
    const dataToExport = recordsFilteredByAnalytics.length > 0 ? recordsFilteredByAnalytics : filteredRecords;
    
    if (dataToExport.length === 0) {
      alert("No records to export");
      return;
    }

    const headers = ["ID", "Surname", "First Name", "Middle Name", "Phone", "Age", "Electoral Area", "Polling Station", "Station Code", "Position", "Delegate Type", "Status", "Issued Date", "Returned Date"];
    const rows = dataToExport.map((record) => [
      record.id,
      record.surname || "",
      record.firstname || "",
      record.middlename || "",
      record.phone || "",
      record.age || "",
      record.electoralArea || "",
      record.station || "",
      record.stationCode || "",
      record.position || "",
      record.delegateType || "",
      record.status || "",
      record.issuedDate ? new Date(record.issuedDate).toLocaleDateString() : "",
      record.returnedDate ? new Date(record.returnedDate).toLocaleDateString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `delegate-records-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!form.surname || !form.firstname || !form.electoralArea || !form.station || !form.position || !form.delegateType || !form.phone || form.phone.length !== 10 || !/^\d{10}$/.test(form.phone)) {
      alert("Please fill in all required fields. Phone number must be exactly 10 digits.");
      return;
    }

    // Check for duplicate phone number
    const existingRecord = records.find(r => r.phone === form.phone);
    if (existingRecord) {
      alert(`A delegate with phone number ${form.phone} already exists!\n\nExisting record:\n${existingRecord.surname} ${existingRecord.firstname}\nPosition: ${existingRecord.position}\nStatus: ${existingRecord.status}\n\nPlease verify if this is a different person or update the existing record.`);
      return;
    }

    const newRecord = {
      id: Date.now(),
      ...form,
      status: "ISSUED",
      issuedDate: new Date().toISOString(),
      returnedDate: null,
    };

    let savedRemotely = false;
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          surname: form.surname,
          firstname: form.firstname,
          middlename: form.middlename || "",
          phone: form.phone || "",
          age: form.age || "",
          electoralArea: form.electoralArea,
          station: form.station,
          stationCode: form.stationCode || "",
          position: form.position,
          delegateType: form.delegateType,
          status: "ISSUED",
          action: "ISSUE"
        }),
      });
      savedRemotely = true;
    } catch (e) {
      console.log("Offline mode - saving locally");
    }

    saveRecords([newRecord, ...records]);
    setForm({});
    setStations([]);
    alert(savedRemotely ? "Form issued successfully!" : "Form saved locally (offline mode)!");
  };

  const handleReturn = async (id: any) => {
    const record = records.find(r => r.id === id);
    let savedRemotely = false;
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ phone: record.phone, action: "RETURN" }),
      });
      savedRemotely = true;
    } catch (e) {
      console.log("Offline mode - return saved locally");
    }

    const updated = records.map(r => 
      r.id === id ? { ...r, status: "RETURNED", returnedDate: new Date().toISOString() } : r
    );
    saveRecords(updated);
    alert(savedRemotely ? "Form returned successfully!" : "Form return saved locally (offline mode)!");
  };

  const handleSearchReturnForm = (phone: string) => {
    const found = records.find(r => r.phone === phone && r.status === "ISSUED");
    if (found) {
      setFoundRecord(found);
      setReturnedForm({});
      setVerificationMessage("");
      setRejectionReason("");
    } else {
      setFoundRecord(null);
      setVerificationMessage("No issued form found for this phone number.");
    }
  };

  const handleAcceptReturn = async () => {
    if (!foundRecord || !returnedForm.positionFilled) {
      alert("Please fill in all required fields.");
      return;
    }

    const positionMatches = foundRecord.position === returnedForm.positionFilled;
    const newStatus = positionMatches ? "RETURNED" : "RETURNED-MISMATCH";
    
    let savedRemotely = false;
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ 
          phone: foundRecord.phone, 
          action: "VERIFY_RETURN",
          status: newStatus,
          positionFilled: returnedForm.positionFilled,
          comments: returnedForm.comments || ""
        }),
      });
      savedRemotely = true;
    } catch (e) {
      console.log("Offline mode - verification saved locally");
    }

    const updated = records.map(r => 
      r.id === foundRecord.id 
        ? { 
            ...r, 
            status: newStatus, 
            returnedDate: new Date().toISOString(),
            positionFilled: returnedForm.positionFilled,
            comments: returnedForm.comments || ""
          } 
        : r
    );
    saveRecords(updated);
    
    const message = positionMatches 
      ? "✅ Form accepted and verified! Positions match."
      : "⚠️ Form accepted with position mismatch flagged for admin review.";
    
    alert(message);
    setFoundRecord(null);
    setReturnSearchPhone("");
    setReturnedForm({});
    setVerificationMessage("");
  };

  const handleRejectReturn = async () => {
    if (!foundRecord || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    let savedRemotely = false;
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ 
          phone: foundRecord.phone, 
          action: "REJECT_RETURN",
          status: "REJECTED",
          rejectionReason: rejectionReason,
          positionFilled: returnedForm.positionFilled || ""
        }),
      });
      savedRemotely = true;
    } catch (e) {
      console.log("Offline mode - rejection saved locally");
    }

    const updated = records.map(r => 
      r.id === foundRecord.id 
        ? { 
            ...r, 
            status: "REJECTED", 
            returnedDate: new Date().toISOString(),
            positionFilled: returnedForm.positionFilled || "",
            rejectionReason: rejectionReason
          } 
        : r
    );
    saveRecords(updated);
    
    alert("Form rejected. Reason: " + rejectionReason);
    setFoundRecord(null);
    setReturnSearchPhone("");
    setReturnedForm({});
    setRejectionReason("");
    setVerificationMessage("");
  };

  const filteredRecords = records.filter(r => 
    r.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.electoralArea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.delegateType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    issued: records.filter(r => r.status === "ISSUED").length,
    returned: records.filter(r => r.status === "RETURNED").length,
    verified: records.filter(r => r.status === "RETURNED" && r.verified).length,
    rejected: records.filter(r => r.status === "REJECTED").length,
    total: records.length,
    contests: Object.values(records.reduce<Record<string, { count: number }>>((acc, r) => {
      const key = `${r.electoralArea}|${r.station}|${r.position}`;
      if (!acc[key]) acc[key] = { count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})).filter((c): c is { count: number } => c.count > 1).length
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-red-800 py-8 px-4 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-blue-900 px-6 py-5 rounded-t-xl -mx-8 -mt-8 mb-6">
            <h1 className="text-xl font-bold text-white text-center">NEW JUABEN SOUTH</h1>
            <p className="text-red-100 text-sm text-center">Constituency Form Issuance</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input type="text" value={loginForm.username} placeholder="Enter username"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none text-slate-900"
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" value={loginForm.password} placeholder="Enter password"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none text-slate-900"
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            </div>
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            <button className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg"
              onClick={handleLogin}>Login</button>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-red-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-blue-900 px-6 py-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">NEW JUABEN SOUTH</h1>
              <p className="text-red-100 text-sm">Constituency Form Issuance System</p>
            </div>
            <div className="flex gap-3">
              {currentUser?.role === "admin" && (
                <Link href="/admin" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm">Logout</button>
            </div>
          </div>
          
          <div className="flex border-b border-slate-200">
            <button onClick={() => setActiveTab("issue")} className={`px-6 py-3 font-medium ${activeTab === "issue" ? "border-b-2 border-red-800 text-red-800" : "text-slate-500"}`}>Issue Form</button>
            {currentUser?.role === "admin" && (
              <>
                <button onClick={() => setActiveTab("return")} className={`px-6 py-3 font-medium ${activeTab === "return" ? "border-b-2 border-red-800 text-red-800" : "text-slate-500"}`}>Return Form</button>
                <button onClick={() => setActiveTab("records")} className={`px-6 py-3 font-medium ${activeTab === "records" ? "border-b-2 border-red-800 text-red-800" : "text-slate-500"}`}>Records</button>
              </>
            )}
          </div>

          {activeTab === "issue" && (
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Surname *</label>
                  <input value={form.surname || ""} placeholder="Enter surname"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                    onChange={(e) => setForm({ ...form, surname: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
                  <input value={form.firstname || ""} placeholder="Enter first name"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                    onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Middle Name</label>
                  <input value={form.middlename || ""} placeholder="Optional"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                    onChange={(e) => setForm({ ...form, middlename: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
                  <input type="tel" value={form.phone || ""} placeholder="Mobile number (10 digits, must be unique)"
                    required
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
                  <input value={form.age || ""} placeholder="Your age" type="number"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                    onChange={(e) => setForm({ ...form, age: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Electoral Area *</label>
                  <select value={form.electoralArea || ""}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white"
                    onChange={handleAreaChange}>
                    <option value="">Select Electoral Area</option>
                    {electoralAreas.map((area, index) => (
                      <option key={index} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Polling Station *</label>
                  <select value={form.stationCode || ""}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white"
                    onChange={handleStationChange} disabled={stations.length === 0}>
                    <option value="">Select Polling Station</option>
                    {stations.map((s, i) => (
                      <option key={i} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Position *</label>
                <select value={form.position || ""}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white"
                  onChange={(e) => setForm({ ...form, position: e.target.value })}>
                  <option value="">Select Position</option>
                  {positions.map((pos, i) => (
                    <option key={i}>{pos}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Delegate Type *</label>
                <select value={form.delegateType || ""}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white"
                  onChange={(e) => setForm({ ...form, delegateType: e.target.value })}>
                  <option value="">Select Delegate Type</option>
                  {delegateTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg"
              >
                Issue Form
              </button>
            </div>
          )}

          {activeTab === "return" && (
            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-3">Search by Phone Number</h3>
                <div className="flex gap-3">
                  <input 
                    type="tel" 
                    placeholder="Enter 10-digit phone number" 
                    value={returnSearchPhone}
                    onChange={(e) => setReturnSearchPhone(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none" 
                  />
                  <button 
                    onClick={() => handleSearchReturnForm(returnSearchPhone)}
                    className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium"
                  >
                    Search
                  </button>
                </div>
              </div>

              {foundRecord && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h3 className="font-bold text-lg mb-3">Original Application</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><span className="text-slate-500 text-sm block">Name:</span><span className="font-medium">{foundRecord.surname} {foundRecord.firstname}</span></div>
                      <div><span className="text-slate-500 text-sm block">Phone:</span><span className="font-medium">{foundRecord.phone}</span></div>
                      <div><span className="text-slate-500 text-sm block">Position:</span><span className="font-medium">{foundRecord.position}</span></div>
                      <div><span className="text-slate-500 text-sm block">Status:</span><span className="px-2 py-1 bg-slate-200 rounded text-sm font-medium">{foundRecord.status}</span></div>
                      <div><span className="text-slate-500 text-sm block">Electoral Area:</span><span className="font-medium">{foundRecord.electoralArea}</span></div>
                      <div><span className="text-slate-500 text-sm block">Station:</span><span className="font-medium">{foundRecord.station}</span></div>
                      <div><span className="text-slate-500 text-sm block">Delegate Type:</span><span className="font-medium">{foundRecord.delegateType}</span></div>
                      <div><span className="text-slate-500 text-sm block">Issued:</span><span className="font-medium">{foundRecord.issuedDate ? new Date(foundRecord.issuedDate).toLocaleDateString() : "-"}</span></div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h3 className="font-bold text-lg mb-3">Verify Returned Form</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Position Filled (returned)</label>
                      <select 
                        value={returnedForm.positionFilled || ""} 
                        onChange={(e) => setReturnedForm({...returnedForm, positionFilled: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white"
                      >
                        <option value="">Select Position</option>
                        {positions.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Comments</label>
                      <textarea 
                        value={returnedForm.comments || ""} 
                        onChange={(e) => setReturnedForm({...returnedForm, comments: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none" 
                        rows={2}
                        placeholder="Optional comments..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleAcceptReturn} className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors">✓ Accept & Verify</button>
                      <button onClick={handleRejectReturn} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors">✗ Reject</button>
                    </div>
                    {rejectionReason && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rejection Reason *</label>
                        <textarea 
                          value={rejectionReason} 
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none" 
                          rows={2}
                          placeholder="Enter reason for rejection..."
                        />
                      </div>
                    )}
                  </div>

                  {verificationMessage && (
                    <div className={`p-4 rounded-xl text-center ${verificationMessage.includes("✅") ? "bg-green-100 border border-green-300" : "bg-red-100 border border-red-300"}`}>
                      <p className={`font-semibold ${verificationMessage.includes("✅") ? "text-green-700" : "text-red-700"}`}>{verificationMessage}</p>
                    </div>
                  )}

                  <button 
                    onClick={() => { setFoundRecord(null); setReturnSearchPhone(""); setReturnedForm({}); setVerificationMessage(""); setRejectionReason(""); }}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {!foundRecord && verificationMessage && (
                <div className="p-4 bg-slate-100 rounded-xl text-center text-slate-600">
                  <p>{verificationMessage}</p>
                </div>
              )}

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-700 mb-3">All Issued Forms</h3>
                <input placeholder="Search..." value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg mb-4" />
                <div className="space-y-3">
                  {filteredRecords.filter(r => r.status === "ISSUED").length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No issued forms to return</p>
                  ) : (
                    <>
                      {filteredRecords.filter(r => r.status === "ISSUED").slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map((record) => (
                        <div key={record.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{record.surname} {record.firstname}</h3>
                              <p className="text-sm text-slate-500">{record.position} • {record.delegateType}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs bg-slate-200">ISSUED</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{record.electoralArea} - {record.station} ({record.stationCode})</p>
                          <button onClick={() => { setReturnSearchPhone(record.phone); handleSearchReturnForm(record.phone); }} className="w-full bg-blue-900 text-white py-2 rounded-lg">Verify Return</button>
                        </div>
                      ))}
                      {filteredRecords.filter(r => r.status === "ISSUED").length > recordsPerPage && (
                        <div className="flex justify-between pt-4">
                          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-slate-200 rounded-lg">Previous</button>
                          <span className="text-sm py-2">Page {currentPage}</span>
                          <button disabled={currentPage >= Math.ceil(filteredRecords.filter(r => r.status === "ISSUED").length / recordsPerPage)} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-slate-200 rounded-lg">Next</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "records" && (
            <div className="p-6">
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 bg-blue-50 p-4 text-center rounded-lg border border-blue-200 min-w-[120px]">
                  <div className="text-2xl font-bold text-blue-900">{stats.issued}</div>
                  <div className="text-sm text-blue-700">Issued</div>
                </div>
                <div className="flex-1 bg-amber-50 p-4 text-center rounded-lg border border-amber-200 min-w-[120px]">
                  <div className="text-2xl font-bold text-amber-700">{stats.returned}</div>
                  <div className="text-sm text-amber-700">Returned</div>
                </div>
                <div className="flex-1 bg-green-50 p-4 text-center rounded-lg border border-green-200 min-w-[120px]">
                  <div className="text-2xl font-bold text-green-700">{stats.verified}</div>
                  <div className="text-sm text-green-700">Verified</div>
                </div>
                <div className="flex-1 bg-red-50 p-4 text-center rounded-lg border border-red-200 min-w-[120px]">
                  <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                  <div className="text-sm text-red-700">Rejected</div>
                </div>
                <div className="flex-1 bg-purple-50 p-4 text-center rounded-lg border border-purple-200 min-w-[120px]">
                  <div className="text-2xl font-bold text-purple-700">{stats.contests}</div>
                  <div className="text-sm text-purple-700">Contests</div>
                </div>
                <div className="flex-1 bg-slate-100 p-4 text-center rounded-lg min-w-[120px]">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm">Total</div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-3">Filter by Criteria</h3>
                <div className="grid gap-3 md:grid-cols-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Electoral Area</label>
                    <select value={filterElectoralArea} onChange={handleFilterAreaChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white text-sm">
                      <option value="">All Areas</option>
                      {electoralAreas.map((area, index) => (
                        <option key={index} value={area.name}>{area.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Polling Station</label>
                    <select value={filterPollingStation} onChange={(e) => setFilterPollingStation(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white text-sm"
                      disabled={filterStations.length === 0}>
                      <option value="">All Stations</option>
                      {filterStations.map((s, i) => (
                        <option key={i} value={s.name}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Position</label>
                    <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white text-sm">
                      <option value="">All Positions</option>
                      {positions.map((pos, i) => (
                        <option key={i} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Delegate Type</label>
                    <select value={filterDelegateType} onChange={(e) => setFilterDelegateType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 outline-none bg-white text-sm">
                      <option value="">All Types</option>
                      {delegateTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(filterElectoralArea || filterPollingStation || filterPosition || filterDelegateType) && (
                  <div className="text-sm font-semibold text-blue-900">
                    Total individuals with selected criteria: <span className="text-lg text-blue-700">{analyticsCount}</span>
                  </div>
                )}
                {currentUser?.role === "admin" && (
                  <button onClick={handleExportToCSV} className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm">
                    Download as CSV
                  </button>
                )}
              </div>

              <input placeholder="Search..." value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg mb-4" />

              <div className="space-y-3">
                {filteredRecords.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No records found</p>
                ) : (
                  <>
                    {filteredRecords.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map((record) => (
                      <div key={record.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{record.surname} {record.firstname}</h3>
                            <p className="text-sm text-slate-500">{record.position} • {record.delegateType}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs ${record.status === "ISSUED" ? "bg-slate-200" : "bg-red-100"}`}>{record.status}</span>
                        </div>
                        <p className="text-sm text-slate-600">{record.electoralArea} - {record.station} ({record.stationCode})</p>
                        {record.status === "ISSUED" && (
                          <button onClick={() => handleReturn(record.id)} className="mt-3 w-full bg-red-700 text-white py-2 rounded-lg">Mark as Returned</button>
                        )}
                      </div>
                    ))}
                    {filteredRecords.length > recordsPerPage && (
                      <div className="flex justify-between pt-4">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-slate-200 rounded-lg">Previous</button>
                        <span className="text-sm py-2">Page {currentPage}</span>
                        <button disabled={currentPage >= Math.ceil(filteredRecords.length / recordsPerPage)} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-slate-200 rounded-lg">Next</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}