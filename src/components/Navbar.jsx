import { Bell, Search, User, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'

const Navbar = ({ onMenuClick }) => {
    const { user } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const navigate = useNavigate()

    const searchQuery = searchParams.get('search') || ""

    const handleSearch = (e) => {
        const value = e.target.value;
        if (location.pathname !== '/dashboard') {
            navigate(`/dashboard?search=${encodeURIComponent(value)}`);
        } else {
            setSearchParams(prev => {
                if (value) prev.set('search', value);
                else prev.delete('search');
                return prev;
            });
        }
    }

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
                >
                    <Menu size={20} />
                </button>

                <div className="relative w-full max-w-md hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search transactions..."
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm dark:text-white"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onClick={() => navigate('/notifications')}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
                    title="Notifications"
                >
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>

                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 md:mx-2"></div>

                <div className="flex items-center gap-3">
                    <div
                        className="text-right hidden sm:block cursor-pointer"
                        onClick={() => navigate('/settings')}
                        title="Go to Profile Settings"
                    >
                        <p className="text-sm font-semibold text-slate-800 dark:text-white leading-none hover:text-primary transition-colors">{user?.user_metadata?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
                    </div>
                    <div
                        onClick={() => navigate('/settings')}
                        title="Go to Profile Settings"
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                    >
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={18} className="md:size-[20px]" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar
