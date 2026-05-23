import { useEffect, useState } from "react";
import api from "../api";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const EMPTY = { name: "", email: "", phone: "", company: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load(q = "") {
    const r = await api.get("/customers/", { params: q ? { search: q } : {} });
    setCustomers(r.data);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm(EMPTY);
    setModal("add");
    setError("");
  }
  function openEdit(c) {
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
    });
    setModal(c.id);
    setError("");
  }
  function close() {
    setModal(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (modal === "add") {
        await api.post("/customers/", form);
      } else {
        await api.put(`/customers/${modal}/`, form);
      }
      await load(search);
      close();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}/`);
      await load(search);
    } catch {
      alert("Cannot delete — customer has existing sales");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Customer
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search name, email, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              load("");
            }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No customers found
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {c.name}
                </td>
                <td className="px-4 py-3 text-gray-500">{c.company || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal
          title={modal === "add" ? "Add Customer" : "Edit Customer"}
          onClose={close}
        >
          <form onSubmit={handleSave} className="space-y-4">
            {[
              ["name", "Name", true],
              ["company", "Company", false],
              ["email", "Email", false],
              ["phone", "Phone", false],
            ].map(([field, label, req]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form[field]}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  required={req}
                />
              </div>
            ))}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
