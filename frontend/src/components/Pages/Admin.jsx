import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalResumes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const [usersRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (usersRes.status === 403 || statsRes.status === 403) {
          setError("You don't have admin access.");
          setLoading(false);
          return;
        }

        setUsers(await usersRes.json());
        setStats(await statsRes.json());
      } catch (err) {
        setError("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  return (
    <div className="flex justify-center w-full px-4 pb-8">
      <div className="max-w-5xl w-full">
        <div className="mb-6 ruled">
          <BackButton fallbackRoute="/db" />
          <h1 className="text-3xl font-display font-bold mt-2">Admin panel</h1>
          <p className="muted mt-1">Read-only view of all users and their resume activity.</p>
        </div>

        {error && (
          <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {!error && (
          <>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="card p-5">
                <p className="muted text-xs uppercase tracking-wider">Total users</p>
                <p className="text-3xl font-display font-bold mt-2">{loading ? "—" : stats.totalUsers}</p>
              </div>
              <div className="card p-5">
                <p className="muted text-xs uppercase tracking-wider">Total resumes</p>
                <p className="text-3xl font-display font-bold mt-2">{loading ? "—" : stats.totalResumes}</p>
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Username</th>
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-left p-3 font-semibold">Resumes</th>
                    <th className="text-left p-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-3 muted" colSpan={5}>Loading…</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td className="p-3 muted" colSpan={5}>No users found.</td></tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <td className="p-3">{u.name || "—"}</td>
                        <td className="p-3">{u.username}</td>
                        <td className="p-3">
                          <span className={`stamp ${u.role === "admin" ? "stamp-teal" : ""}`}>{u.role}</span>
                        </td>
                        <td className="p-3">{u.resumeCount}</td>
                        <td className="p-3 muted text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;