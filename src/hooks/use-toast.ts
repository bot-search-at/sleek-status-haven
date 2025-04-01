
import { toast as sonnerToast } from "sonner";

// Export the hook for using toast
export const useToast = () => {
  return {
    toast,
    toasts: [] // This matches the structure expected by the Toaster component
  };
};

// Define interface for toast function
type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

// Create a function for toast
const createToast = (props: ToastProps) => {
  return sonnerToast(props.title || "", {
    description: props.description,
    className: props.variant === "destructive" ? "bg-destructive text-destructive-foreground" : ""
  });
};

// Export the toast function with additional variants
export const toast = Object.assign(createToast, {
  // Direct methods that can be called
  error: (message: string) => sonnerToast.error(message),
  success: (message: string) => sonnerToast.success(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
  ...sonnerToast
});
