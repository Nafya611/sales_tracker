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

const EMPTY = { name: "", description: "", default_price: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await api.get("/products/");
    setProducts(r.data);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm(EMPTY);
    setModal("add");
    setError("");
  }
  function openEdit(p) {
    setForm({
      name: p.name,
      description: p.description,
      default_price: p.default_price,
    });
    setModal(p.id);
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
        await api.post("/products/", form);
      } else {
        await api.put(`/products/${modal}/`, form);
      }
      await load();
      close();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}/`);
      await load();
    } catch {
      alert("Cannot delete — product is used in sales");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Products</h2>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-transparent md:bg-white md:rounded-xl md:shadow w-full">
        <table className="w-full text-sm block md:table">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Default Price</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group md:divide-y md:divide-gray-100 space-y-4 md:space-y-0">
            {products.length === 0 && (
              <tr className="block md:table-row bg-white rounded-xl shadow-sm md:shadow-none md:rounded-none md:bg-transparent">
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 block md:table-cell rounded-xl md:rounded-none">
                  No products yet
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="block md:table-row bg-white rounded-xl shadow-sm border border-gray-200 md:border-none md:shadow-none md:rounded-none md:bg-transparent overflow-hidden pb-0 hover:bg-gray-50">
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none font-medium text-gray-800 bg-gray-50 md:bg-transparent">
                  <span className="md:hidden font-semibold text-gray-600">Name</span>
                  {p.name}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none text-gray-500">
                  <span className="md:hidden font-semibold text-gray-600">Description</span>
                  {p.description || "—"}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none font-mono md:text-right">
                  <span className="md:hidden font-semibold text-gray-600">Price</span>
                  ETB {p.default_price}
                </td>
                <td className="px-4 py-3 flex justify-end gap-3 md:table-cell md:text-right">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
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
          title={modal === "add" ? "Add Product" : "Edit Product"}
          onClose={close}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.default_price}
                onChange={(e) =>
                  setForm({ ...form, default_price: e.target.value })
                }
                required
              />
            </div>
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
