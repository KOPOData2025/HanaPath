"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "text-sm grid overflow-hidden group",
      // grid-rows trick for smooth height auto transitions
      "transition-[grid-template-rows] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
      // open: 약간 더 느리고 부드러운 easeOutExpo 느낌
      "data-[state=open]:grid-rows-[1fr] data-[state=open]:duration-[560ms] data-[state=open]:ease-[cubic-bezier(0.19,1,0.22,1)]",
      // closed: 조금 더 짧은 시간과 표준 ease
      "data-[state=closed]:grid-rows-[0fr] data-[state=closed]:duration-[380ms] data-[state=closed]:ease-[cubic-bezier(0.4,0,0.2,1)]",
      className
    )}
    {...props}
  >
    <div
      className={cn(
        "min-h-0 overflow-hidden pb-4 pt-0",
        // subtle fade + slide
        "opacity-0 -translate-y-1",
        "transition-opacity transition-transform duration-[440ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        // open: 조금 더 천천히, 더 부드럽게
        "group-data-[state=open]:opacity-100 group-data-[state=open]:translate-y-0 group-data-[state=open]:duration-[520ms] group-data-[state=open]:ease-[cubic-bezier(0.19,1,0.22,1)]",
        // closed: 약간 더 짧고 기본 ease
        "group-data-[state=closed]:duration-[320ms] group-data-[state=closed]:ease-[cubic-bezier(0.4,0,0.2,1)]"
      )}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
