import { auth, db } from "@/lib/firebase";
import { UserData, UserRole } from "@/types/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  signOut as firebaseSignOut,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  hasRequiredRole: (requiredRoles: UserRole[]) => boolean;
}

const initialState: AuthState = {
  user: null,
  userData: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserData(uid: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      id: userDoc.id,
      email: data.email,
      role: data.role,
      name: data.name,
      createdAt: data.createdAt.toDate(),
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

async function createUserDocument(
  uid: string,
  userData: SignUpData
): Promise<void> {
  try {
    await setDoc(doc(db, "users", uid), {
      email: userData.email,
      name: userData.name,
      role: "user" as UserRole,
      isActive: true,
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      settings: {
        notifications: true,
        emailUpdates: true,
      },
    });
  } catch (error) {
    console.error("Error creating user document:", error);
    throw new Error("Failed to create user profile");
  }
}

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];
const PROTECTED_PATHS = ["/dashboard", "/settings", "/profile"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();
  const location = useLocation();

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((current) => ({ ...current, ...updates }));
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        updateState({ loading: true, error: null });
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userData = await fetchUserData(credential.user.uid);

        if (!userData) {
          throw new Error("No user data found");
        }

        updateState({
          user: credential.user,
          userData,
          loading: false,
          error: null,
        });

        // After successful login, redirect to the intended URL or dashboard
        const params = new URLSearchParams(location.search);
        const returnUrl = params.get("returnUrl");
        navigate(returnUrl || "/dashboard", { replace: true });
      } catch (error) {
        updateState({
          error: "Authentication failed",
          loading: false,
        });
        throw error;
      }
    },
    [location.search, navigate]
  );

  const signUp = useCallback(
    async (data: SignUpData) => {
      try {
        updateState({ loading: true, error: null });

        const credential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

        await sendEmailVerification(credential.user);
        await createUserDocument(credential.user.uid, data);

        const userData = await fetchUserData(credential.user.uid);

        if (!userData) {
          throw new Error("Failed to create user profile");
        }

        updateState({
          user: credential.user,
          userData,
          loading: false,
          error: null,
        });

        navigate("/dashboard", { replace: true });
      } catch (error: any) {
        let errorMessage = "Failed to create account";

        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "Email is already registered";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak";
            break;
          default:
            errorMessage = "An error occurred during signup";
        }

        updateState({
          error: errorMessage,
          loading: false,
        });
        throw error;
      }
    },
    [navigate]
  );

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setState(initialState);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }, [navigate]);

  const hasRequiredRole = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      const { userData } = state;
      if (!userData?.role) return false;
      return requiredRoles.includes(userData.role);
    },
    [state.userData?.role]
  );

  // Route guard effect
  useEffect(() => {
    if (state.loading) return;

    const currentPath = location.pathname;
    const isPublicPath = PUBLIC_PATHS.some((path) =>
      currentPath.startsWith(path)
    );
    const isProtectedPath = PROTECTED_PATHS.some((path) =>
      currentPath.startsWith(path)
    );

    if (state.user) {
      // If user is logged in and tries to access public routes
      if (isPublicPath) {
        navigate("/dashboard", { replace: true });
      }
    } else {
      // If user is not logged in and tries to access protected routes
      if (isProtectedPath) {
        const returnUrl = encodeURIComponent(currentPath);
        navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
      }
    }
  }, [state.user, state.loading, location.pathname, navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userData = await fetchUserData(user.uid);
          if (userData) {
            updateState({
              user,
              userData,
              loading: false,
              error: null,
            });
          } else {
            await firebaseSignOut(auth);
            updateState({
              user: null,
              userData: null,
              loading: false,
              error: "User data not found",
            });
          }
        } else {
          updateState({
            user: null,
            userData: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        updateState({
          error: "Failed to load user data",
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        hasRequiredRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
