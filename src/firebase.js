import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBqrRDiqjYhp-VYsb59GDq41a0Y7gafjMA",
    authDomain: "smart-study-app-726ac.firebaseapp.com",
    projectId: "smart-study-app-726ac",
    storageBucket: "smart-study-app-726ac.appspot.app",
    messagingSenderId: "841078629193",
    appId: "1:841078629193:web:cb0510e174506486d97098",
};

const app = initializeApp(firebaseConfig);

// ✅ THIS LINE IS VERY IMPORTANT
export const auth = getAuth(app);


