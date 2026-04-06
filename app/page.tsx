"use client";
import { useState, useEffect } from "react";

type Client = {
  id: string;
  name: string;
  assignedStaffCode: string;
  status: "new" | "in-review" | "approved" | "rejected";
  documents: { name: string; dataUrl: string }[];
  requests: { text: string; date: string; status: "pending" | "answered" }[];
  archived: boolean;
};

type Staff = {
  code: string;
  name: string;
  createdAt: string;
};

type Activity = {
  id: string;
  staffCode: string;
  staffName: string;
  clientName: string;
  action: string;
  details: string;
  timestamp: string;
};

export default function Home() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ role: "admin" | "staff"; code?: string; name?: string } | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "activity" | "settings">("dashboard");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  
  const [newStaffName, setNewStaffName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [assignCode, setAssignCode] = useState("");
  
  const [uploadFile, setUploadFile] = useState<{ [clientId: string]: File | null }>({});
  const [requestText, setRequestText] = useState<{ [clientId: string]: string }>({});
  const [aiResult, setAiResult] = useState<{ [clientId: string]: string }>({});
  const [answerText, setAnswerText] = useState<{ [requestId: string]: string }>({});

  // Load data from localStorage
  useEffect(() => {
    let storedStaff = JSON.parse(localStorage.getItem("staffList") || "[]");
    if (storedStaff.length === 0) {
      storedStaff = [];
      localStorage.setItem("staffList", JSON.stringify(storedStaff));
    }
    setStaffList(storedStaff);

    let storedClients = JSON.parse(localStorage.getItem("clients") || "[]");
    if (storedClients.length === 0) {
      storedClients = [];
      localStorage.setItem("clients", JSON.stringify(storedClients));
    }
    setClients(storedClients);

    let storedActivities = JSON.parse(localStorage.getItem("activities") || "[]");
    setActivities(storedActivities);

    const session = localStorage.getItem("session");
    if (session) setUser(JSON.parse(session));
  }, []);

  const saveSession = (data: any) => {
    localStorage.setItem("session", JSON.stringify(data));
    setUser(data);
  };

  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem("clients", JSON.stringify(newClients));
  };

  const saveStaffList = (newStaff: Staff[]) => {
    setStaffList(newStaff);
    localStorage.setItem("staffList", JSON.stringify(newStaff));
  };

  const addActivity = (staffCode: string, staffName: string, clientName: string, action: string, details: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      staffCode,
      staffName,
      clientName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    const updated = [newActivity, ...activities];
    setActivities(updated);
    localStorage.setItem("activities", JSON.stringify(updated));
  };

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pin === "7586373") {
      saveSession({ role: "admin" });
      return;
    }
    const staff = staffList.find(s => s.code === pin);
    if (staff) {
      saveSession({ role: "staff", code: staff.code, name: staff.name });
    } else {
      setError("Invalid PIN or staff code");
    }
  };

  const logout = () => {
    localStorage.removeItem("session");
    setUser(null);
    setPin("");
    setActiveTab("dashboard");
  };

  const addStaff = () => {
    if (!newStaffName.trim()) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newStaff: Staff = { code: newCode, name: newStaffName, createdAt: new Date().toISOString() };
    saveStaffList([...staffList, newStaff]);
    setNewStaffName("");
    setGeneratedCode(newCode);
    alert(`Staff created: ${newCode} (${newStaffName})`);
  };

  const deleteStaff = (code: string) => {
    if (confirm(`Delete staff ${code}?`)) {
      const updated = staffList.filter(s => s.code !== code);
      saveStaffList(updated);
    }
  };

  const regenerateStaffCode = (oldCode: string, currentName: string) => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const updatedStaff = staffList.map(s => s.code === oldCode ? { ...s, code: newCode } : s);
    saveStaffList(updatedStaff);
    const updatedClients = clients.map(c => c.assignedStaffCode === oldCode ? { ...c, assignedStaffCode: newCode } : c);
    saveClients(updatedClients);
    alert(`Staff code changed from ${oldCode} to ${newCode}`);
  };

  const updateStaffName = (code: string, newName: string) => {
    const updated = staffList.map(s => s.code === code ? { ...s, name: newName } : s);
    saveStaffList(updated);
  };

  const adminAddClient = () => {
    if (!newClientName.trim()) return;
    if (!assignCode.trim()) { alert("Enter staff code"); return; }
    const staffExists = staffList.some(s => s.code === assignCode);
    if (!staffExists) { alert("Staff code not found"); return; }
    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientName,
      assignedStaffCode: assignCode,
      status: "new",
      documents: [],
      requests: [],
      archived: false,
    };
    saveClients([...clients, newClient]);
    setNewClientName("");
    setAssignCode("");
    alert("Client created and assigned.");
  };

  const adminDeleteClient = (clientId: string, clientName: string) => {
    if (confirm(`Permanently delete client "${clientName}"? This cannot be undone.`)) {
      const updated = clients.filter(c => c.id !== clientId);
      saveClients(updated as any);
      addActivity("admin", "Admin", clientName, "Deleted client", `Permanently deleted client "${clientName}"`);
      alert("Client deleted.");
    }
  };

  const adminArchiveClient = (clientId: string, archive: boolean) => {
    const updated = clients.map(c => c.id === clientId ? { ...c, archived: archive } : c);
    saveClients(updated as any);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const staff = staffList.find(s => s.code === client.assignedStaffCode);
      addActivity(staff?.code || "admin", staff?.name || "Admin", client.name, archive ? "Archived client" : "Unarchived client", `Client ${archive ? "archived" : "unarchived"} by admin`);
    }
  };

  const answerRequest = (clientId: string, requestIndex: number, answer: string) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const newRequests = [...c.requests];
        newRequests[requestIndex] = { ...newRequests[requestIndex], status: "answered" };
        return { ...c, requests: newRequests };
      }
      return c;
    });
    saveClients(updated as any);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const staff = staffList.find(s => s.code === client.assignedStaffCode);
      addActivity(staff?.code || "admin", staff?.name || "Admin", client.name, "Answered request", answer);
    }
    alert("Request marked as answered");
  };

  const staffAddClient = () => {
    if (!newClientName.trim()) return;
    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientName,
      assignedStaffCode: user?.code || "",
      status: "new",
      documents: [],
      requests: [],
      archived: false,
    };
    saveClients([...clients, newClient]);
    setNewClientName("");
    addActivity(user?.code || "unknown", user?.name || "unknown", newClientName, "Created client", `Created client "${newClientName}"`);
  };

  const staffArchiveClient = (clientId: string, archive: boolean) => {
    const updated = clients.map(c => c.id === clientId ? { ...c, archived: archive } : c);
    saveClients(updated as any);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      addActivity(user?.code || "unknown", user?.name || "unknown", client.name, archive ? "Archived client" : "Unarchived client", `Client ${archive ? "archived" : "unarchived"}`);
    }
  };

  const uploadDocument = (clientId: string) => {
    const file = uploadFile[clientId];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = clients.map(c => c.id === clientId ? {
        ...c,
        documents: [...c.documents, { name: file.name, dataUrl: reader.result as string }]
      } : c);
      saveClients(updated as any);
      setUploadFile(prev => ({ ...prev, [clientId]: null }));
      const client = clients.find(c => c.id === clientId);
      if (client) {
        addActivity(user?.code || "unknown", user?.name || "unknown", client.name, "Uploaded document", `Uploaded "${file.name}"`);
      }
      alert("Document uploaded");
    };
    reader.readAsDataURL(file);
  };

  const submitRequest = (clientId: string) => {
    const text = requestText[clientId];
    if (!text?.trim()) return;
    const updated = clients.map(c => c.id === clientId ? {
      ...c,
      requests: [...c.requests, { text, date: new Date().toISOString(), status: "pending" }]
    } : c);
    saveClients(updated as any);
    setRequestText(prev => ({ ...prev, [clientId]: "" }));
    const client = clients.find(c => c.id === clientId);
    if (client) {
      addActivity(user?.code || "unknown", user?.name || "unknown", client.name, "Sent request", text);
    }
    alert("Request sent to admin");
  };

  const runSimpleAI = (clientId: string, clientName: string) => {
    const random = Math.random();
    let result = "";
    if (random > 0.7) result = `âœ… High approval chance (${Math.round(random*100)}%) â€“ strong case.`;
    else if (random > 0.4) result = `âš ï¸ Medium chance (${Math.round(random*100)}%) â€“ need more documents.`;
    else result = `âŒ Low chance (${Math.round(random*100)}%) â€“ consider legal advice.`;
    setAiResult(prev => ({ ...prev, [clientId]: result }));
    addActivity(user?.code || "unknown", user?.name || "unknown", clientName, "AI analysis", result);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 p-8 rounded-lg w-96">
          <h1 className="text-2xl font-bold text-green-500 mb-6">TopNotch Consultancy</h1>
          <form onSubmit={login}>
            <input type="password" placeholder="Enter PIN or Staff Code" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full p-2 mb-4 bg-gray-800 text-white rounded" required />
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    const activeClients = clients.filter(c => !c.archived);
    const archivedClients = clients.filter(c => c.archived);
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-500">Admin Dashboard</h1>
          <button onClick={logout} className="bg-red-600 px-4 py-2 rounded">Logout</button>
        </div>
        <div className="flex gap-4 border-b border-gray-700 mb-6">
          <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 ${activeTab === "dashboard" ? "text-green-500 border-b-2 border-green-500" : "text-gray-400"}`}>Clients</button>
          <button onClick={() => setActiveTab("activity")} className={`px-4 py-2 ${activeTab === "activity" ? "text-green-500 border-b-2 border-green-500" : "text-gray-400"}`}>Activity Log</button>
          <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 ${activeTab === "settings" ? "text-green-500 border-b-2 border-green-500" : "text-gray-400"}`}>Settings</button>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-gray-900 p-4 rounded border border-green-500">
              <h2 className="text-xl text-green-400 mb-4">Active Clients ({activeClients.length})</h2>
              {activeClients.length === 0 && <p>No active clients.</p>}
              {activeClients.map(c => (
                <div key={c.id} className="border border-gray-700 mb-3 rounded overflow-hidden">
                  <div className="flex justify-between items-center p-3 bg-gray-800 cursor-pointer" onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}>
                    <div><strong>{c.name}</strong> â€“ Staff: {c.assignedStaffCode} â€“ Status: {c.status}</div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); adminArchiveClient(c.id, true); }} className="bg-yellow-600 px-2 py-1 rounded text-sm">Archive</button>
                      <button onClick={(e) => { e.stopPropagation(); adminDeleteClient(c.id, c.name); }} className="bg-red-700 px-2 py-1 rounded text-sm">Delete</button>
                    </div>
                  </div>
                  {expandedClient === c.id && (
                    <div className="p-3 bg-gray-900 space-y-3">
                      <div>
                        <p className="text-green-400 font-semibold">Documents:</p>
                        {c.documents.length === 0 && <p className="text-xs text-gray-500">None</p>}
                        {c.documents.map((doc, idx) => (<a key={idx} href={doc.dataUrl} download={doc.name} className="text-xs text-blue-400 block">ðŸ“„ {doc.name}</a>))}
                      </div>
                      <div>
                        <p className="text-green-400 font-semibold">Requests from Staff:</p>
                        {c.requests.length === 0 && <p className="text-xs text-gray-500">None</p>}
                        {c.requests.map((req, idx) => (
                          <div key={idx} className="border border-gray-700 p-2 rounded mt-1">
                            <p className="text-xs">{req.text}</p>
                            <p className="text-xs text-gray-500">Date: {new Date(req.date).toLocaleString()}</p>
                            <p className="text-xs">Status: <span className={req.status === "pending" ? "text-yellow-400" : "text-green-400"}>{req.status}</span></p>
                            {req.status === "pending" && (
                              <div className="mt-2 flex gap-2">
                                <input type="text" placeholder="Your answer..." value={answerText[`${c.id}-${idx}`] || ""} onChange={(e) => setAnswerText(prev => ({ ...prev, [`${c.id}-${idx}`]: e.target.value }))} className="flex-1 p-1 text-xs bg-gray-800 rounded" />
                                <button onClick={() => answerRequest(c.id, idx, answerText[`${c.id}-${idx}`] || "")} className="bg-blue-600 px-2 py-1 rounded text-xs">Answer</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {archivedClients.length > 0 && (
              <div className="bg-gray-900 p-4 rounded border border-gray-600">
                <h2 className="text-xl text-gray-400 mb-4">Archived Clients ({archivedClients.length})</h2>
                {archivedClients.map(c => (
                  <div key={c.id} className="border border-gray-700 p-2 rounded flex justify-between items-center mb-2">
                    <div><strong>{c.name}</strong> â€“ Staff: {c.assignedStaffCode}</div>
                    <div className="flex gap-2">
                      <button onClick={() => adminArchiveClient(c.id, false)} className="bg-yellow-600 px-2 py-1 rounded text-sm">Unarchive</button>
                      <button onClick={() => adminDeleteClient(c.id, c.name)} className="bg-red-700 px-2 py-1 rounded text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-gray-900 p-4 rounded border border-green-500">
            <h2 className="text-xl text-green-400 mb-4">Staff Activity Log</h2>
            {activities.length === 0 && <p>No activity yet.</p>}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activities.map(a => (
                <div key={a.id} className="border-b border-gray-700 pb-2">
                  <p className="text-sm"><span className="text-green-400">{a.staffName}</span> ({a.staffCode}) â€“ <span className="text-yellow-400">{a.action}</span> on client <strong>{a.clientName}</strong></p>
                  <p className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{a.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-gray-900 p-4 rounded border border-green-500">
              <h2 className="text-xl text-green-400 mb-4">Staff Management</h2>
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Staff Name" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" />
                <button onClick={addStaff} className="bg-green-600 px-4 py-2 rounded">Add Staff</button>
              </div>
              {generatedCode && <p className="mb-2">Last generated: <strong>{generatedCode}</strong></p>}
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-700"><th className="text-left p-2">Code</th><th className="text-left p-2">Name</th><th className="text-left p-2">Created</th><th className="text-left p-2">Actions</th></tr></thead>
                <tbody>
                  {staffList.map(s => (
                    <tr key={s.code} className="border-b border-gray-800">
                      <td className="p-2">{s.code}</td>
                      <td className="p-2"><input type="text" value={s.name} onChange={(e) => updateStaffName(s.code, e.target.value)} className="bg-gray-800 p-1 rounded" /></td>
                      <td className="p-2">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="p-2"><button onClick={() => regenerateStaffCode(s.code, s.name)} className="bg-yellow-600 px-2 py-1 rounded text-xs mr-1">Regenerate</button><button onClick={() => deleteStaff(s.code)} className="bg-red-600 px-2 py-1 rounded text-xs">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-900 p-4 rounded border border-green-500">
              <h2 className="text-xl text-green-400 mb-4">Create Client & Assign to Staff</h2>
              <input type="text" placeholder="Client Name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" />
              <input type="text" placeholder="Staff Code" value={assignCode} onChange={(e) => setAssignCode(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" />
              <button onClick={adminAddClient} className="bg-blue-600 px-4 py-2 rounded">Add Client</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Staff Dashboard (unchanged)
  const myClients = clients.filter(c => c.assignedStaffCode === user.code && !c.archived);
  const myArchived = clients.filter(c => c.assignedStaffCode === user.code && c.archived);
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-500">Staff Dashboard</h1>
        <button onClick={logout} className="bg-red-600 px-4 py-2 rounded">Logout</button>
      </div>
      <div className="bg-gray-900 p-4 rounded border border-green-500 mb-4">
        <p>Staff: <strong>{user.name || user.code}</strong> (Code: {user.code})</p>
      </div>
      <div className="bg-gray-900 p-4 rounded border border-green-500 mb-4">
        <h2 className="text-xl text-green-400 mb-2">Create New Client</h2>
        <input type="text" placeholder="Client Name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full p-2 mb-2 bg-gray-800 rounded" />
        <button onClick={staffAddClient} className="bg-blue-600 px-4 py-2 rounded">Add Client</button>
      </div>
      <div className="bg-gray-900 p-4 rounded border border-green-500 mb-4">
        <h2 className="text-xl text-green-400 mb-2">Your Active Clients</h2>
        {myClients.length === 0 && <p className="text-gray-400">No clients yet. Create one above.</p>}
        {myClients.map(c => (
          <div key={c.id} className="border border-gray-700 p-3 rounded mb-3">
            <div className="flex justify-between"><h3 className="text-lg font-semibold">{c.name}</h3><span className="text-sm">Status: {c.status}</span></div>
            <div className="mt-2">
              <p className="text-sm text-green-400">Documents:</p>
              {c.documents.length === 0 && <p className="text-xs text-gray-500">None</p>}
              {c.documents.map((doc, idx) => (<a key={idx} href={doc.dataUrl} download={doc.name} className="text-xs text-blue-400 block">ðŸ“„ {doc.name}</a>))}
              <input type="file" onChange={(e) => setUploadFile(prev => ({ ...prev, [c.id]: e.target.files?.[0] || null }))} className="mt-1 text-xs" />
              <button onClick={() => uploadDocument(c.id)} disabled={!uploadFile[c.id]} className="bg-blue-600 px-2 py-1 rounded text-xs mt-1">Upload</button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-green-400">Requests to Admin:</p>
              {c.requests.map((r, idx) => (<div key={idx} className="text-xs border-l-2 border-gray-600 pl-2 mt-1"><p>{r.text}</p><p className="text-gray-500">Status: {r.status}</p></div>))}
              <textarea placeholder="Ask admin a question..." value={requestText[c.id] || ""} onChange={(e) => setRequestText(prev => ({ ...prev, [c.id]: e.target.value }))} className="w-full p-1 text-xs bg-gray-800 rounded mt-1" rows={2} />
              <button onClick={() => submitRequest(c.id)} disabled={!requestText[c.id]?.trim()} className="bg-purple-600 px-2 py-1 rounded text-xs mt-1">Send Request</button>
            </div>
            <div className="mt-2">
              <button onClick={() => runSimpleAI(c.id, c.name)} className="bg-green-600 px-2 py-1 rounded text-xs">Run AI Analysis</button>
              {aiResult[c.id] && <p className="text-xs mt-1">{aiResult[c.id]}</p>}
            </div>
            <button onClick={() => staffArchiveClient(c.id, true)} className="text-red-400 text-xs mt-2">Archive Client</button>
          </div>
        ))}
      </div>
      {myArchived.length > 0 && (
        <div className="bg-gray-900 p-4 rounded border border-gray-600">
          <h2 className="text-xl text-gray-400 mb-2">Archived Clients</h2>
          {myArchived.map(c => (
            <div key={c.id} className="border border-gray-700 p-2 rounded mb-2">
              <p><strong>{c.name}</strong> â€“ Status: {c.status}</p>
              <button onClick={() => staffArchiveClient(c.id, false)} className="text-yellow-400 text-xs">Unarchive</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




