import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Save,
  Package,
  Settings,
  Users,
  BarChart3,
  Monitor,
  Code,
  Palette,
  MessageSquare,
  BarChart,
  Smartphone,
  Headphones,
  Zap,
} from "lucide-react";
import useUser from "@/utils/useUser";
import { useUpload } from "@/utils/useUpload";

export default function AdminPage() {
  const { data: user, loading: userLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    is_new_arrival: false,
    is_hot_sale: false,
    sale_percent: 0,
    is_most_requested: false,
  });

  const [upload, { loading: uploadLoading }] = useUpload();

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/admin";
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [productsRes, servicesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/services"),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const result = await upload({
        reactNativeAsset: {
          file,
          name: file.name,
          mimeType: file.type,
        },
      });

      if (result.error) {
        alert("Upload failed: " + result.error);
        return null;
      }

      return result.url;
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
      return null;
    }
  };

  const openModal = (item = null, type = "product") => {
    if (item) {
      setEditingItem({ ...item, type });
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price || "",
        category: item.category || "",
        image_url: item.image_url || "",
        is_new_arrival: item.is_new_arrival || false,
        is_hot_sale: item.is_hot_sale || false,
        sale_percent: item.sale_percent || 0,
        is_most_requested: item.is_most_requested || false,
      });
    } else {
      setEditingItem({ type });
      setFormData({
        name: "",
        description: "",
        price: "",
        category: type === "product" ? "computers" : "web-development",
        image_url: "",
        is_new_arrival: false,
        is_hot_sale: false,
        sale_percent: 0,
        is_most_requested: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image_url: "",
      is_new_arrival: false,
      is_hot_sale: false,
      sale_percent: 0,
      is_most_requested: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const endpoint =
        editingItem?.type === "service" ? "/api/services" : "/api/products";
      const method = editingItem?.id ? "PUT" : "POST";
      const url = editingItem?.id ? `${endpoint}/${editingItem.id}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save item");
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item");
    }
  };

  const handleDelete = async (item, type) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const endpoint = type === "service" ? "/api/services" : "/api/products";
      const response = await fetch(`${endpoint}/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      await fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const CategoryIcon = ({ category }) => {
    const iconMap = {
      computers: Monitor,
      smartphones: Smartphone,
      "bluetooth-speakers": Headphones,
      "solar-products": Zap,
      "web-development": Code,
      "graphic-design": Palette,
      "digital-marketing": BarChart,
      consultation: MessageSquare,
    };
    const IconComponent = iconMap[category] || Monitor;
    return <IconComponent className="w-5 h-5" />;
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="bg-white border-b border-cyan-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-black text-blue-900 tracking-wide">
                COMFORT DESIGNS
              </h1>
              <span className="ml-4 text-sm text-blue-600">Admin Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-600">
                Welcome, {user.email}
              </span>
              <a href="/" className="text-sm text-blue-600 hover:text-cyan-600">
                View Site
              </a>
              <a
                href="/account/logout"
                className="text-sm text-blue-600 hover:text-cyan-600"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-cyan-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-cyan-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Products</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {products.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-cyan-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-cyan-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Services</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {services.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-cyan-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-cyan-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Hot Sales</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {products.filter((p) => p.is_hot_sale).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-cyan-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-cyan-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">
                  New Arrivals
                </p>
                <p className="text-2xl font-semibold text-blue-900">
                  {products.filter((p) => p.is_new_arrival).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <a
            href="/admin/inventory"
            className="bg-white p-6 rounded-lg border border-cyan-200 hover:shadow-xl hover:border-cyan-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center">
              <Package className="w-8 h-8 text-cyan-500 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 group-hover:text-cyan-600 transition-colors">
                  Inventory Management
                </h3>
                <p className="text-sm text-blue-600">
                  Manage stock levels and inventory tracking
                </p>
              </div>
            </div>
          </a>

          <a
            href="/orders"
            className="bg-white p-6 rounded-lg border border-cyan-200 hover:shadow-xl hover:border-cyan-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-cyan-500 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 group-hover:text-cyan-600 transition-colors">
                  Order History
                </h3>
                <p className="text-sm text-blue-600">
                  View and manage customer orders
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Tabs */}
        <div className="border-b border-cyan-100 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("products")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products"
                  ? "border-cyan-500 text-blue-900"
                  : "border-transparent text-blue-600 hover:text-blue-900 hover:border-cyan-300"
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "services"
                  ? "border-cyan-500 text-blue-900"
                  : "border-transparent text-blue-600 hover:text-blue-900 hover:border-cyan-300"
              }`}
            >
              Services ({services.length})
            </button>
          </nav>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() =>
              openModal(null, activeTab === "products" ? "product" : "service")
            }
            className="inline-flex items-center px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-md hover:bg-cyan-600 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === "products" ? "Product" : "Service"}
          </button>
        </div>

        {/* Items List */}
        <div className="bg-white shadow-sm border border-cyan-200 rounded-lg overflow-hidden">
          <div className="min-w-full divide-y divide-cyan-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                <p className="mt-4 text-blue-600">Loading...</p>
              </div>
            ) : (
              <div className="divide-y divide-cyan-100">
                {(activeTab === "products" ? products : services).map(
                  (item) => (
                    <div
                      key={item.id}
                      className="p-6 flex items-center justify-between hover:bg-cyan-25 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-16 w-16 object-cover rounded-lg border border-cyan-200"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-cyan-50 rounded-lg flex items-center justify-center border border-cyan-200">
                              <CategoryIcon category={item.category} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-blue-900">
                              {item.name}
                            </p>
                            {item.is_new_arrival && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                            {item.is_hot_sale && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                Hot Sale
                              </span>
                            )}
                            {item.is_most_requested && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Most Requested
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-600 mb-1">
                            {item.description
                              ? item.description.length > 100
                                ? item.description.substring(0, 100) + "..."
                                : item.description
                              : "No description"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-blue-500">
                            <span>${parseFloat(item.price).toFixed(2)}</span>
                            <span className="capitalize">
                              {item.category?.replace("-", " ")}
                            </span>
                            <span>
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            openModal(
                              item,
                              activeTab === "products" ? "product" : "service",
                            )
                          }
                          className="p-2 text-blue-400 hover:text-cyan-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              item,
                              activeTab === "products" ? "product" : "service",
                            )
                          }
                          className="p-2 text-blue-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ),
                )}
                {(activeTab === "products" ? products : services).length ===
                  0 && (
                  <div className="p-8 text-center text-blue-500">
                    No {activeTab} found. Click "Add{" "}
                    {activeTab === "products" ? "Product" : "Service"}" to get
                    started.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-blue-900">
                  {editingItem?.id ? "Edit" : "Add"}{" "}
                  {editingItem?.type === "service" ? "Service" : "Product"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-blue-400 hover:text-blue-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  >
                    {editingItem?.type === "service" ? (
                      <>
                        <option value="web-development">Web Development</option>
                        <option value="graphic-design">Graphic Design</option>
                        <option value="digital-marketing">
                          Digital Marketing
                        </option>
                        <option value="consultation">Consultation</option>
                      </>
                    ) : (
                      <>
                        <option value="computers">Computers</option>
                        <option value="smartphones">Smartphones</option>
                        <option value="bluetooth-speakers">
                          Bluetooth Speakers
                        </option>
                        <option value="solar-products">Solar Products</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Image URL"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <div className="text-center text-sm text-blue-500">or</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const url = await handleImageUpload(
                            e.target.files[0],
                          );
                          if (url) {
                            setFormData({ ...formData, image_url: url });
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    {uploadLoading && (
                      <div className="text-center text-sm text-blue-500">
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  {editingItem?.type === "service" ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_most_requested}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_most_requested: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-cyan-300 rounded"
                      />
                      <span className="ml-2 text-sm text-blue-700">
                        Most Requested Service
                      </span>
                    </label>
                  ) : (
                    <>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_new_arrival}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_new_arrival: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-cyan-300 rounded"
                        />
                        <span className="ml-2 text-sm text-blue-700">
                          New Arrival
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_hot_sale}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_hot_sale: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-cyan-300 rounded"
                        />
                        <span className="ml-2 text-sm text-blue-700">
                          Hot Sale
                        </span>
                      </label>
                      {formData.is_hot_sale && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Sale Percentage
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.sale_percent}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sale_percent: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-24 px-3 py-1 border border-cyan-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                          <span className="ml-1 text-sm text-blue-500">%</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-cyan-300 rounded-md hover:bg-cyan-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 border border-transparent rounded-md hover:bg-cyan-600 flex items-center shadow-md"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
