import { useEffect, useState } from "react";
import api from "../api";

export default function PaymentView() {
  const [sales, setSales] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const isSaturday = today.getDay() === 6;

  async function load() {
    const r = await api.get("/sales/", { params: { status: "unpaid" } });
    setSales(r.data);
    setSelected(new Set());
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === sales.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sales.map((s) => s.id)));
    }
  }

  async function markOnePaid(id) {
    setLoading(true);
    await api.post(`/sales/${id}/mark-paid/`);
    await load();
    setLoading(false);
  }

  async function markSelectedPaid() {
    if (selected.size === 0) return;
    if (!window.confirm(`Mark ${selected.size} sale(s) as paid?`)) return;
    setLoading(true);
    await api.post("/sales/mark-all-paid/", { ids: [...selected] });
    await load();
    setLoading(false);
  }

  const totalUnpaid = sales.reduce(
    (s, sale) => s + parseFloat(sale.total_amount),
    0,
  );
  const totalSelected = sales
    .filter((s) => selected.has(s.id))
    .reduce((s, sale) => s + parseFloat(sale.total_amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Payment Review</h2>
        <span className="text-sm text-gray-400">{today.toDateString()}</span>
      </div>

      {isSaturday ? (
        <div className="mb-5 bg-orange-50 border border-orange-300 text-orange-800 rounded-xl px-5 py-3 text-sm font-medium">
          💰 Payment Day — review all unpaid sales below and mark them as paid.
        </div>
      ) : (
        <div className="mb-5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-5 py-3 text-sm">
          Payments are processed every <strong>Saturday</strong>. You can still
          mark payments manually anytime.
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center gap-6 mb-4">
        <div className="bg-white rounded-xl shadow px-5 py-3">
          <p className="text-xs text-gray-500">Unpaid Sales</p>
          <p className="text-xl font-bold text-orange-600">{sales.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow px-5 py-3">
          <p className="text-xs text-gray-500">Total Outstanding</p>
          <p className="text-xl font-bold text-gray-800">
            ETB {totalUnpaid.toFixed(2)}
          </p>
        </div>
        {selected.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="text-xs text-blue-500">{selected.size} selected</p>
            <p className="text-xl font-bold text-blue-700">
              ETB {totalSelected.toFixed(2)}
            </p>
          </div>
        )}
        {selected.size > 0 && (
          <button
            onClick={markSelectedPaid}
            disabled={loading}
            className="ml-auto bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Mark {selected.size} as Paid
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={sales.length > 0 && selected.size === sales.length}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">Total Due</th>
              <th className="px-4 py-3 text-left">Sale Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  All payments are up to date!
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-gray-50 ${selected.has(s.id) ? "bg-blue-50" : ""}`}
              >
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {s.customer_name}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {s.item_count}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-mono">
                  {parseFloat(s.discount_total) > 0
                    ? `-ETB ${s.discount_total}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">
                  ETB {s.total_amount}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(s.date_created).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => markOnePaid(s.id)}
                    disabled={loading}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                  >
                    Mark Paid
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
