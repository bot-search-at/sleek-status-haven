
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
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
};

// Create a function for toast
const createToast = (props: ToastProps) => {
  const { title, description, variant = "default", duration = 4000 } = props;
  
  // Play sound effect for different toast types
  playToastSound(variant);
  
  // Set styling based on variant
  let styling = {};
  switch (variant) {
    case "destructive":
      styling = { className: "bg-destructive text-destructive-foreground border-destructive/30" };
      break;
    case "success":
      styling = { className: "bg-status-operational/20 text-status-operational border-status-operational/50" };
      break;
    case "warning":
      styling = { className: "bg-status-degraded/20 text-status-degraded border-status-degraded/50" };
      break;
    case "info":
      styling = { className: "bg-primary/10 text-primary border-primary/30" };
      break;
    default:
      styling = { className: "bg-background text-foreground border-border" };
  }
  
  return sonnerToast(title || "", {
    description,
    duration,
    ...styling,
    position: "top-right",
    closeButton: true,
    style: {
      borderRadius: "0.75rem",
      border: "1px solid",
      animationDuration: "0.5s",
      animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      overflow: "hidden",
      transform: "translateY(0) scale(1)",
      opacity: 1,
      transition: "transform 0.3s, opacity 0.3s"
    }
  });
};

// Play sound effect based on toast type
function playToastSound(variant: string) {
  const audioMap: Record<string, string> = {
    default: "/toast.mp3",
    destructive: "/error.mp3",
    success: "/success.mp3",
    warning: "/warning.mp3",
    info: "/info.mp3"
  };
  
  // Try to play the sound, ignore errors if audio can't play
  const audio = new Audio(audioMap[variant] || audioMap.default);
  audio.volume = 0.2;
  audio.play().catch(() => {});
}

// Export the toast function with additional variants
export const toast = Object.assign(createToast, {
  // Direct methods that can be called
  error: (message: string) => sonnerToast.error(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--destructive))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("destructive"),
    closeButton: true,
    position: "top-right",
  }),
  success: (message: string) => sonnerToast.success(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--status-operational))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("success"),
    closeButton: true,
    position: "top-right",
  }),
  information: (message: string) => sonnerToast.info(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--primary))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("info"),
    closeButton: true,
    position: "top-right",
  }),
  warning: (message: string) => sonnerToast.warning(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--status-degraded))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("warning"),
    closeButton: true,
    position: "top-right",
  }),
  // German translations for common notifications
  fehler: (message: string) => sonnerToast.error(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--destructive))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("destructive"),
    closeButton: true,
    position: "top-right",
  }),
  erfolg: (message: string) => sonnerToast.success(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--status-operational))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("success"),
    closeButton: true,
    position: "top-right",
  }),
  warnung: (message: string) => sonnerToast.warning(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--status-degraded))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("warning"),
    closeButton: true,
    position: "top-right",
  }),
  // Renamed to "information" to avoid duplicate property names
  information: (message: string) => sonnerToast.info(message, {
    style: {
      borderRadius: "0.75rem",
      border: "1px solid hsl(var(--primary))",
      animationDuration: "0.5s",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    onAutoClose: () => playToastSound("info"),
    closeButton: true,
    position: "top-right",
  })
});

// Extend with sonnerToast properties but remove the duplicate 'info' method
const { info: _, ...restSonnerToast } = sonnerToast;
Object.assign(toast, restSonnerToast);
