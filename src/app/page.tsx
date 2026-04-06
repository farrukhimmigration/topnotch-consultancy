"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ role: "admin" | "staff" } | null>(null);

  useEffect(() => {
    const session = document.cookie.match(/session=([^;]+)/);
    if (session) setUser({ role: session[1] as "admin" | "staff" });
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "7586373") {
      document.cookie = "session=admin; path=/; max-age=86400";
      setUser({ role: "admin" });
    } else if (pin === "123456") {
      document.cookie = "session=staff; path=/; max-age=86400";
      setUser({ role: "staff" });
    } else {
      setError("Invalid PIN");
    }
  };

  const logout = () => {
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    setUser(null);
    setPin("");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 p-8 rounded-lg w-96">
          <h1 className="text-2xl font-bold text-green-500 mb-6">TopNotch Consultancy</h1>
          <form onSubmit={login}>
            <input type="password" placeholder="Enter PIN" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full p-2 mb-4 bg-gray-800 text-white rounded" required />
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-500">Admin Dashboard</h1>
          <button onClick={logout} className="bg-red-600 px-4 py-2 rounded">Logout</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 p-4 rounded border border-green-500">
            <h2 className="text-xl text-green-400">Generate Staff Code</h2>
            <button
              onClick={() => {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                alert(`New staff code: ${code}\nUse this code to login as staff.`);
              }}
              className="bg-green-600 px-4 py-2 rounded mt-2"
            >
              Generate
            </button>
          </div>
          <div className="bg-gray-900 p-4 rounded border border-green-500">
            <h2 className="text-xl text-green-400">Multi‑Brain AI</h2>
            <button onClick={() => alert("AI simulation started")} className="bg-green-600 px-4 py-2 rounded mt-2">Run</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-500">Staff Dashboard</h1>
        <button onClick={logout} className="bg-red-600 px-4 py-2 rounded">Logout</button>
      </div>
      <div className="bg-gray-900 p-4 rounded border border-green-500">
        <h2 className="text-xl text-green-400">Welcome, Staff</h2>
        <p className="mt-2">You have limited access. Contact admin for more features.</p>
      </div>
    </div>
  );
}