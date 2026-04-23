import { useState, useEffect } from "react";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    MoreVertical,
    X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ status: "read" })
                .eq("id", id);
            if (error) throw error;
            fetchNotifications();
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", id);
            if (error) throw error;
            fetchNotifications();
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                        Notifications
                    </h1>
                    <p className="text-sm md:text-base text-slate-500">
                        Stay updated with your financial alerts.
                    </p>
                </div>
                <button className="text-sm font-bold text-primary hover:underline">
                    Mark all as read
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {loading ? (
                        <div className="p-10 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 italic font-medium">
                            No notifications yet.
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-4 md:p-6 flex gap-3 md:gap-4 transition-colors hover:bg-slate-50 ${n.status === "unread" ? "bg-blue-50/30" : ""}`}
                            >
                                <div
                                    className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${n.type === "warning"
                                            ? "bg-amber-100 text-amber-600"
                                            : n.type === "success"
                                                ? "bg-emerald-100 text-emerald-600"
                                                : "bg-blue-100 text-blue-600"
                                        }`}
                                >
                                    {n.type === "warning" ? (
                                        <AlertTriangle size={20} className="md:size-6" />
                                    ) : n.type === "success" ? (
                                        <CheckCircle size={20} className="md:size-6" />
                                    ) : (
                                        <Bell size={20} className="md:size-6" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {n.type || "Alert"}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {format(new Date(n.created_at), "MMM dd, HH:mm")}
                                        </span>
                                    </div>
                                    <p
                                        className={`text-sm md:text-base text-slate-700 leading-snug ${n.status === "unread" ? "font-semibold" : ""}`}
                                    >
                                        {n.message}
                                    </p>

                                    {n.amount && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                                ₹{n.amount.toLocaleString()}
                                            </span>
                                            {n.expense_status && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${n.expense_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                                                        n.expense_status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-rose-50 text-rose-600'
                                                    }`}>
                                                    {n.expense_status}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {n.status === "unread" && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="mt-3 text-xs font-bold text-primary hover:underline"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => deleteNotification(n.id)}
                                    className="shrink-0 text-slate-300 hover:text-rose-500 p-1 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
