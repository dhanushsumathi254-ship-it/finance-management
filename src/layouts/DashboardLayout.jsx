import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { cn } from '../utils/cn'

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                mobileOpen={isMobileOpen}
                closeMobile={() => setIsMobileOpen(false)}
            />

            <div
                className={cn(
                    "flex-1 flex flex-col transition-all duration-300 w-full",
                    isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
                )}
            >
                <Navbar onMenuClick={() => setIsMobileOpen(true)} />
                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout
