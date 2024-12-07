import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useMemo 
} from 'react';
import { User } from 'firebase/auth';
import { ROLE_BASED_ROUTES } from '@/constants/routes';
import { UserData } from '@/types/auth';
import { auth, getUserData } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAuthorized: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        setUser(user);
        if (user) {
          const data = await getUserData(user.uid);
          setUserData(data);
        } else {
          setUserData(null);
        }
      } catch (err) {
        setError('Failed to load user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const isAuthorized = useMemo(() => (path: string): boolean => {
    if (!user || !userData) return false;
    
    const requiredRoles = ROLE_BASED_ROUTES[path as keyof typeof ROLE_BASED_ROUTES];
    if (!requiredRoles) return true;
    
    return requiredRoles.includes(userData.role);
  }, [user, userData]);

  const value = useMemo(
    () => ({ user, userData, loading, error, isAuthorized }),
    [user, userData, loading, error, isAuthorized]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}