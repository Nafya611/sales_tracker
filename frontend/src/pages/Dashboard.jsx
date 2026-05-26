import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function StatCard({ label, value, sub, highlight }) {
  return (
    <div
      className={`bg-white rounded-xl shadow p-5 ${highlight ? "ring-2 ring-orange-400" : ""}`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const today = new Date();
  const isSaturday = today.getDay() === 6;

  useEffect(() => {
    api.get("/dashboard/").then((r) => setStats(r.data));
  }, []);

  if (!stats) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <span className="text-sm text-gray-400">{today.toDateString()}</span>
      </div>

      {isSaturday && (
        <div className="mb-6 bg-orange-50 border border-orange-300 text-orange-800 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="font-semibold">Payment Day!</p>
            <p className="text-sm">
              Today is Saturday — review and mark pending payments.{" "}
              <Link to="/payments" className="underline font-medium">
                Go to Payments
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Unpaid Sales"
          value={stats.unpaid_count}
          sub={`ETB ${stats.unpaid_total} outstanding`}
          highlight={stats.unpaid_count > 0}
        />
        <StatCard
          label="Paid This Week"
          value={`ETB ${stats.paid_this_week}`}
        />
        <StatCard label="Total Revenue" value={`ETB ${stats.total_revenue}`} />
        <StatCard label="Customers" value={stats.total_customers} />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/sales/new"
          className="bg-blue-600 text-white rounded-xl px-5 py-4 hover:bg-blue-700 transition-colors flex items-center gap-3"
        >
          <span className="text-2xl">+</span>
          <div>
            <p className="font-semibold">New Sale</p>
            <p className="text-sm opacity-80">Create a new customer sale</p>
          </div>
        </Link>
        <Link
          to="/payments"
          className="bg-green-600 text-white rounded-xl px-5 py-4 hover:bg-green-700 transition-colors flex items-center gap-3"
        >
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold">Review Payments</p>
            <p className="text-sm opacity-80">
              {stats.unpaid_count} unpaid sales
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
