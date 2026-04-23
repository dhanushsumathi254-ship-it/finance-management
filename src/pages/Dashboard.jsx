import { useState, useEffect } from 'react'
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Calendar
} from 'lucide-react'
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, subMonths } from 'date-fns'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const Dashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { theme } = useTheme()
    const [searchParams] = useSearchParams()
    const searchQuery = searchParams.get('search')?.toLowerCase() || ""
    const [showAll, setShowAll] = useState(false)
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        monthlySavings: 0
    })
    const [allTransactions, setAllTransactions] = useState([])
    const [recentTransactions, setRecentTransactions] = useState([])
    const [expenseData, setExpenseData] = useState([])
    const [comparisonData, setComparisonData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchDashboardData()
        }
    }, [user])

    useEffect(() => {
        if (searchQuery) {
            const filtered = allTransactions.filter(t =>
                (t.description && t.description.toLowerCase().includes(searchQuery)) ||
                (t.category && t.category.toLowerCase().includes(searchQuery)) ||
                (t.amount && t.amount.toString().includes(searchQuery)) ||
                (t.type && t.type.toLowerCase().includes(searchQuery))
            )
            setRecentTransactions(filtered)
        } else {
            setRecentTransactions(showAll ? allTransactions : allTransactions.slice(0, 5))
        }
    }, [searchQuery, allTransactions, showAll])

    const handleViewAll = () => {
        setShowAll(prev => !prev)
    }

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch Income
            const { data: incomeData } = await supabase
                .from('income')
                .select('amount, date, source')
                .eq('user_id', user.id)

            // Fetch Expenses
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('amount, date, category, description')
                .eq('user_id', user.id)

            const currentMonthKey = format(new Date(), 'yyyy-MM')
            
            const monthlyIncome = (incomeData
                ?.filter(i => i.date && String(i.date).startsWith(currentMonthKey))
                .reduce((acc, curr) => acc + curr.amount, 0)) || 0
            
            const monthlyExpenses = (expensesData
                ?.filter(e => e.date && String(e.date).startsWith(currentMonthKey))
                .reduce((acc, curr) => acc + curr.amount, 0)) || 0

            const totalIncome = incomeData?.reduce((acc, curr) => acc + curr.amount, 0) || 0
            const totalExpenses = expensesData?.reduce((acc, curr) => acc + curr.amount, 0) || 0

            setStats({
                totalIncome: monthlyIncome,
                totalExpenses: monthlyExpenses,
                balance: totalIncome - totalExpenses, // Keep overall balance
                monthlySavings: monthlyIncome > 0 ? (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1) : 0
            })

            // Prepare recent transactions
            const combined = [
                ...(incomeData?.map(i => ({ ...i, type: 'Income', category: 'Source', description: i.source })) || []),
                ...(expensesData?.map(e => ({ ...e, type: 'Expense' })) || [])
            ].sort((a, b) => new Date(b.date) - new Date(a.date))

            setAllTransactions(combined)

            // Prepare expense distribution (Current Month)
            const categories = {}
            expensesData
                ?.filter(e => e.date && e.date.startsWith(currentMonthKey))
                .forEach(e => {
                    categories[e.category] = (categories[e.category] || 0) + e.amount
                })
            setExpenseData(Object.entries(categories).map(([name, value]) => ({ name, value })))

            // Prepare comparison data (Last 6 months)
            const last6Months = Array.from({ length: 6 }, (_, i) => {
                const date = subMonths(new Date(), i)
                const key = format(date, 'yyyy-MM')
                return {
                    name: format(date, 'MMM'),
                    key: key,
                    income: incomeData?.filter(i => i.date && i.date.startsWith(key)).reduce((acc, curr) => acc + curr.amount, 0) || 0,
                    expense: expensesData?.filter(e => e.date && e.date.startsWith(key)).reduce((acc, curr) => acc + curr.amount, 0) || 0
                }
            }).reverse()
            
            setComparisonData(last6Months)

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Overview</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome back! Here's what's happening with your money.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Monthly Income"
                    amount={stats.totalIncome}
                    icon={TrendingUp}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                    trend="Current Month"
                    trendUp={true}
                />
                <StatCard
                    title="Monthly Expenses"
                    amount={stats.totalExpenses}
                    icon={TrendingDown}
                    color="text-rose-600"
                    bgColor="bg-rose-50"
                    trend="Current Month"
                    trendUp={false}
                />
                <StatCard
                    title="Total Balance"
                    amount={stats.balance}
                    icon={Wallet}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    trend="Overall"
                />
                <StatCard
                    title="Savings Rate"
                    amount={`${stats.monthlySavings}%`}
                    icon={ArrowUpRight}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                    trend="Monthly Rate"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Income vs Expenses</h3>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Last 6 Months</button>
                        </div>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} dy={10} />
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
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Distribution */}
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-6">Expense Distribution</h3>
                    <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseData.length > 0 ? expenseData : [{ name: 'Empty', value: 1 }]}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    {expenseData.length === 0 && <Cell fill="#f1f5f9" />}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Showing {recentTransactions.length} of {allTransactions.length} transactions
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!searchQuery && allTransactions.length > 5 && (
                            <button
                                onClick={handleViewAll}
                                className="text-blue-600 text-sm font-bold hover:underline transition-all"
                            >
                                {showAll ? 'Show Less' : 'View All'}
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/reports')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            View Reports
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="px-4 md:px-6 py-4">Transaction</th>
                                <th className="px-4 md:px-6 py-4">Category</th>
                                <th className="px-4 md:px-6 py-4">Date</th>
                                <th className="px-4 md:px-6 py-4">Amount</th>
                                <th className="px-4 md:px-6 py-4">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {recentTransactions.map((t, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'Income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                                {t.type === 'Income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px] md:max-w-none">{t.description || t.source || 'No description'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-slate-500 text-sm">{t.category}</td>
                                    <td className="px-4 md:px-6 py-4 text-slate-500 text-sm whitespace-nowrap">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                                    <td className={`px-4 md:px-6 py-4 font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                                        {t.type === 'Income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.type === 'Income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentTransactions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400 italic">No recent transactions found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const StatCard = ({ title, amount, icon: Icon, color, bgColor, trend, trendUp }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${bgColor} dark:bg-opacity-20 ${color} flex items-center justify-center`}>
                    <Icon size={24} />
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><MoreVertical size={20} /></button>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {typeof amount === 'number' ? `₹${amount.toLocaleString()}` : amount}
                </h3>
                {trend && (
                    <div className="flex items-center gap-1 mt-2">
                        <span className={`text-xs font-medium ${trendUp === true ? 'text-emerald-500' : trendUp === false ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                            {trend}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
