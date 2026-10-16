"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className = "", sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`data-[state=delayed-open]:opacity-100 data-[state=closed]:opacity-0 z-50 overflow-hidden rounded-md bg-stone-900 px-3 py-1.5 text-xs text-stone-50 shadow-md transition-opacity duration-150 ${className}`}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow className="fill-stone-900" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
