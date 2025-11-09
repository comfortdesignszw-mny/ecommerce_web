import React, { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  Edit2,
  Save,
  X,
  Plus,
  Minus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import useUser from "@/utils/useUser";

export default function InventoryManagementPage() {
  const { data: user, loading: userLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItems, setEditingItems] = useState({});
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin/inventory";
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/admin/inventory");
      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }
      const data = await response.json();
      setProducts(data.products || []);
      setServices(data.services || []);
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (type, id, item) => {
    setEditingItems({
      ...editingItems,
      [`${type}_${id}`]: {
        type,
        id,
        stock_quantity: item.stock_quantity,
        low_stock_threshold: item.low_stock_threshold,
        track_inventory: item.track_inventory,
      },
    });
  };

  const cancelEditing = (type, id) => {
    const newEditing = { ...editingItems };
    delete newEditing[`${type}_${id}`];
    setEditingItems(newEditing);
  };

  const updateInventory = async (type, id) => {
    const itemKey = `${type}_${id}`;
    const editData = editingItems[itemKey];

    if (!editData) return;

    setUpdating({ ...updating, [itemKey]: true });

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          id,
          stock_quantity: parseInt(editData.stock_quantity),
          low_stock_threshold: parseInt(editData.low_stock_threshold),
          track_inventory: editData.track_inventory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update inventory");
      }

      // Refresh inventory data
      await fetchInventory();

      // Clear editing state
      cancelEditing(type, id);

      alert("Inventory updated successfully!");
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert("Failed to update inventory");
    } finally {
      setUpdating({ ...updating, [itemKey]: false });
    }
  };

  const updateEditValue = (type, id, field, value) => {
    const itemKey = `${type}_${id}`;
    setEditingItems({
      ...editingItems,
      [itemKey]: {
        ...editingItems[itemKey],
        [field]: value,
      },
    });
  };

  const quickStockUpdate = async (type, id, currentStock, change) => {
    const newStock = Math.max(0, currentStock + change);
    const itemKey = `${type}_${id}`;

    setUpdating({ ...updating, [itemKey]: true });

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          id,
          stock_quantity: newStock,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stock");
      }

      await fetchInventory();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock");
    } finally {
      setUpdating({ ...updating, [itemKey]: false });
    }
  };

  const getStockStatusColor = (item) => {
    if (!item.track_inventory) return "text-neutral-500";
    if (item.is_out_of_stock) return "text-red-600";
    if (item.is_low_stock) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockStatusIcon = (item) => {
    if (!item.track_inventory) return null;
    if (item.is_out_of_stock)
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (item.is_low_stock)
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <Package className="w-4 h-4 text-green-600" />;
  };

  const InventoryItem = ({ item, type }) => {
    const itemKey = `${type}_${item.id}`;
    const isEditing = editingItems[itemKey];
    const isUpdating = updating[itemKey];

    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-neutral-800">{item.name}</h3>
              {getStockStatusIcon(item)}
            </div>
            <p className="text-sm text-neutral-600 capitalize mb-1">
              {type} • {item.category?.replace("-", " ")}
            </p>
            <p className="text-lg font-bold text-neutral-800">
              ${parseFloat(item.price).toFixed(2)}
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => startEditing(type, item.id, item)}
              className="p-2 text-neutral-400 hover:text-neutral-600"
              disabled={isUpdating}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stock Display/Edit */}
        <div className="space-y-4">
          {isEditing ? (
            <>
              {/* Editing Mode */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={isEditing.stock_quantity}
                    onChange={(e) =>
                      updateEditValue(
                        type,
                        item.id,
                        "stock_quantity",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={isEditing.low_stock_threshold}
                    onChange={(e) =>
                      updateEditValue(
                        type,
                        item.id,
                        "low_stock_threshold",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`track_${itemKey}`}
                    checked={isEditing.track_inventory}
                    onChange={(e) =>
                      updateEditValue(
                        type,
                        item.id,
                        "track_inventory",
                        e.target.checked,
                      )
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor={`track_${itemKey}`}
                    className="text-sm text-neutral-700"
                  >
                    Track inventory
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateInventory(type, item.id)}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => cancelEditing(type, item.id)}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-3 py-2 bg-neutral-500 text-white text-sm rounded-md hover:bg-neutral-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Display Mode */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">Stock:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`font-semibold ${getStockStatusColor(item)}`}
                    >
                      {item.track_inventory
                        ? item.stock_quantity
                        : "Not tracked"}
                    </span>
                    {item.track_inventory && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            quickStockUpdate(
                              type,
                              item.id,
                              item.stock_quantity,
                              -1,
                            )
                          }
                          disabled={isUpdating || item.stock_quantity <= 0}
                          className="p-1 text-neutral-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            quickStockUpdate(
                              type,
                              item.id,
                              item.stock_quantity,
                              1,
                            )
                          }
                          disabled={isUpdating}
                          className="p-1 text-neutral-400 hover:text-green-600 disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-neutral-600">Low Stock Alert:</span>
                  <div className="font-semibold text-neutral-800 mt-1">
                    {item.track_inventory
                      ? item.low_stock_threshold
                      : "Disabled"}
                  </div>
                </div>
              </div>

              {item.track_inventory && item.is_out_of_stock && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Out of Stock</span>
                  </div>
                </div>
              )}

              {item.track_inventory &&
                item.is_low_stock &&
                !item.is_out_of_stock && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Low Stock Warning
                      </span>
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const productAlerts = alerts.find((a) => a.type === "product") || {
    out_of_stock: 0,
    low_stock: 0,
  };
  const serviceAlerts = alerts.find((a) => a.type === "service") || {
    out_of_stock: 0,
    low_stock: 0,
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/admin"
                className="text-neutral-600 hover:text-neutral-800"
              >
                ← Back to Admin
              </a>
            </div>
            <h1 className="text-2xl font-black text-neutral-800 tracking-wide">
              INVENTORY MANAGEMENT
            </h1>
            <button
              onClick={fetchInventory}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-800 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-neutral-600">
                  Total Products
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {products.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-neutral-600">
                  Total Services
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {services.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-neutral-600">
                  Low Stock
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {parseInt(productAlerts.low_stock) +
                    parseInt(serviceAlerts.low_stock)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-neutral-600">
                  Out of Stock
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {parseInt(productAlerts.out_of_stock) +
                    parseInt(serviceAlerts.out_of_stock)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading inventory...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Products Section */}
            <section>
              <h2 className="text-xl font-bold text-neutral-800 mb-4">
                Products ({products.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <InventoryItem
                    key={product.id}
                    item={product}
                    type="product"
                  />
                ))}
              </div>
            </section>

            {/* Services Section */}
            <section>
              <h2 className="text-xl font-bold text-neutral-800 mb-4">
                Services ({services.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <InventoryItem
                    key={service.id}
                    item={service}
                    type="service"
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .font-black {
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}
