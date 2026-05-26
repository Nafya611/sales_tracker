import { useEffect, useState } from "react";
import api from "../api";

export default function PaymentView() {
  const [sales, setSales] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [partialAmounts, setPartialAmounts] = useState({});
  const [customerFilter, setCustomerFilter] = useState("");
  const today = new Date();
  const isSaturday = today.getDay() === 6;

  async function load() {
    const r = await api.get("/sales/", { params: { status: "unpaid,partial" } });
    setSales(r.data);
    setSelected(new Set());
    setPartialAmounts({});
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
    if (selected.size === filteredSales.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredSales.map((s) => s.id)));
    }
  }

  async function markOnePaid(id, isPartial = false) {
    setLoading(true);
    try {
      const payload = isPartial && partialAmounts[id] ? { amount: partialAmounts[id] } : {};
      await api.post(`/sales/${id}/mark-paid/`, payload);
      await load();
    } catch (e) {
      alert("Error saving payment");
    }
    setLoading(false);
  }

  function handleAmountChange(id, val) {
    setPartialAmounts((prev) => ({ ...prev, [id]: val }));
  }

  async function markSelectedPaid() {
    if (selected.size === 0) return;
    if (!window.confirm(`Mark ${selected.size} sale(s) as paid?`)) return;
    setLoading(true);
    await api.post("/sales/mark-all-paid/", { ids: [...selected] });
    await load();
    setLoading(false);
  }

  const uniqueCustomers = Array.from(
    new Map(sales.map(s => [s.customer, s.customer_name])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredSales = sales.filter((s) => 
    customerFilter ? String(s.customer) === customerFilter : true
  );

  const totalUnpaid = filteredSales.reduce(
    (s, sale) => s + parseFloat(sale.balance_due),
    0,
  );
  const totalSelected = filteredSales
    .filter((s) => selected.has(s.id))
    .reduce((s, sale) => s + parseFloat(sale.balance_due), 0);

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
      <div className="flex flex-wrap items-center gap-4 mb-4">
        
        {/* Customer Filter */}
        <div className="bg-white rounded-xl shadow px-5 py-3 w-full sm:w-auto">
          <p className="text-xs text-gray-500 mb-1">Filter by Customer</p>
          <select 
            className="w-full sm:w-48 border rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="">All Customers</option>
            {uniqueCustomers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow px-5 py-3 flex-1 min-w-[140px]">
          <p className="text-xs text-gray-500">Unpaid Sales</p>
          <p className="text-xl font-bold text-orange-600">{filteredSales.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow px-5 py-3 flex-1 min-w-[140px]">
          <p className="text-xs text-gray-500">Total Outstanding</p>
          <p className="text-xl font-bold text-gray-800">
            ETB {totalUnpaid.toFixed(2)}
          </p>
        </div>
        {selected.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex-1 min-w-[140px]">
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
            className="md:ml-auto w-full md:w-auto bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Mark {selected.size} as Paid
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow w-full">
        <table className="w-full text-sm block md:table">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={filteredSales.length > 0 && selected.size === filteredSales.length}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Sale Date</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Paid Amount</th>
              <th className="px-4 py-3 text-right">Balance Due</th>
              <th className="px-4 py-3 text-right">Payment Action</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group divide-y md:divide-gray-100">
            {filteredSales.length === 0 && (
              <tr className="block md:table-row">
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-gray-400 block md:table-cell"
                >
                  All payments are up to date!
                </td>
              </tr>
            )}
            {filteredSales.map((s) => (
              <tr
                key={s.id}
                className={`block md:table-row pb-4 md:pb-0 hover:bg-gray-50 ${selected.has(s.id) ? "bg-blue-50" : ""}`}
              >
                <td className="px-4 py-2 md:py-3 flex justify-between items-center md:table-cell border-b md:border-none md:text-center bg-gray-50 md:bg-transparent">
                  <span className="md:hidden font-semibold text-gray-600">Select</span>
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none text-gray-500">
                  <span className="md:hidden font-semibold text-gray-600">ID</span>
                  #{s.id}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none font-medium text-gray-800">
                  <span className="md:hidden font-semibold text-gray-600">Customer</span>
                  {s.customer_name}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none text-gray-500">
                  <span className="md:hidden font-semibold text-gray-600">Date</span>
                  {new Date(s.date_created).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none text-gray-500 md:text-center">
                  <span className="md:hidden font-semibold text-gray-600">Items</span>
                  {s.item_count}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none text-gray-500 font-mono md:text-right">
                  <span className="md:hidden font-semibold text-gray-600">Total</span>
                  ETB {s.total_amount}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none text-teal-600 font-mono md:text-right">
                  <span className="md:hidden font-semibold text-gray-600">Paid</span>
                  {parseFloat(s.paid_amount) > 0 ? `ETB ${s.paid_amount}` : "—"}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell border-b md:border-none font-mono font-bold text-orange-600 md:text-right">
                  <span className="md:hidden font-semibold text-gray-600">Balance</span>
                  ETB {s.balance_due}
                </td>
                <td className="px-4 py-3 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2 md:table-cell md:text-right">
                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
                    <input
                      type="number"
                      max={s.balance_due}
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      value={partialAmounts[s.id] || ""}
                      onChange={(e) => handleAmountChange(s.id, e.target.value)}
                      className="w-24 border rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => markOnePaid(s.id, true)}
                      disabled={loading || !partialAmounts[s.id] || parseFloat(partialAmounts[s.id]) <= 0}
                      className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-200 disabled:opacity-50"
                    >
                      Pay Amount
                    </button>
                    <button
                      onClick={() => markOnePaid(s.id, false)}
                      disabled={loading}
                      className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                    >
                      Pay Full
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
