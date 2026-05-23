import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const EMPTY_ITEM = {
  product: "",
  unit_price: "",
  quantity: 1,
  discount_percent: 0,
};

export default function AddSale() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/customers/"), api.get("/products/")]).then(
      ([c, p]) => {
        setCustomers(c.data);
        setProducts(p.data);
      },
    );
    if (isEdit) {
      api.get(`/sales/ETB{id}/`).then((r) => {
        setCustomer(String(r.data.customer));
        setNotes(r.data.notes || "");
        setItems(
          r.data.items.map((i) => ({
            product: String(i.product),
            unit_price: i.unit_price,
            quantity: i.quantity,
            discount_percent: i.discount_percent,
          })),
        );
      });
    }
  }, [id, isEdit]);

  function handleProductChange(idx, productId) {
    const prod = products.find((p) => String(p.id) === String(productId));
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              product: productId,
              unit_price: prod ? prod.default_price : "",
            }
          : item,
      ),
    );
  }

  function updateItem(idx, field, value) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  }

  function addRow() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // Live totals
  const rows = items.map((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const disc = parseFloat(item.discount_percent) || 0;
    const lineTotal = qty * price * (1 - disc / 100);
    const lineSubtotal = qty * price;
    return { lineTotal, lineSubtotal, discount: lineSubtotal - lineTotal };
  });
  const subtotal = rows.reduce((s, r) => s + r.lineSubtotal, 0);
  const discountTotal = rows.reduce((s, r) => s + r.discount, 0);
  const total = rows.reduce((s, r) => s + r.lineTotal, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customer) {
      setError("Select a customer");
      return;
    }
    if (items.some((i) => !i.product)) {
      setError("Select a product for every row");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      customer: parseInt(customer),
      notes,
      items: items.map((i) => ({
        product: parseInt(i.product),
        unit_price: i.unit_price,
        quantity: parseInt(i.quantity),
        discount_percent: i.discount_percent,
      })),
    };
    try {
      if (isEdit) {
        await api.put(`/sales/ETB{id}/`, payload);
      } else {
        await api.post("/sales/", payload);
      }
      navigate("/sales");
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? "Edit Sale" : "New Sale"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Customer */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Customer</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ETB{c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Products</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
              <div className="col-span-4">Product</div>
              <div className="col-span-2 text-right">Unit Price (ETB)</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2 text-center">Discount %</div>
              <div className="col-span-2 text-right">Line Total</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => {
              const row = rows[idx];
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <select
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.product}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      required
                    >
                      <option value="">Select...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(idx, "unit_price", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.discount_percent}
                      onChange={(e) =>
                        updateItem(idx, "discount_percent", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm font-medium text-gray-700">
                    ETB {row.lineTotal.toFixed(2)}
                    {row.discount > 0 && (
                      <span className="block text-xs text-green-600">
                        -ETB {row.discount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            + Add product row
          </button>

          {/* Totals */}
          <div className="mt-5 pt-4 border-t space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-mono">ETB {subtotal.toFixed(2)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-mono">
                  -ETB {discountTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span className="font-mono">ETB {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/sales")}
            className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Update Sale" : "Create Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
