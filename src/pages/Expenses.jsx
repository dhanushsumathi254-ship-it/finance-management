import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Tag, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { triggerNotification } from "../utils/notificationService";
import toast from "react-hot-toast";

const Expenses = () => {
  const { user } = useAuth();
  const categories = [
    "Food",
    "Rent",
    "Transport",
    "Utilities",
    "Shopping",
    "Health",
    "Entertainment",
    "Others",
  ];
  const [expenses, setExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    payment_method: "UPI",
    status: "Paid",
  });

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkBudgetAlert = async (category, dateStr) => {
    try {
      const monthStr = dateStr.substring(0, 7); // yyyy-MM

      // Fetch budget for this category and month
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", category)
        .eq("month", monthStr);

      if (budgetError || !budgetData || budgetData.length === 0) return;
      const budget = budgetData[0];

      // Fetch all expenses for this category to calculate total spent
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("amount, date")
        .eq("user_id", user.id)
        .eq("category", category);

      if (expenseError) return;

      const totalSpent = expenseData
        .filter(e => e.date.startsWith(monthStr))
        .reduce((acc, curr) => acc + curr.amount, 0);

      const pct = (totalSpent / budget.budget_limit) * 100;

      if (pct >= 100) {
        window.alert(`🚨 "${category}" budget exceeded!\n₹${totalSpent.toLocaleString()} spent of ₹${budget.budget_limit.toLocaleString()} limit.`);
      } else if (pct >= 80) {
        window.alert(`⚠️ "${category}" is at ${pct.toFixed(0)}% — only ₹${(budget.budget_limit - totalSpent).toLocaleString()} left!`);
      }
    } catch (err) {
      console.error("Error checking budget alert:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Expense record updated successfully! ✏️");
      } else {
        const { error } = await supabase.from("expenses").insert([expenseData]);
        if (error) throw error;
        toast.success(`${expenseData.category} expense of ₹${expenseData.amount.toLocaleString()} added! 🧾`);
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        category: "Food",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        payment_method: "UPI",
        status: "Paid",
      });
      fetchExpenses();

      // Trigger notification if pending/unpaid
      if (expenseData.status === "Pending" || expenseData.status === "Unpaid") {
        await triggerNotification(expenseData);
      }

      // Check for budget alerts directly after saving
      await checkBudgetAlert(expenseData.category, expenseData.date);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense record. Please try again.");
    }
  };

  const openEditModal = (expense) => {
    setEditingItem(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      date: format(new Date(expense.date), "yyyy-MM-dd"),
      description: expense.description || "",
      payment_method: expense.payment_method || "UPI",
      status: expense.status || "Paid",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this expense?")) {
      try {
        const { error } = await supabase.from("expenses").delete().eq("id", id);
        if (error) throw error;
        toast.success("Expense record deleted.");
        fetchExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Failed to delete expense record.");
      }
    }
  };

  const getFilteredExpenses = () => {
    let result = [...expenses];

    // Category filter (case-insensitive)
    if (selectedCategory && selectedCategory !== "All Categories") {
      result = result.filter(
        (e) => e.category && e.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      );
    }

    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (e) =>
          (e.description && e.description.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q) ||
          (e.payment_method && e.payment_method.toLowerCase().includes(q)) ||
          e.amount.toString().includes(q) ||
          format(new Date(e.date), "MMM dd, yyyy").toLowerCase().includes(q)
      );
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Expense Management
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Keep track of every rupee you spend.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({
              category: "Food",
              amount: "",
              date: format(new Date(), "yyyy-MM-dd"),
              description: "",
              payment_method: "UPI",
              status: "Paid",
            });
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-200 w-full md:w-auto"
        >
          <Plus size={20} />
          Add Expense
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
              placeholder="Search category, description, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-600 dark:text-slate-400 focus:outline-none flex-1"
            >
              <option value="All Categories">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 md:px-6 py-4">Date</th>
                <th className="px-4 md:px-6 py-4">Category</th>
                <th className="px-4 md:px-6 py-4">Description</th>
                <th className="px-4 md:px-6 py-4">Method</th>
                <th className="px-4 md:px-6 py-4">Amount</th>
                <th className="px-4 md:px-6 py-4">Status</th>
                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : getFilteredExpenses().length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-slate-400 italic"
                  >
                    {searchQuery || selectedCategory !== "All Categories"
                      ? "No expenses match your search or filter."
                      : "No expenses found"}
                  </td>
                </tr>
              ) : (
                getFilteredExpenses().map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(expense.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] md:text-xs font-bold">
                        <Tag size={12} />
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 font-medium">
                      {expense.description || "-"}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {expense.payment_method}
                    </td>
                    <td className="px-4 md:px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-bold ${expense.status === 'Paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        expense.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                        {expense.status || 'Paid'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
                {editingItem ? "Edit Expense" : "Add New Expense"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
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
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                  placeholder="What was this for?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all mt-4"
              >
                {editingItem ? "Update Expense" : "Add Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
