'use client'
/**
 * AppTooltip
 *
 * Thin wrapper around the shadcn/Radix Tooltip primitives so call sites
 * don't have to repeat <Tooltip><TooltipTrigger asChild>...</TooltipTrigger>
 * <TooltipContent>...</TooltipContent></Tooltip> everywhere.
 *
 * Usage:
 *   <AppTooltip label="Send message">
 *     <button onClick={onSend}>...</button>
 *   </AppTooltip>
 *
 * Note: the child must be a single element that can accept a ref
 * (a DOM element, or a component using React.forwardRef) since this
 * relies on Radix's `asChild` + Slot pattern.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { ReactNode } from "react";

interface AppTooltipProps {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  disabled?: boolean;
}

export default function AppTooltip({
  label,
  children,
  side = "top",
  align = "center",
  disabled = false,
}: AppTooltipProps) {
  if (disabled) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
