import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import toast from "react-hot-toast";

const Income = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [sortOrder, setSortOrder] = useState("date_desc");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    source: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  useEffect(() => {
    if (user) {
      fetchIncomes();
    }
  }, [user]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      setIncomes(data || []);
    } catch (error) {
      console.error("Error fetching income:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const incomeData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.id,
      };
      if (editingItem) {
        const { error } = await supabase
          .from("income")
          .update(incomeData)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Income record updated successfully! ✏️");
      } else {
        const { error } = await supabase.from("income").insert([incomeData]);
        if (error) throw error;
        toast.success(`Income from "${incomeData.source}" added successfully! 💰`);
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        source: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
      });
      fetchIncomes();
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error("Failed to save income record. Please try again.");
    }
  };

  const openEditModal = (income) => {
    setEditingItem(income);
    setFormData({
      source: income.source,
      amount: income.amount.toString(),
      date: format(new Date(income.date), "yyyy-MM-dd"),
      description: income.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const { error } = await supabase.from("income").delete().eq("id", id);
        if (error) throw error;
        toast.success("Income record deleted.");
        fetchIncomes();
      } catch (error) {
        console.error("Error deleting income:", error);
        toast.error("Failed to delete income record.");
      }
    }
  };

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setSortOrder("date_desc");
    setShowFilter(false);
  };

  const hasActiveFilters =
    filterDateFrom || filterDateTo || filterMinAmount || filterMaxAmount || sortOrder !== "date_desc";

  const getFilteredIncomes = () => {
    let result = [...incomes];

    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (income) =>
          income.source.toLowerCase().includes(q) ||
          (income.description && income.description.toLowerCase().includes(q)) ||
          income.amount.toString().includes(q) ||
          format(new Date(income.date), "MMM dd, yyyy").toLowerCase().includes(q)
      );
    }

    // Date range filter
    if (filterDateFrom) {
      result = result.filter((income) => income.date >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter((income) => income.date <= filterDateTo);
    }

    // Amount range filter
    if (filterMinAmount !== "") {
      result = result.filter((income) => income.amount >= parseFloat(filterMinAmount));
    }
    if (filterMaxAmount !== "") {
      result = result.filter((income) => income.amount <= parseFloat(filterMaxAmount));
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === "date_desc") return new Date(b.date) - new Date(a.date);
      if (sortOrder === "date_asc") return new Date(a.date) - new Date(b.date);
      if (sortOrder === "amount_desc") return b.amount - a.amount;
      if (sortOrder === "amount_asc") return a.amount - b.amount;
      return 0;
    });

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Income Management
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Track and manage your various income sources.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({
              source: "",
              amount: "",
              date: format(new Date(), "yyyy-MM-dd"),
              description: "",
            });
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 w-full md:w-auto"
        >
          <Plus size={20} />
          Add Income
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search source, description, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto relative">
            <button
              onClick={() => setShowFilter((prev) => !prev)}
              className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors flex-1 sm:flex-none ${
                showFilter || hasActiveFilters
                  ? "border-primary text-primary bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <Filter size={16} />
              Filter
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Filter Dropdown Panel */}
            {showFilter && (
              <div className="absolute top-full right-0 mt-2 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-5 w-72">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-800 dark:text-white text-sm">Filter Options</span>
                  <button
                    onClick={() => setShowFilter(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X size={16} className="text-slate-400 dark:text-slate-500" />
                  </button>
                </div>

                {/* Sort */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Sort By</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                  >
                    <option value="date_desc">Date (Newest First)</option>
                    <option value="date_asc">Date (Oldest First)</option>
                    <option value="amount_desc">Amount (Highest First)</option>
                    <option value="amount_asc">Amount (Lowest First)</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Date Range</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">From</span>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">To</span>
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Range */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Amount Range (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilter(false)}
                    className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 md:px-6 py-4">Date</th>
                <th className="px-4 md:px-6 py-4">Source</th>
                <th className="px-4 md:px-6 py-4">Amount</th>
                <th className="px-4 md:px-6 py-4">Description</th>
                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : getFilteredIncomes().length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-400 italic"
                  >
                    {searchQuery || hasActiveFilters
                      ? "No records match your search or filters."
                      : "No income records found"}
                  </td>
                </tr>
              ) : (
                getFilteredIncomes().map((income) => (
                  <tr
                    key={income.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(income.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 md:px-6 py-4 font-semibold">
                      {income.source}
                    </td>
                    <td className="px-4 md:px-6 py-4 font-bold text-emerald-600 whitespace-nowrap">
                      ₹{income.amount.toLocaleString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm opacity-70 truncate max-w-xs">
                      {income.description || "-"}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <button
                          onClick={() => openEditModal(income)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingItem ? "Edit Income" : "Add New Income"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  Source Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                  placeholder="e.g. Salary, Freelance"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none dark:text-white"
                  placeholder="Details about the income..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all mt-4"
              >
                {editingItem ? "Update Record" : "Add Record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
