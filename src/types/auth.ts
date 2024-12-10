// src/types/Auth.ts

// User role definitions
export type UserRole = 'user' | 'moderator' | 'admin';

// Base user data interface
export interface UserData {
  [x: string]: string | number | boolean | Date | undefined;
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  createdAt: Date;
}

// Auth context type definitions
export interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<void>;
}

// Route configuration types
export interface RouteConfig {
  path: string;
  roles: UserRole[];
}

// Response types for auth operations
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserData;
  error?: string;
}

// Session types
export interface Session {
  user: UserData;
  expiresAt: Date;
  token: string;
}