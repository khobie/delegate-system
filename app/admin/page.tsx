"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6xQ3q41bzRYMgNyvqCbCvzmosNM4Fc1COcUVvxy5VTRsJ4qpN_d0BNtF430Ki3DnT/exec";

type Account = {
  id: string;
  username: string;
  password: string;
  role: string;
};

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "admin", username: "admin", password: "delegate123", role: "admin" },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

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

  const persistAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    localStorage.setItem("delegateAccounts", JSON.stringify(newAccounts));
  };

  const handleAddAccount = () => {
    if (!username || !password) {
      setMessage("Username and password are required.");
      return;
    }

    if (accounts.some((account) => account.username === username)) {
      setMessage("That username is already assigned.");
      return;
    }

    const newAccount: Account = {
      id: `${username}-${Date.now()}`,
      username,
      password,
      role,
    };

    persistAccounts([...accounts, newAccount]);
    setUsername("");
    setPassword("");
    setRole("user");
    setMessage("Account assigned successfully.");
  };

  const handleRemoveAccount = (id: string) => {
    const updated = accounts.filter((account) => account.id !== id);
    persistAccounts(updated.length ? updated : DEFAULT_ACCOUNTS);
    setMessage("Account removed.");
  };

  const handleResetAccounts = () => {
    persistAccounts(DEFAULT_ACCOUNTS);
    setMessage("Accounts reset to admin only.");
  };

  const persistRecords = (newRecords: Record<string, any>[]) => {
    setRecords(newRecords);
    localStorage.setItem("delegateRecords", JSON.stringify(newRecords));
  };

  const filteredRecords = records.filter(r => 
    !searchTerm || 
    r.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.middlename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.electoralArea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.delegateType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    issued: records.filter(r => r.status === "ISSUED").length,
    returned: records.filter(r => r.status === "RETURNED").length,
    total: records.length,
    pending: records.filter(r => r.status === "ISSUED").length - records.filter(r => r.status === "RETURNED").length,
    returnRate: records.length > 0 ? Math.round((records.filter(r => r.status === "RETURNED").length / records.length) * 100) : 0,
    byArea: records.reduce((acc, r) => {
      acc[r.electoralArea] = (acc[r.electoralArea] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPosition: records.reduce((acc, r) => {
      acc[r.position] = (acc[r.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byDelegateType: records.reduce((acc, r) => {
      acc[r.delegateType] = (acc[r.delegateType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentActivity: records
      .sort((a, b) => new Date(b.issuedDate || 0).getTime() - new Date(a.issuedDate || 0).getTime())
      .slice(0, 5)
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="text-lg">Checking access...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-red-800 py-8 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-6">You do not have permission to access the admin dashboard.</p>
          <Link href="/" className="inline-block bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800">
            Back to Issuance
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleRecordSelection = (id: string) => {
    setSelectedRecordIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const handleClearSelectedRecords = () => {
    if (!selectedRecordIds.length) {
      setMessage("Select at least one record to clear.");
      return;
    }

    const remaining = records.filter((record) => !selectedRecordIds.includes(String(record.id)));
    persistRecords(remaining);
    setSelectedRecordIds([]);
    setMessage(`${selectedRecordIds.length} selected record(s) cleared.`);
  };

  const handleClearAllRecords = () => {
    persistRecords([]);
    setSelectedRecordIds([]);
    setMessage("All delegate records have been cleared.");
  };

  const handleEditRecord = (record: Record<string, any>) => {
    setEditingRecord(record);
    setEditForm({ ...record });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    // Check for duplicate phone number (excluding current record)
    const existingRecord = records.find(r => r.phone === editForm.phone && r.id !== editingRecord.id);
    if (existingRecord) {
      alert(`A delegate with phone number ${editForm.phone} already exists!\n\nExisting record:\n${existingRecord.surname} ${existingRecord.firstname}\nPosition: ${existingRecord.position}\nStatus: ${existingRecord.status}\n\nPlease use a different phone number.`);
      return;
    }

    const updatedRecords = records.map(r => 
      r.id === editingRecord.id ? { ...r, ...editForm } : r
    );
    
    // Try to update Google Sheets
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          ...editForm,
          action: "UPDATE"
        }),
      });
    } catch (e) {
      console.log("Offline mode - update saved locally");
    }

    persistRecords(updatedRecords);
    setEditingRecord(null);
    setEditForm({});
    setMessage("Record updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  const handleExportDashboardData = () => {
    const dashboardData = {
      summary: {
        totalIssued: stats.issued,
        totalReturned: stats.returned,
        pendingReturns: stats.pending,
        returnRate: `${stats.returnRate}%`,
        totalRecords: stats.total,
        activeAccounts: accounts.length
      },
      byArea: stats.byArea,
      byPosition: stats.byPosition,
      byDelegateType: stats.byDelegateType,
      recentActivity: stats.recentActivity.map(r => ({
        name: `${r.surname} ${r.firstname}`,
        position: r.position,
        delegateType: r.delegateType,
        status: r.status,
        issuedDate: r.issuedDate,
        returnedDate: r.returnedDate
      })),
      accounts: accounts.map(a => ({
        username: a.username,
        role: a.role
      })),
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-red-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-blue-900 px-6 py-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-red-100 text-sm">Assign accounts and clear application data</p>
            </div>
            <Link href="/" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm">
              Back to Issuance
            </Link>
          </div>

          <div className="p-6 space-y-6">
            {message && (
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-sm text-slate-700">
                {message}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-center rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.issued}</div>
                <div className="text-sm opacity-90">Forms Issued</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 text-center rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.returned}</div>
                <div className="text-sm opacity-90">Forms Returned</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-center rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.pending}</div>
                <div className="text-sm opacity-90">Pending Returns</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-center rounded-lg text-white">
                <div className="text-3xl font-bold">{stats.returnRate}%</div>
                <div className="text-sm opacity-90">Return Rate</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-slate-900">System Status</h3>
                <button
                  onClick={handleExportDashboardData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Export Dashboard Data
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{accounts.length}</div>
                  <div className="text-sm text-slate-600">Active Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{records.length}</div>
                  <div className="text-sm text-slate-600">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-sm text-slate-600">Last Updated</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Distribution by Electoral Area</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byArea).length === 0 ? (
                    <p className="text-sm text-slate-500">No data available</p>
                  ) : (
                    Object.entries(stats.byArea)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([area, count]) => (
                        <div key={area} className="flex justify-between items-center">
                          <span className="text-sm text-slate-700 truncate mr-2">{area}</span>
                          <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">{count}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Distribution by Position</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byPosition).length === 0 ? (
                    <p className="text-sm text-slate-500">No data available</p>
                  ) : (
                    Object.entries(stats.byPosition)
                      .sort(([,a], [,b]) => b - a)
                      .map(([position, count]) => (
                        <div key={position} className="flex justify-between items-center">
                          <span className="text-sm text-slate-700 truncate mr-2">{position}</span>
                          <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">{count}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">System Status</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{accounts.length}</div>
                  <div className="text-sm text-slate-600">Active Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{records.length}</div>
                  <div className="text-sm text-slate-600">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-sm text-slate-600">Last Updated</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800"
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-red-800"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddAccount}
                  className="w-full sm:w-auto bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 font-semibold"
                >
                  Assign Account
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Actions</h2>
                <button
                  onClick={handleClearSelectedRecords}
                  className="w-full mb-3 bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 rounded-lg font-medium"
                >
                  Clear Selected Records
                </button>
                <button
                  onClick={handleClearAllRecords}
                  className="w-full mb-3 bg-red-700 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium"
                >
                  Clear All Record Data
                </button>
                <button
                  onClick={handleResetAccounts}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium"
                >
                  Reset Accounts to Admin Only
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Assigned Accounts</h2>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{account.username}</p>
                      <p className="text-sm text-slate-500">Role: {account.role}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveAccount(account.id)}
                      className="self-start sm:self-auto bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Delegate Records</h2>
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              {editingRecord && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Edit Record</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
                      <input
                        value={editForm.surname || ""}
                        onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input
                        value={editForm.firstname || ""}
                        onChange={(e) => setEditForm({ ...editForm, firstname: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                      <input
                        value={editForm.middlename || ""}
                        onChange={(e) => setEditForm({ ...editForm, middlename: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editForm.phone || ""}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Phone number (must be unique)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={editForm.age || ""}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                      <select
                        value={editForm.position || ""}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="">Select Position</option>
                        {["CHAIRMAN", "SECRETARY", "ORGANIZER", "WOMEN ORGANIZER", "YOUTH ORGANIZER", "COMMUNICATION OFFICER", "ELECTORAL AFFAIRS OFFICER"].map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Delegate Type</label>
                      <select
                        value={editForm.delegateType || ""}
                        onChange={(e) => setEditForm({ ...editForm, delegateType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="">Select Type</option>
                        <option value="Old Delegate">Old Delegate</option>
                        <option value="New Delegate">New Delegate</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {filteredRecords.length === 0 ? (
                  <p className="text-sm text-slate-500">No delegate records found.</p>
                ) : (
                  filteredRecords.slice(0, 10).map((record) => (
                    <div key={record.id} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(String(record.id))}
                        onChange={() => handleToggleRecordSelection(String(record.id))}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{record.surname} {record.firstname} {record.middlename || ""}</p>
                        <p className="text-sm text-slate-500">
                          {record.electoralArea} • {record.station} • {record.position} • {record.delegateType}
                        </p>
                        <p className="text-xs text-slate-400">
                          Phone: {record.phone || "N/A"} • Age: {record.age || "N/A"} • Status: {record.status}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
              {filteredRecords.length > 10 && (
                <p className="mt-3 text-xs text-slate-500">Showing first 10 matching records.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
