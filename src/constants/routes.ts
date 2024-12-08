export const PROTECTED_ROUTES = {
    DASHBOARD: '/dashboard',
    ANALYTICS: '/dashboard/analytics',
    PETS: '/dashboard/pets',
    MESSAGES: '/dashboard/messages',
    MATCHES: '/dashboard/matches',
    APPOINTMENTS: '/dashboard/appointments',
    SETTINGS: '/dashboard/settings',
    PROFILE: '/dashboard/profile',
  } as const;
  
  export const PUBLIC_ROUTES = {
    LOGIN: '/login',
    HOME: '/',
  } as const;
  

  export const ROLE_BASED_ROUTES: Record<string, string[]> = {
    [PROTECTED_ROUTES.DASHBOARD]: ['user', 'admin'],
    [PROTECTED_ROUTES.SETTINGS]: ['admin'],
    [PROTECTED_ROUTES.PROFILE]: ['user', 'admin']
  };