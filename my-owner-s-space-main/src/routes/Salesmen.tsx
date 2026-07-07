import { useEffect, useState } from "react";
import {
  listSalesmen, createSalesman, updateSalesman, deleteSalesman,
} from "../lib/salesmenApi";

export default function Salesmen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true); setErr("");
    try { setRows(await listSalesmen()); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setErr("");
    try {
      await createSalesman(form);
      setForm({ name: "", email: "", phone: "", password: "" });
      await load();
    } catch (e) { setErr(e.message); }
    finally { setCreating(false); }
  };

  const toggleStatus = async (s) => {
    await updateSalesman(s._id, { status: s.status === "active" ? "disabled" : "active" });
    load();
  };

  const resetPassword = async (s) => {
    const password = prompt(`New password for ${s.name}?`);
    if (!password) return;
    await updateSalesman(s._id, { password });
    alert("Password updated");
  };

  const remove = async (s) => {
    if (!confirm(`Delete salesman ${s.name}?`)) return;
    await deleteSalesman(s._id);
    load();
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1>Salesmen</h1>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(4, 1fr)", margin: "16px 0" }}>
        <input required placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={creating} style={{ gridColumn: "span 4" }}>
          {creating ? "Adding…" : "Add salesman"}
        </button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {loading ? <p>Loading…</p> : (
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
              <th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.phone || "—"}</td>
                <td>{s.status}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => toggleStatus(s)}>
                    {s.status === "active" ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => resetPassword(s)}>Reset password</button>
                  <button onClick={() => remove(s)} style={{ color: "crimson" }}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}>No salesmen yet.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
