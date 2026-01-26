import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export const Button = React.forwardRef(
    ({ className, variant = "primary", size = "default", isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent active:scale-[0.98]",
            secondary: "bg-secondary text-secondary-foreground border border-input hover:bg-secondary/80 shadow-sm active:scale-[0.98]",
            ghost: "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm active:scale-[0.98]",
            outline: "bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground",
        };

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-8 px-3 text-xs",
            lg: "h-12 px-8 text-lg",
            icon: "h-10 w-10 p-2 flex items-center justify-center",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
