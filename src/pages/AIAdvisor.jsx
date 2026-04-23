import { useState } from 'react'
import { Sparkles, BrainCircuit, Target, TrendingUp, ShieldCheck, Plane, GraduationCap, Home, ArrowRight, Lightbulb, MessageSquare, Bot, User, Send, ChevronRight, Loader2 } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { getChatGPTResponse } from '../lib/openai'

const AI_INSIGHTS = [
    {
        title: "The 50/30/20 Rule",
        description: "Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
        icon: <Target className="text-indigo-600" />,
        bgColor: "bg-indigo-50"
    },
    {
        title: "Emergency Fund First",
        description: "Aim for 3-6 months of essential living expenses before aggressive investing.",
        icon: <ShieldCheck className="text-emerald-600" />,
        bgColor: "bg-emerald-50"
    },
    {
        title: "Compound Interest",
        description: "Starting early is more important than starting big. Time is your greatest asset.",
        icon: <TrendingUp className="text-amber-600" />,
        bgColor: "bg-amber-50"
    }
]

const RECOMMENDED_GOALS = [
    {
        name: "Rainy Day Fund",
        target: "₹50,000",
        duration: "6 Months",
        description: "A safety net for unexpected car repairs or medical bills.",
        icon: <ShieldCheck className="text-blue-500" />
    },
    {
        name: "Skill Upgrade",
        target: "₹25,000",
        duration: "3 Months",
        description: "Courses or certifications to boost your career earnings.",
        icon: <GraduationCap className="text-purple-500" />
    },
    {
        name: "Annual Vacation",
        target: "₹1,20,000",
        duration: "12 Months",
        description: "Relax and recharge without touching your long-term savings.",
        icon: <Plane className="text-orange-500" />
    }
]

const AIAdvisor = () => {
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hello! I'm your ChatGPT-powered AI Advisor. How can I help you plan your financial future today?" }
    ])
    const [inputText, setInputText] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!inputText.trim() || isLoading) return

        const userMsg = inputText.trim()
        const newMessages = [...messages, { role: 'user', text: userMsg }]
        setMessages(newMessages)
        setInputText('')
        setIsLoading(true)

        try {
            const response = await getChatGPTResponse(userMsg)
            setMessages(prev => [...prev, { role: 'bot', text: response }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I encountered an error with ChatGPT. Please try again." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/30">
                            <Sparkles size={14} className="animate-pulse" />
                            AI Powered Guidance
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            Meet Your Personal <br /> <span className="text-indigo-200">Financial Advisor</span>
                        </h1>
                        <p className="text-indigo-100 text-lg max-w-md opacity-90">
                            Get personalized insights, smart goal recommendations, and expert advice to master your money.
                        </p>
                    </div>
                    <div className="hidden lg:block">
                        <div className="w-64 h-64 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                            <BrainCircuit size={120} className="text-indigo-100 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chat Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                                    <Bot size={20} />
                                </div>
                                <h2 className="font-bold text-slate-800">Smart Chat</h2>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Online
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`p-2 rounded-xl h-fit shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-700'}`}>
                                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                        </div>
                                        <div className={`p-4 rounded-2xl shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-700'}`}>
                                            <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[80%]">
                                        <div className="p-2 rounded-xl h-fit shadow-sm bg-white border border-slate-100 text-slate-700">
                                            <Bot size={18} />
                                        </div>
                                        <div className="p-4 rounded-2xl shadow-sm bg-white border border-slate-100 text-slate-700">
                                            <Loader2 size={18} className="animate-spin text-indigo-600" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                <input 
                                    type="text" 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={isLoading ? "Thinking..." : "Ask anything about saving..."}
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent px-4 py-2.5 outline-none text-slate-700 text-sm font-medium disabled:opacity-50"
                                />
                                <button type="submit" disabled={isLoading || !inputText.trim()} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:bg-slate-400">
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Recommended Goals */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 px-2">Tailored for You</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {RECOMMENDED_GOALS.map((goal, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group cursor-pointer">
                                    <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 group-hover:bg-indigo-50 transition-colors">
                                        {goal.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-1">{goal.name}</h3>
                                    <div className="flex items-center justify-between text-xs font-bold mb-3">
                                        <span className="text-indigo-600">{goal.target}</span>
                                        <span className="text-slate-400">{goal.duration}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{goal.description}</p>
                                    <div className="flex items-center text-indigo-600 text-[10px] font-black uppercase tracking-widest gap-1 group-hover:gap-2 transition-all">
                                        View Details <ChevronRight size={14} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar/Insights Section */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                                <Lightbulb size={20} />
                            </div>
                            <h2 className="font-bold text-slate-800">Smart Insights</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {AI_INSIGHTS.map((insight, idx) => (
                                <div key={idx} className={`p-5 rounded-2xl ${insight.bgColor} space-y-2 border border-black/5`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {insight.icon}
                                        <h3 className="font-bold text-slate-800 text-sm">{insight.title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        {insight.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group">
                                Generate Full Audit
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <h3 className="text-lg font-bold mb-2">Pro Tip</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed mb-6 font-medium">
                            Based on last month's data, you could save ₹2,400 more by reducing dining out expenses.
                        </p>
                        <button className="text-xs font-black uppercase tracking-widest py-2 px-4 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
                            Analyze Spending
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AIAdvisor
