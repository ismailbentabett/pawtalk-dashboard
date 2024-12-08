import { ToastActionElement } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import React, { createContext, useCallback, useContext } from 'react';

// Define the toast options type
type ToastOptions = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
  duration?: number;
};

// Define the context type
type ToastContextType = {
  success: (options: ToastOptions) => void;
  error: (options: ToastOptions) => void;
  warning: (options: ToastOptions) => void;
  info: (options: ToastOptions) => void;
};

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Create the provider component
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();

  const success = useCallback(
    (options: ToastOptions) => {
      toast({
        ...options,
        variant: 'default',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
    },
    [toast]
  );

  const error = useCallback(
    (options: ToastOptions) => {
      toast({
        ...options,
        variant: 'destructive',
      });
    },
    [toast]
  );

  const warning = useCallback(
    (options: ToastOptions) => {
      toast({
        ...options,
        variant: 'default',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      });
    },
    [toast]
  );

  const info = useCallback(
    (options: ToastOptions) => {
      toast({
        ...options,
        variant: 'default',
        className: 'bg-blue-50 border-blue-200 text-blue-800',
      });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
};

// Create the hook to use toast
export const useGlobalToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useGlobalToast must be used within a ToastProvider');
  }
  return context;
};