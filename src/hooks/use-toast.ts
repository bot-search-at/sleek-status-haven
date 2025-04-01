
import { toast as sonnerToast } from "sonner";
import { useToast as useSonnerToast } from "sonner";

// Export the hook for using toast
export const useToast = () => {
  return {
    toast: toast,
    toasts: [] // This matches the structure expected by the Toaster component
  };
};

// Export the toast function with additional variants
export const toast = {
  ...sonnerToast,
  // Add any custom toast methods here
  error: (message: string) => sonnerToast.error(message),
  success: (message: string) => sonnerToast.success(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
};
