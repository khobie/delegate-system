"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Delegate Records</h2>
              <div className="space-y-3">
                {records.length === 0 ? (
                  <p className="text-sm text-slate-500">No delegate records found.</p>
                ) : (
                  records.slice(0, 8).map((record) => (
                    <label key={record.id} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(String(record.id))}
                        onChange={() => handleToggleRecordSelection(String(record.id))}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{record.surname || record.firstname || "Unnamed"}</p>
                        <p className="text-sm text-slate-500">{record.electoralArea || "No area"} • {record.station || "No station"}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {records.length > 8 && (
                <p className="mt-3 text-xs text-slate-500">Showing first 8 records for selection.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
