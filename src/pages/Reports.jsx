import { useState, useEffect, useRef } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts'
import { Download, Calendar, TrendingUp, TrendingDown, Wallet, Tag, ArrowRight, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

const Reports = () => {
    const { user } = useAuth()
    const { theme } = useTheme()
    const [monthlyData, setMonthlyData] = useState([])
    const [categoryData, setCategoryData] = useState([])
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState(6)
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [allTransactions, setAllTransactions] = useState([])
    const [monthlyStats, setMonthlyStats] = useState({ income: 0, expense: 0, savings: 0 })
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [availableCategories, setAvailableCategories] = useState([])
    const isFetching = useRef(false)
    const reportRef = useRef(null)

    useEffect(() => {
        if (user) {
            fetchReportData()
        }
    }, [user, timeRange, selectedMonth, selectedCategory])

    const fetchReportData = async () => {
        if (isFetching.current) return
        try {
            isFetching.current = true
            setLoading(true)

            const [incomeRes, expenseRes] = await Promise.all([
                supabase
                    .from('income')
                    .select('amount, date, source, description')
                    .eq('user_id', user.id),
                supabase
                    .from('expenses')
                    .select('amount, date, category, description')
                    .eq('user_id', user.id)
            ])

            const incomeData = Array.isArray(incomeRes.data) ? incomeRes.data : []
            const expensesData = Array.isArray(expenseRes.data) ? expenseRes.data : []

            // Extract unique categories for the filter
            const uniqueCats = ['All Categories', 'Income Source', ...new Set(expensesData.map(e => e?.category).filter(Boolean))]
            setAvailableCategories(uniqueCats)

            // Auto-reset category if it doesn't exist in the current dataset
            if (selectedCategory !== 'All Categories' && selectedCategory !== 'Income Source' && !uniqueCats.includes(selectedCategory)) {
                setSelectedCategory('All Categories')
                return // Will re-trigger via useEffect
            }

            // Process Monthly Data for Charts (last X months)
            const lastMonths = Array.from({ length: Math.max(1, timeRange) }, (_, i) => {
                const date = subMonths(new Date(), i)
                return {
                    month: format(date, 'MMM'),
                    key: format(date, 'yyyy-MM'),
                    income: 0,
                    expense: 0,
                    savings: 0
                }
            }).reverse()

            lastMonths.forEach(m => {
                m.income = incomeData
                    .filter(i => i?.date && i.date.startsWith(m.key))
                    .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)

                m.expense = expensesData
                    .filter(e => e?.date && e.date.startsWith(m.key))
                    .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)

                m.savings = m.income - m.expense
            })

            setMonthlyData(lastMonths)

            // Process stats for SELECTED month (and category)
            const selIncome = incomeData
                .filter(i => {
                    if (!i?.date) return false
                    const matchesMonth = i.date.startsWith(selectedMonth)
                    const isExpenseCategory = selectedCategory !== 'All Categories' && selectedCategory !== 'Income Source'
                    const matchesCat = selectedCategory === 'All Categories' || selectedCategory === 'Income Source'
                    return matchesMonth && (matchesCat || isExpenseCategory)
                })
                .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)

            const selExpense = expensesData
                .filter(e => {
                    if (!e?.date) return false
                    const matchesMonth = e.date.startsWith(selectedMonth)
                    const matchesCat = selectedCategory === 'All Categories' || e.category === selectedCategory
                    return matchesMonth && matchesCat
                })
                .reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0)

            setMonthlyStats({
                income: selIncome,
                expense: selExpense,
                savings: selIncome - selExpense
            })

            // Process Category Data for Breakdown Chart
            const categoriesMap = {}
            expensesData
                .filter(e => e?.date && e.date.startsWith(selectedMonth))
                .forEach(e => {
                    const catName = e.category || 'Other'
                    categoriesMap[catName] = (categoriesMap[catName] || 0) + (Number(e.amount) || 0)
                })

            const sortedCatData = Object.entries(categoriesMap)
                .map(([name, value]) => ({ name, value: Number(value) || 0 }))
                .sort((a, b) => b.value - a.value)

            setCategoryData(sortedCatData)

            // Prepare transaction list for the selected month
            const combined = [
                ...incomeData.map(i => ({
                    ...i,
                    type: 'Income',
                    category: 'Income Source',
                    description: String(i.source || i.description || 'Income'),
                    amount: Number(i.amount) || 0,
                    date: i.date || new Date().toISOString().split('T')[0]
                })),
                ...expensesData.map(e => ({
                    ...e,
                    type: 'Expense',
                    category: String(e.category || 'Other'),
                    description: String(e.description || 'Expense'),
                    amount: Number(e.amount) || 0,
                    date: e.date || new Date().toISOString().split('T')[0]
                }))
            ]
                .filter(t => {
                    if (!t.date) return false
                    return t.date.startsWith(selectedMonth)
                })
                .sort((a, b) => {
                    const dateA = new Date(a.date).getTime() || 0
                    const dateB = new Date(b.date).getTime() || 0
                    return (dateB || 0) - (dateA || 0)
                })

            // Filter by Category if one is selected
            let filteredCombined = combined;
            if (selectedCategory !== 'All Categories') {
                if (selectedCategory === 'Income Source') {
                    filteredCombined = combined.filter(t => t.type === 'Income');
                } else {
                    filteredCombined = combined.filter(t => t.category === selectedCategory);
                }
            }

            setAllTransactions(filteredCombined)
        } catch (error) {
            console.error('Error fetching report data:', error)
            toast.error('Failed to load report data.')
        } finally {
            setLoading(false)
            isFetching.current = false
        }
    }

    const safeDateFormat = (dateStr, formatStr) => {
        try {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, formatStr);
        } catch (e) {
            return 'N/A';
        }
    }

    const handleExportExcel = () => {
        try {
            toast.loading('Preparing Excel file...', { id: 'excel-toast' })

            const excelData = allTransactions.map(t => ({
                Description: t.description || 'No description',
                Category: t.category,
                Date: safeDateFormat(t.date, 'yyyy-MM-dd'),
                Type: t.type,
                Amount: t.amount
            }))

            const ws = XLSX.utils.json_to_sheet(excelData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Transactions")

            const fileName = `Report_${selectedCategory.replace(/\s+/g, '_')}_${selectedMonth}.xlsx`
            XLSX.writeFile(wb, fileName)
            toast.success('Excel exported successfully!', { id: 'excel-toast' })
        } catch (error) {
            console.error('Error exporting Excel:', error)
            toast.error('Failed to export Excel.', { id: 'excel-toast' })
        }
    }

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 animate-pulse">Loading report data...</p>
            </div>
        )
    }

    if (!user) return null

    // Generate month options for the dropdown
    const monthOptions = Array.from({ length: 24 }, (_, i) => {
        const date = subMonths(new Date(), i)
        return {
            label: format(date, 'MMMM yyyy'),
            value: format(date, 'yyyy-MM')
        }
    })

    const displayMonthName = () => {
        try {
            if (!selectedMonth) return 'Current Month';
            const date = new Date(selectedMonth + '-01');
            if (isNaN(date.getTime())) return 'Current Month';
            return format(date, 'MMMM yyyy');
        } catch (e) {
            return 'Current Month';
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Monthly Reports</h1>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Track your income and expenses month by month.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Month Selector */}
                    <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Selector */}
                    <div className="relative">
                        <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-12 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none hover:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer transition-all shadow-sm"
                        >
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        <Download size={18} />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><TrendingUp size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Monthly Income</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹{monthlyStats.income.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg"><TrendingDown size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Monthly Expenses</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹{monthlyStats.expense.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm bg-gradient-to-br from-indigo-50 dark:from-indigo-900/20 to-white dark:to-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg"><Wallet size={20} /></div>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Monthly Savings</span>
                    </div>
                    <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{monthlyStats.savings.toLocaleString()}</h3>
                </div>
            </div>

            <div ref={reportRef} className="space-y-8 bg-slate-50/50 p-4 rounded-3xl">
                {/* Detailed Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Monthly Spending Trend */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Income vs Expenses History</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Last {timeRange} months trend</p>
                            </div>
                            <TrendingUp size={20} className="text-emerald-500" />
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }}
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                            color: theme === 'dark' ? '#f8fafc' : '#1e293b'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}
                                    />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Savings Growth */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Savings Growth</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Monthly savings trend</p>
                            </div>
                            <TrendingUp size={20} className="text-blue-500" />
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                            color: theme === 'dark' ? '#f8fafc' : '#1e293b'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}
                                    />
                                    <Area type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Expenses */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm md:col-span-2">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-8">
                            Expense Breakdown {selectedCategory !== 'All Categories' ? `for ${selectedCategory}` : 'by Category'} ({displayMonthName()})
                        </h3>
                        {categoryData.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 italic">No expenses recorded for this month.</div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#475569', fontSize: 12, fontWeight: 'bold' }} width={80} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ 
                                                    borderRadius: '12px', 
                                                    border: 'none', 
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                                    color: theme === 'dark' ? '#f8fafc' : '#1e293b'
                                                }}
                                                itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill="#6366f1"
                                                radius={[0, 4, 4, 0]}
                                                barSize={24}
                                                className="cursor-pointer"
                                                onClick={(data) => setSelectedCategory(data.name)}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-4">
                                    {categoryData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">₹{item.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Transaction List */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">Detailed Transaction Report</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {allTransactions.map((t, i) => (
                                    <tr key={i} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{t.description || 'No description'}</td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.category}</td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {safeDateFormat(t.date, 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.type === 'Income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 font-bold text-right ${t.type === 'Income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                                            {t.type === 'Income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {allTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-10 text-center text-slate-400 italic">No transactions found for this period</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Reports
