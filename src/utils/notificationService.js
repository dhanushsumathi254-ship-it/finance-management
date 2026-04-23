import { supabase } from "../lib/supabase";
import { messaging } from "../notification/firebase";
import toast from "react-hot-toast";

/**
 * Service to handle notification logic
 * 1. Saves notification to Supabase
 * 2. Triggers Firebase Cloud Messaging (FCM)
 */
export const triggerNotification = async (expenseData) => {
  try {
    const { user_id, amount, status, date } = expenseData;

    const message = `You have a pending expense payment of ₹${amount.toLocaleString()}.`;
    const type = status === "Pending" ? "warning" : "error";

    // 1. Save to Supabase notifications table
    const { data, error } = await supabase.from("notifications").insert([
      {
        user_id,
        message,
        amount,
        expense_status: status,
        type,
        status: "unread",
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    // 2. Trigger FCM (Simulation/Client-side push)
    // In a real production app, you would send this to your backend/edge function
    // which would then call the Firebase Admin SDK to send the push notification.

    // For demonstration, we'll show a browser notification if permission is granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pending Expense Alert", {
        body: message,
        icon: "/logo.png", // Replace with your app logo
      });
    }

    // 3. Show UI feedback
    toast(message, {
      icon: "🔔",
      duration: 5000,
    });

    console.log("Notification triggered and saved:", message);
  } catch (error) {
    console.error("Error triggering notification:", error);
  }
};

/**
 * Backend/Edge Function Logic (Example)
 *
 * This is what you would put in a Supabase Edge Function to trigger FCM
 * via the Firebase Admin SDK.
 *
 * export const backendTriggerFCM = async (payload) => {
 *   const response = await fetch('https://fcm.googleapis.com/fcm/send', {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `key=YOUR_SERVER_KEY`,
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({
 *       to: payload.fcm_token,
 *       notification: {
 *         title: "Pending Expense",
 *         body: payload.message
 *       },
 *       data: payload.data
 *     })
 *   });
 *   return response.json();
 * }
 */
