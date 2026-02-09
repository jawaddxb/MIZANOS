"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  BaseButton,
  type BaseButtonProps,
} from "@/components/atoms/buttons/BaseButton";

interface ButtonProps extends BaseButtonProps {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading, leftIcon, rightIcon, children, disabled, className, ...props }, ref) => {
    return (
      <BaseButton
        ref={ref}
        disabled={disabled || loading}
        className={cn(loading && "relative", className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </BaseButton>
    );
  },
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
