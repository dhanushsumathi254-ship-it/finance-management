import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    Wallet,
    PieChart,
    Target,
    Bell,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    PlusCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/cn'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: TrendingUp, label: 'Income', path: '/income' },
    { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
    { icon: Wallet, label: 'Budgets', path: '/budgets' },
    { icon: PieChart, label: 'Reports', path: '/reports' },
    { icon: Target, label: 'Savings Goals', path: '/goals' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
]

const Sidebar = ({ isOpen, toggleSidebar, mobileOpen, closeMobile }) => {
    const { signOut } = useAuth()
    const location = useLocation()
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const handleLogout = () => {
        signOut()
        setShowLogoutConfirm(false)
        closeMobile()
    }

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
                    onClick={closeMobile}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 flex flex-col",
                    isOpen ? "w-64" : "w-20",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
                    {(isOpen || mobileOpen) && (
                        <div className="flex items-center gap-2 font-bold text-xl text-primary">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                                <PlusCircle size={20} />
                            </div>
                            <span className="truncate">SmartFinance</span>
                        </div>
                    )}
                    {(!isOpen && !mobileOpen) && (
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white mx-auto">
                            <PlusCircle size={20} />
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-500 hover:text-primary transition-colors shadow-sm"
                    >
                        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMobile}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary dark:hover:text-primary"
                                )}
                            >
                                <item.icon size={22} className={cn("shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                                {(isOpen || mobileOpen) && <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group",
                        )}
                    >
                        <LogOut size={22} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                        {(isOpen || mobileOpen) && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowLogoutConfirm(false)}
                    ></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-800">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-2">
                                <LogOut size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Logout</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Are you sure you want to log out of your account?</p>
                            </div>
                            <div className="flex gap-3 w-full pt-4">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Sidebar
