// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyBRMB9VXWrn4jir2o7XyzWd3MHu6ofrl5w",
    authDomain: "controlfitness01.firebaseapp.com",
    projectId: "controlfitness01",
    storageBucket: "controlfitness01.firebasestorage.app",
    messagingSenderId: "234664552388",
    appId: "1:234664552388:web:ac8724991999ade3e4a691"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();