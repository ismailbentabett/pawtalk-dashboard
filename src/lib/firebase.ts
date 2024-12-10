import { UserData } from "../types/Auth";
import { initializeApp } from "firebase/app";
import {
  AuthError,
  browserLocalPersistence,
  signOut as firebaseSignOut,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence);

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update last login timestamp
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      lastLogin: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    let message = "Login failed";

    switch (authError.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
        message = "Invalid email or password";
        break;
      case "auth/too-many-requests":
        message = "Too many attempts. Please try again later";
        break;
      case "auth/user-disabled":
        message = "This account has been disabled";
        break;
      default:
        message = "An error occurred during login";
    }

    return { success: false, error: message };
  }
}

export async function logoutUser() {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogout: serverTimestamp(),
      });
    }
    await firebaseSignOut(auth);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Failed to logout. Please try again.",
    };
  }
}

export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data() as UserData;
    if (!userData.isActive) {
      await firebaseSignOut(auth);
      return null;
    }

    return userData;
  } catch {
    console.error("Error fetching user data");
    return null;
  }
}
