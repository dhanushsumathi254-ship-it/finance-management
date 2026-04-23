import { useState, useEffect } from 'react'
import { Plus, Target, TrendingUp, Calendar, Trash2, Edit2, X, CheckCircle, Sparkles, Lightbulb, ArrowRight, BrainCircuit, ShieldCheck, Plane, GraduationCap, Home } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, addMonths } from 'date-fns'

const AI_SUGGESTIONS = [
    {
        id: 'emergency',
        name: 'Emergency Fund',
        description: '3-6 months of essential living expenses for unexpected events.',
        icon: <ShieldCheck className="text-blue-500" />,
        defaultTarget: 50000,
        category: 'Security'
    },
    {
        id: 'vacation',
        name: 'Dream Vacation',
        description: 'Save for that trip you always wanted. Experiences are worth it!',
        icon: <Plane className="text-orange-500" />,
        defaultTarget: 100000,
        category: 'Lifestyle'
    },
    {
        id: 'education',
        name: 'Education / Upskilling',
        description: 'Invest in yourself. Save for a certification or a master degree.',
        icon: <GraduationCap className="text-purple-500" />,
        defaultTarget: 25000,
        category: 'Growth'
    },
    {
        id: 'house',
        name: 'Home Down Payment',
        description: 'Start building your future by saving for your first home.',
        icon: <Home className="text-emerald-500" />,
        defaultTarget: 500000,
        category: 'Future'
    }
]

const Goals = () => {
    const { user } = useAuth()
    const [goals, setGoals] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [showAIAssistant, setShowAIAssistant] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        goal_name: '',
        target_amount: '',
        saved_amount: '0',
        deadline: format(new Date(), 'yyyy-MM-dd')
    })

    useEffect(() => {
        if (user) {
            fetchGoals()
        }
    }, [user])

    const fetchGoals = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('savings_goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setGoals(data || [])
        } catch (error) {
            console.error('Error fetching goals:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const data = {
                ...formData,
                target_amount: parseFloat(formData.target_amount),
                saved_amount: parseFloat(formData.saved_amount),
                user_id: user.id
            }

            if (editingItem) {
                const { error } = await supabase
                    .from('savings_goals')
                    .update(data)
                    .eq('id', editingItem.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('savings_goals')
                    .insert([data])
                if (error) throw error
            }

            setShowModal(false)
            setEditingItem(null)
            setFormData({ goal_name: '', target_amount: '', saved_amount: '0', deadline: format(new Date(), 'yyyy-MM-dd') })
            fetchGoals()
        } catch (error) {
            console.error('Error saving goal:', error)
        }
    }

    const openEditModal = (goal) => {
        setEditingItem(goal)
        setFormData({
            goal_name: goal.goal_name,
            target_amount: goal.target_amount.toString(),
            saved_amount: goal.saved_amount.toString(),
            deadline: goal.deadline
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (window.confirm('Delete this goal?')) {
            try {
                const { error } = await supabase
                    .from('savings_goals')
                    .delete()
                    .eq('id', id)
                if (error) throw error
                fetchGoals()
            } catch (error) {
                console.error('Error deleting goal:', error)
            }
        }
    }

    const applyAISuggestion = (suggestion) => {
        setFormData({
            goal_name: suggestion.name,
            target_amount: suggestion.defaultTarget.toString(),
            saved_amount: '0',
            deadline: format(addMonths(new Date(), 12), 'yyyy-MM-dd') // Default to 1 year
        })
        setShowModal(true)
        setShowAIAssistant(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        Savings Goals
                        <Sparkles className="text-amber-500 animate-pulse" size={20} />
                    </h1>
                    <p className="text-sm md:text-base text-slate-500">Plan for your future and reach your milestones.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setShowAIAssistant(!showAIAssistant)}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
                    >
                        <BrainCircuit size={20} />
                        AI Advisor
                    </button>
                    <button
                        onClick={() => { setEditingItem(null); setFormData({ goal_name: '', target_amount: '', saved_amount: '0', deadline: format(new Date(), 'yyyy-MM-dd') }); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
                    >
                        <Plus size={20} />
                        Add Goal
                    </button>
                </div>
            </div>

            {/* AI Assistant Panel */}
            {showAIAssistant && (
                <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border border-indigo-100 p-6 md:p-8 shadow-xl animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Goal Planning Guide</h2>
                                <p className="text-sm text-slate-500">I'll help you structure your savings milestones.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAIAssistant(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {AI_SUGGESTIONS.map((suggestion) => (
                            <div key={suggestion.id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer" onClick={() => applyAISuggestion(suggestion)}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                        {suggestion.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{suggestion.category}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">{suggestion.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{suggestion.description}</p>
                                <div className="flex items-center text-indigo-600 text-xs font-bold gap-1 group-hover:gap-2 transition-all">
                                    Start Planning <ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-indigo-600/5 rounded-2xl p-4 flex items-start gap-4 border border-indigo-100/50">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Lightbulb size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-1">AI Smart Tip</h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                Split large goals into smaller chunks. Saving for a house Down Payment? Start with a goal for the first 5% - it makes the journey feel more achievable and keeps you motivated!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
                ) : goals.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
                        No savings goals found. Use the AI Advisor for a plan!
                    </div>
                ) : goals.map((goal) => {
                    const progress = (goal.saved_amount / goal.target_amount) * 100
                    const isCompleted = progress >= 100

                    return (
                        <div key={goal.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                            {isCompleted && (
                                <div className="absolute top-0 right-0 p-4 z-10">
                                    <CheckCircle className="text-emerald-500" size={24} />
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Target size={24} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(goal)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(goal.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">{goal.goal_name}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                        <Calendar size={14} />
                                        <span>Target: {format(new Date(goal.deadline), 'MMM dd, yyyy')}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-end justify-between">
                                        <span className="text-sm font-bold text-slate-900">₹{goal.saved_amount.toLocaleString()}</span>
                                        <span className="text-xs text-slate-400 font-bold">Goal: ₹{goal.target_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-600' : 'text-indigo-600'}`}>{progress.toFixed(0)}% Saved</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">₹{Math.max(0, goal.target_amount - goal.saved_amount).toLocaleString()} Left</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <h2 className="text-xl font-bold text-slate-800 mb-6">{editingItem ? 'Update Goal' : 'New Savings Goal'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-600">Goal Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.goal_name}
                                    onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                                    placeholder="e.g. Dream House, Euro Trip"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-600">Target (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.target_amount}
                                        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-600">Already Saved (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.saved_amount}
                                        onChange={(e) => setFormData({ ...formData, saved_amount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-600">Target Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:opacity-90 transition-all"
                                >
                                    {editingItem ? 'Save Changes' : 'Create Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Goals

