// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_Ck62jtkKifdhdeWrlpgKfSm3m9_q3vI",
  authDomain: "financial-management-322ee.firebaseapp.com",
  projectId: "financial-management-322ee",
  storageBucket: "financial-management-322ee.firebasestorage.app",
  messagingSenderId: "950775072646",
  appId: "1:950775072646:web:937dadb43717d3ad6f4e07",
  measurementId: "G-MG1MFP53GB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const messaging = getMessaging(app);

export const generateToken = async () => {
  try {
    if (!("Notification" in window)) {
      console.log("This browser does not support notification.");
      return;
    }
    const permission = await Notification.requestPermission();
    console.log(permission);
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BNMR-GhrcLGJUAgSi1ZVUZyCAZjhDf1U8sGgLnxum4JtEePG3ZIhTIydSVQkPYcEvwueQr02TkVN0GuTxKFjMjA",
      });

      console.log(token);
    }
  } catch (error) {
    console.error("An error occurred while generating token:", error);
  }
};

