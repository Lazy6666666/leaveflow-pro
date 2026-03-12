import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-apple-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "ios-glass":
          "glass glass-panel border-white/20 bg-white/10 text-foreground shadow-xl hover:border-white/30 dark:glass-dark dark:border-white/10 dark:bg-white/5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const pointerX = useMotionValue(50);
    const pointerY = useMotionValue(50);
    const glare = useMotionTemplate`radial-gradient(circle at ${pointerX}% ${pointerY}%, hsl(var(--glass-highlight) / 0.32), transparent 48%)`;

    if (asChild) {
      const Comp = Slot;
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <motion.button
        className={cn("relative overflow-hidden", buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointerX.set(((event.clientX - rect.left) / rect.width) * 100);
          pointerY.set(((event.clientY - rect.top) / rect.height) * 100);
        }}
        {...props}
      >
        {variant === "ios-glass" ? (
          <>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{ backgroundImage: glare }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 top-px h-px rounded-full bg-white/50 dark:bg-white/25"
            />
          </>
        ) : null}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
