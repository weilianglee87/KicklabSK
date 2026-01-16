import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your Firebase project configuration
// You can get this from the Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "AIzaSyAkBAMrS5zbbciqiyeYRBar6DbdnWWLDcQ",
    authDomain: "kicklabsk.firebaseapp.com",
    projectId: "kicklabsk",
    storageBucket: "kicklabsk.firebasestorage.app",
    messagingSenderId: "805880660882",
    appId: "1:805880660882:web:4ee38abe1c14c407a8f74b",
    measurementId: "G-VH44R0VNBQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
