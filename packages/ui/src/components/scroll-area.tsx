"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@neostack/ui/lib/utils"; // Make sure this path is correct for your project

// Define an interface for the props, including the new viewportRef
interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Optional ref to be passed to the ScrollAreaPrimitive.Viewport element. */
  viewportRef?: React.Ref<HTMLDivElement>;
}

const ScrollArea = React.forwardRef<
  // Type of the element the main ref points to (the Root)
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  // Type of the props the component accepts
  ScrollAreaProps
>(({ className, children, viewportRef, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref} // Forward the main ref to the Root element
    data-slot="scroll-area"
    // Add overflow-hidden as is common practice for scroll area roots
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={viewportRef} // Apply the viewportRef here
      data-slot="scroll-area-viewport"
      // Standard viewport styling: takes full size of root, allows scrolling
      className="rounded-[inherit] w-full h-full"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName; // For better debugging

// ScrollBar using forwardRef as well (good practice)
const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    data-slot="scroll-area-scrollbar"
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        // Standard Shadcn UI styling includes padding for the track
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        // Standard Shadcn UI styling includes padding for the track
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      data-slot="scroll-area-thumb"
      // Thumb styling: relative needed for positioning, rounded, background
      className="relative flex-1 bg-border rounded-full"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName; // For better debugging

export { ScrollArea, ScrollBar };
