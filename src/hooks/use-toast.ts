
import { toast as sonnerToast } from "sonner";
import { useToast as useShadcnToast } from "@/components/ui/toast";

export { useShadcnToast as useToast };

// Re-export the toast function with additional variants
export const toast = {
  ...sonnerToast,
  // Add any custom toast methods here
  error: (message: string) => sonnerToast.error(message),
  success: (message: string) => sonnerToast.success(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
};
