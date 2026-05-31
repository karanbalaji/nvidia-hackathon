// Test mock for @base-ui/react/button — avoids useSyncExternalStore issues
import React from "react";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>{children}</button>
));
Button.displayName = "Button";

