import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, AlertTriangle, X, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// ── Helpers to track which alerts have already been shown ──────────────────
const getAlertedBudgets = (userId) => {
    try {
        return JSON.parse(localStorage.getItem(`budget_alerts_${userId}`) || '{}')
    } catch {
        return {}
    }
}

const saveAlertedBudgets = (userId, data) => {
    localStorage.setItem(`budget_alerts_${userId}`, JSON.stringify(data))
}

// ─────────────────────────────────────────────────────────────────────────────

const Budgets = () => {
    const { user } = useAuth()
    const [budgets, setBudgets] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        category: 'Food',
        budget_limit: '',
        month: format(new Date(), 'yyyy-MM')
    })

    const categories = ['Food', 'Rent', 'Transport', 'Utilities', 'Shopping', 'Health', 'Entertainment', 'Others']

    useEffect(() => {
        if (user) fetchBudgets()
    }, [user])

    const fetchBudgets = async () => {
        try {
            setLoading(true)

            const { data: budgetData, error: bError } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', user.id)
            if (bError) throw bError

            const { data: expenseData, error: eError } = await supabase
                .from('expenses')
                .select('amount, category, date')
                .eq('user_id', user.id)
            if (eError) throw eError

            const budgetsWithSpending = budgetData.map(budget => {
                const spent = expenseData
                    .filter(e => e.category === budget.category && e.date.startsWith(budget.month))
                    .reduce((acc, curr) => acc + curr.amount, 0)
                return { ...budget, spent }
            })

            setBudgets(budgetsWithSpending)

            // ── Only alert for the specific budget that newly crossed a threshold ──
            const alerted = getAlertedBudgets(user.id)

            budgetsWithSpending.forEach(budget => {
                const pct = (budget.spent / budget.budget_limit) * 100
                const key = budget.id

                if (pct >= 100 && alerted[key] !== 'exceeded') {
                    // First time this budget exceeded 100%
                    window.alert(`🚨 "${budget.category}" budget exceeded!\n₹${budget.spent.toLocaleString()} spent of ₹${budget.budget_limit.toLocaleString()} limit.`)
                    alerted[key] = 'exceeded'

                } else if (pct >= 80 && pct < 100 && !alerted[key]) {
                    // First time this budget reached the 80% warning zone
                    window.alert(`⚠️ "${budget.category}" is at ${pct.toFixed(0)}% — only ₹${(budget.budget_limit - budget.spent).toLocaleString()} left!`)
                    alerted[key] = 'near'

                } else if (pct < 80 && alerted[key]) {
                    // Budget dropped back below 80% (e.g., after editing limit) — reset alert
                    delete alerted[key]
                }
            })

            saveAlertedBudgets(user.id, alerted)

        } catch (error) {
            console.error('Error fetching budgets:', error)
            toast.error('Failed to load budget data.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const data = {
                ...formData,
                budget_limit: parseFloat(formData.budget_limit),
                user_id: user.id
            }

            if (editingItem) {
                const { error } = await supabase.from('budgets').update(data).eq('id', editingItem.id)
                if (error) throw error
                // Reset alert tracking for this budget so it can re-evaluate after edit
                const alerted = getAlertedBudgets(user.id)
                delete alerted[editingItem.id]
                saveAlertedBudgets(user.id, alerted)
                toast.success('Budget updated successfully!')
            } else {
                const { error } = await supabase.from('budgets').insert([data])
                if (error) throw error
                toast.success(`Budget created for "${data.category}" — ₹${data.budget_limit.toLocaleString()} limit.`)
            }

            setShowModal(false)
            setEditingItem(null)
            setFormData({ category: 'Food', budget_limit: '', month: format(new Date(), 'yyyy-MM') })
            fetchBudgets()
        } catch (error) {
            console.error('Error saving budget:', error)
            toast.error('Failed to save budget.')
        }
    }

    const openEditModal = (budget) => {
        setEditingItem(budget)
        setFormData({
            category: budget.category,
            budget_limit: budget.budget_limit.toString(),
            month: budget.month
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (window.confirm('Delete this budget?')) {
            try {
                const { error } = await supabase.from('budgets').delete().eq('id', id)
                if (error) throw error
                // Remove alert tracking for deleted budget
                const alerted = getAlertedBudgets(user.id)
                delete alerted[id]
                saveAlertedBudgets(user.id, alerted)
                toast.success('Budget deleted.')
                fetchBudgets()
            } catch (error) {
                console.error('Error deleting budget:', error)
                toast.error('Failed to delete budget.')
            }
        }
    }

    const getProgressColor = (pct) => {
        if (pct >= 100) return 'bg-rose-500'
        if (pct >= 80) return 'bg-amber-400'
        if (pct >= 60) return 'bg-yellow-400'
        return 'bg-emerald-500'
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Budget Management</h1>
                    <p className="text-sm md:text-base text-slate-500">Set limits and optimize your spending habits.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(null)
                        setFormData({ category: 'Food', budget_limit: '', month: format(new Date(), 'yyyy-MM') })
                        setShowModal(true)
                    }}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg w-full md:w-auto"
                >
                    <Plus size={20} />
                    Create Budget
                </button>
            </div>

            {/* ── Budget Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : budgets.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
                        No budgets set for this period.
                    </div>
                ) : budgets.map((budget) => {
                    const percentage = (budget.spent / budget.budget_limit) * 100
                    const remaining = budget.budget_limit - budget.spent
                    const isExceeded = percentage >= 100
                    const isNear = percentage >= 80 && !isExceeded

                    return (
                        <div
                            key={budget.id}
                            className={`bg-white rounded-3xl shadow-sm p-6 hover:shadow-md transition-shadow border ${
                                isExceeded ? 'border-rose-200' : isNear ? 'border-amber-200' : 'border-slate-100'
                            }`}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className={`px-3 py-1.5 rounded-xl ${isExceeded ? 'bg-rose-50' : isNear ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                    <h3 className="font-bold text-slate-800">{budget.category}</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Bell icon only for the affected budget */}
                                    {(isExceeded || isNear) && (
                                        <div className={`p-1.5 rounded-lg ${isExceeded ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                            <Bell size={14} />
                                        </div>
                                    )}
                                    <button onClick={() => openEditModal(budget)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(budget.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Spent / Limit */}
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Spent so far</p>
                                        <p className={`text-xl font-bold ${isExceeded ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-slate-900'}`}>
                                            ₹{budget.spent.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-medium">Monthly Limit</p>
                                        <p className="text-sm font-bold text-slate-600">₹{budget.budget_limit.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>

                                {/* % + status badge */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${isExceeded ? 'text-rose-500' : isNear ? 'text-amber-600' : 'text-slate-400'}`}>
                                        {percentage.toFixed(0)}% Utilized
                                    </span>

                                    {isExceeded && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-[10px] font-bold">
                                            <AlertCircle size={11} />
                                            Limit Exceeded
                                        </div>
                                    )}
                                    {isNear && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold">
                                            <AlertTriangle size={11} />
                                            Near Limit
                                        </div>
                                    )}
                                </div>

                                {/* Remaining / Over message */}
                                {isExceeded ? (
                                    <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                                        ₹{Math.abs(remaining).toLocaleString()} over budget for {budget.month}
                                    </div>
                                ) : isNear ? (
                                    <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                                        Only ₹{remaining.toLocaleString()} remaining for {budget.month}
                                    </div>
                                ) : (
                                    <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 text-slate-500">
                                        ₹{remaining.toLocaleString()} remaining for {budget.month}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800">{editingItem ? 'Update Budget' : 'Set New Budget'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-600">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-600">Monthly Limit (₹)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.budget_limit}
                                    onChange={(e) => setFormData({ ...formData, budget_limit: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="e.g. 5000"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-600">Month</label>
                                <input
                                    type="month"
                                    required
                                    value={formData.month}
                                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all mt-4"
                            >
                                {editingItem ? 'Update Budget' : 'Establish Budget'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Budgets
