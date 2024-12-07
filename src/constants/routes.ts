export const PROTECTED_ROUTES = {
    DASHBOARD: '/dashboard',
    ANALYTICS: '/dashboard/analytics',
    PETS: '/dashboard/pets',
    MESSAGES: '/dashboard/messages',
    MATCHES: '/dashboard/matches',
    APPOINTMENTS: '/dashboard/appointments',
    SETTINGS: '/dashboard/settings',
  } as const;
  
  export const PUBLIC_ROUTES = {
    LOGIN: '/login',
    HOME: '/',
  } as const;
  
  export const ROLE_BASED_ROUTES = {
    [PROTECTED_ROUTES.ANALYTICS]: ['admin', 'moderator'],
    [PROTECTED_ROUTES.SETTINGS]: ['admin'],
  } as const;