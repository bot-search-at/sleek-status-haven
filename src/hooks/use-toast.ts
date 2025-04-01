
import { toast as sonnerToast, type ToastT, type ToastToDismiss } from "sonner";

// Export the hook for using toast
export const useToast = () => {
  return {
    toast: toast,
    toasts: [] // This matches the structure expected by the Toaster component
  };
};

// Export the toast function with additional variants
export const toast = {
  // Direct methods that can be called
  error: (message: string) => sonnerToast.error(message),
  success: (message: string) => sonnerToast.success(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
  
  // Method to display a generic toast with options
  // This allows for: toast({ title: "Title", description: "Description" })
  // The call signature replicates sonner's toast function
  (props: { title?: string; description?: string; variant?: "default" | "destructive" }) {
    return sonnerToast(props.title || "", {
      description: props.description
    });
  },
  
  // Additional sonner toast methods/properties
  ...sonnerToast
};
