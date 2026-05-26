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
  const [carId, setCarId] = useState("");
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
      api.get(`/sales/${id}/`).then((r) => {
        setCustomer(String(r.data.customer));
        setCarId(r.data.car_id || "");
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
      car_id: carId || null,
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
        await api.put(`/sales/${id}/`, payload);
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
        {/* Customer & Details */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Customer & Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Car ID
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
              >
                <option value="">No Car (None)</option>
                <option value="58371">58371</option>
                <option value="A07731">A07731</option>
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
          <h3 className="font-semibold text-gray-700 mb-3 block sticky left-0">Products</h3>
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
              <div className="col-span-4">Product <span className="text-red-500">*</span></div>
              <div className="col-span-2 text-right">Price <span className="text-red-500">*</span></div>
              <div className="col-span-1 text-center">Qty <span className="text-red-500">*</span></div>
              <div className="col-span-2 text-center">Discount %</div>
              <div className="col-span-2 text-right">Line Total</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => {
              const row = rows[idx];
              return (
                <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-2 md:items-center bg-gray-50 p-3 md:p-0 md:bg-transparent rounded-lg border border-gray-200 md:border-none">
                  <div className="w-full md:col-span-4">
                    <span className="text-xs font-semibold text-gray-600 md:hidden mb-1 block">Product <span className="text-red-500">*</span></span>
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
                  <div className="grid grid-cols-2 gap-2 md:contents">
                    <div className="md:col-span-2">
                      <span className="text-xs font-semibold text-gray-600 md:hidden mb-1 block">Price <span className="text-red-500">*</span></span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border rounded-lg px-2 py-1.5 text-sm md:text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(idx, "unit_price", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <span className="text-xs font-semibold text-gray-600 md:hidden mb-1 block">Qty <span className="text-red-500">*</span></span>
                      <input
                        type="number"
                        min="1"
                        className="w-full border rounded-lg px-2 py-1.5 text-sm md:text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:contents items-end">
                    <div className="md:col-span-2">
                      <span className="text-xs font-semibold text-gray-600 md:hidden mb-1 block">Discount %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full border rounded-lg px-2 py-1.5 text-sm md:text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.discount_percent}
                        onChange={(e) =>
                          updateItem(idx, "discount_percent", e.target.value)
                        }
                      />
                    </div>
                    <div className="md:col-span-2 text-right md:text-right font-mono text-sm font-medium text-gray-700 flex flex-col justify-end">
                      <span className="text-xs font-semibold text-gray-600 md:hidden mb-1 block text-right">Line Total</span>
                      <div className="flex flex-col items-end justify-end h-full min-h-[32px]">
                        ETB {row.lineTotal.toFixed(2)}
                        {row.discount > 0 && (
                          <span className="block text-[10px] text-green-600 leading-tight">
                            -ETB {row.discount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={items.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 p-2 border border-red-200 rounded md:border-none md:p-0 w-full md:w-auto"
                    >
                      <span className="md:hidden font-medium text-sm">Remove Item</span>
                      <span className="hidden md:inline text-lg leading-none">&times;</span>
                    </button>
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
