import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  async function load(status = "") {
    const r = await api.get("/sales/", { params: status ? { status } : {} });
    setSales(r.data);
  }

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this sale?")) return;
    await api.delete(`/sales/${id}/`);
    load(statusFilter);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
        <Link
          to="/sales/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Sale
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {["", "unpaid", "partial", "paid"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Car ID</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  No sales found
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {s.customer_name}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {s.car_id ? s.car_id : "—"}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {s.item_count}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-500">
                  ETB {s.subtotal}
                </td>
                <td className="px-4 py-3 text-right font-mono text-green-600">
                  {parseFloat(s.discount_total) > 0
                    ? `-ETB ${s.discount_total}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  ETB {s.total_amount}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">
                  ETB {s.balance_due}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : s.status === "partial"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(s.date_created).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    to={`/sales/${s.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id)}
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
    </div>
  );
}
