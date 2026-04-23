import { useState, useRef } from 'react'
import { User, Lock, Bell, Globe, Palette, Shield, Laptop, Moon, Sun, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { cn } from '../utils/cn'

const Settings = () => {
    const { user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('Profile')
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '')
    const fileInputRef = useRef(null)

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file')
            return
        }

        // Validate file size (e.g., 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size should be less than 2MB')
            return
        }

        try {
            setLoading(true)

            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)

            // Update user metadata immediately
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            })

            if (updateError) throw updateError

            alert('Profile photo updated!')
        } catch (error) {
            console.error('Error uploading avatar:', error)
            alert('Failed to upload photo. Please ensure an "avatars" bucket exists in Supabase storage.')
        } finally {
            setLoading(false)
        }
    }

    const handleRemovePhoto = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: null }
            })
            if (error) throw error
            setAvatarUrl('')
            alert('Profile photo removed!')
        } catch (error) {
            console.error('Error removing photo:', error)
            alert('Failed to remove photo')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    avatar_url: avatarUrl
                }
            })
            if (error) throw error
            alert('Profile updated successfully!')
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Manage your profile and account preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1 space-y-2">
                    {['Profile', 'Security', 'Preferences'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm md:text-base text-left",
                                activeTab === tab
                                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-100 dark:border-slate-700"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            )}
                        >
                            {tab === 'Profile' && <User size={20} />}
                            {tab === 'Security' && <Shield size={20} />}
                            {tab === 'Preferences' && <Globe size={20} />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 md:p-8">
                    {activeTab === 'Profile' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-50 dark:border-slate-700/50">
                                <div
                                    onClick={handleAvatarClick}
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group relative overflow-hidden shrink-0 cursor-pointer"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-[10px] md:text-xs font-bold uppercase">Change</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="text-center sm:text-left min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg md:text-xl truncate">{user?.user_metadata?.full_name || 'User'}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate">{user?.email}</p>
                                    {avatarUrl && (
                                        <button
                                            onClick={handleRemovePhoto}
                                            className="text-xs font-bold text-red-500 hover:underline"
                                        >
                                            Remove photo
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none text-sm dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
                                    <input type="text" disabled value={user?.email} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 outline-none text-sm opacity-60 cursor-not-allowed dark:text-white" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Security' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 dark:text-white">Password</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">To change your password, we will send a reset link to your email.</p>
                                <button
                                    onClick={async () => {
                                        const { error } = await supabase.auth.resetPasswordForEmail(user.email)
                                        if (error) alert(error.message)
                                        else alert('Password reset email sent!')
                                    }}
                                    className="w-full sm:w-auto text-primary font-bold text-sm bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    Send Reset Email
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-50 dark:border-slate-700/50 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">Two-factor Authentication</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                                    </div>
                                    <button className="w-full sm:w-auto text-blue-600 dark:text-blue-400 font-bold text-sm px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg whitespace-nowrap">Enable 2FA</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Preferences' && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 dark:text-white">General</h3>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <Moon size={20} className="text-slate-500 dark:text-slate-400" />
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Dark Mode</span>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-colors duration-200",
                                            theme === 'dark' ? "bg-primary" : "bg-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200",
                                            theme === 'dark' ? "left-7" : "left-1"
                                        )}></div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent dark:border-slate-700">
                                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                        <Globe size={20} className="text-slate-500 dark:text-slate-400" />
                                        <span className="font-medium">Currency</span>
                                    </div>
                                    <select className="bg-transparent font-bold text-primary outline-none text-sm">
                                        <option>INR (₹)</option>
                                        <option>USD ($)</option>
                                        <option>EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Settings
