import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { UserData, UserRole } from "@/types/Auth";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRequiredRole: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserData = useCallback(
    async (uid: string): Promise<UserData | null> => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) return null;
        const data = userDoc.data() as UserData;
        return { ...data, id: userDoc.id };
      } catch (err) {
        console.error("Error fetching user data:", err);
        return null;
      }
    },
    []
  );

  const createUserDocument = useCallback(
    async (uid: string, email: string, name: string): Promise<void> => {
      try {
        await setDoc(doc(db, "users", uid), {
          email,
          name,
          role: "user" as UserRole,
          isActive: true,
          emailVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error creating user document:", err);
        throw new Error("Failed to create user profile");
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const fetchedUserData = await fetchUserData(userCredential.user.uid);
        if (!fetchedUserData) throw new Error("User data not found");
        setUser(userCredential.user);
        setUserData(fetchedUserData);
      } catch (err) {
        console.error("Sign in error:", err);
        setError("Authentication failed. Please check your credentials.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchUserData]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      setLoading(true);
      setError(null);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await sendEmailVerification(userCredential.user);
        await createUserDocument(userCredential.user.uid, email, name);
        const fetchedUserData = await fetchUserData(userCredential.user.uid);
        if (!fetchedUserData) throw new Error("Failed to create user profile");
        setUser(userCredential.user);
        setUserData(fetchedUserData);
      } catch (err) {
        console.error("Sign up error:", err);
        setError("Failed to create account. Please try again.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [createUserDocument, fetchUserData]
  );

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Failed to sign out. Please try again.");
      throw err;
    }
  }, [navigate]);

  const hasRequiredRole = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      return userData?.role ? requiredRoles.includes(userData.role) : false;
    },
    [userData]
  );

  useEffect(() => {
    // This listener will automatically run on page load and whenever
    // the auth state changes, keeping the user logged in if persistence is set.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        const fetchedUserData = await fetchUserData(currentUser.uid);
        setUser(currentUser);
        setUserData(fetchedUserData);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  useEffect(() => {
    // Handle route redirects
    if (!loading) {
      const isPublicRoute = ["/login", "/signup", "/forgot-password"].includes(
        location.pathname
      );
      const isProtectedRoute = location.pathname.startsWith("/dashboard");

      if (user && isPublicRoute) {
        navigate("/dashboard");
      } else if (!user && isProtectedRoute) {
        navigate("/login", { state: { from: location } });
      }
    }
  }, [user, loading, location, navigate]);

  const value: AuthContextType = {
    user,
    userData,
    loading,
    error,
    signIn,
    signUp,
    signOut: signOutUser,
    hasRequiredRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
