
import { toast as sonnerToast, type ToastT, type ToastToDismiss } from "sonner";

// Export the hook for using toast
export const useToast = () => {
  return {
    toast: toast,
    toasts: [] // This matches the structure expected by the Toaster component
  };
};

// Define a proper interface for our toast function
interface ToastFunction {
  (props: { title?: string; description?: string; variant?: "default" | "destructive" }): void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

// Export the toast function with additional variants
export const toast: ToastFunction = Object.assign(
  // Base function that will be called when using toast({ title, description })
  function(props: { title?: string; description?: string; variant?: "default" | "destructive" }) {
    return sonnerToast(props.title || "", {
      description: props.description
    });
  },
  {
    // Direct methods that can be called
    error: (message: string) => sonnerToast.error(message),
    success: (message: string) => sonnerToast.success(message),
    info: (message: string) => sonnerToast.info(message),
    warning: (message: string) => sonnerToast.warning(message),
    // Additional sonner toast methods/properties
    ...sonnerToast
  }
);
