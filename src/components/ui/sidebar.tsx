
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft, PanelLeftClose, PanelRightOpen } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger as SheetPrimitiveTrigger } from "@/components/ui/sheet" // Added SheetTrigger as SheetPrimitiveTrigger
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_WIDTH = "18rem" // For w-72
const SIDEBAR_WIDTH_ICON = "5rem" // For w-20
const SIDEBAR_WIDTH_MOBILE = "18rem" // Standard mobile width
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean // For desktop expanded/collapsed state
  setOpen: (open: boolean) => void
  openMobile: boolean // For mobile off-canvas state
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = false, // Default to collapsed for desktop
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, _setOpenMobile] = React.useState(false)
    const [_openDesktop, _setOpenDesktop] = React.useState(defaultOpen)
    
    const openDesktop = openProp ?? _openDesktop
    
    const setOpenDesktop = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(openDesktop) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpenDesktop(openState)
        }
      },
      [setOpenProp, openDesktop]
    )

    const setOpenMobile = React.useCallback((value: boolean | ((value: boolean) => boolean)) => {
        _setOpenMobile(typeof value === "function" ? value(openMobile) : value);
    }, [openMobile]);

    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobile((current) => !current)
      } else {
        setOpenDesktop((current) => !current)
      }
    }, [isMobile, setOpenDesktop, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = openDesktop ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContextValue>(
      () => ({
        state,
        open: openDesktop,
        setOpen: setOpenDesktop,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, openDesktop, setOpenDesktop, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex h-full w-full", // Changed min-h-svh to h-full
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

// SidebarTrigger for mobile (to be used in Header)
const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof SheetPrimitiveTrigger>, // Use SheetPrimitiveTrigger for mobile
  React.ComponentProps<typeof SheetPrimitiveTrigger> & { "aria-label"?: string }
>(({ className, children, ...props }, ref) => {
  const { isMobile, toggleSidebar, open } = useSidebar(); // Use 'open' for desktop state

  if (isMobile) {
    return (
      <SheetPrimitiveTrigger
        ref={ref}
        data-sidebar="trigger"
        className={cn(className)}
        onClick={(event) => {
          props.onClick?.(event);
          toggleSidebar();
        }}
        {...props}
      >
        {children || <PanelLeft className="h-5 w-5"/>} 
        <span className="sr-only">{props["aria-label"] || "Toggle Mobile Sidebar"}</span>
      </SheetPrimitiveTrigger>
    );
  }

  // Desktop trigger (now used inside SidebarHeader)
  return (
    <Button
      ref={ref as React.Ref<HTMLButtonElement>} // Cast ref for Button
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("hidden md:flex", className)}
      onClick={(event) => {
        props.onClick?.(event);
        toggleSidebar();
      }}
      {...props} // Spread props, but Button specific ones if needed.
      aria-label={props["aria-label"] || "Toggle Desktop Sidebar"}
    >
      {children || (open ? <PanelLeftClose className="h-5 w-5"/> : <PanelRightOpen className="h-5 w-5"/>)}
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";


const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    collapsible?: "icon" | "none";
  }
>(
  (
    {
      side = "left",
      collapsible = "icon",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className={cn(
                "w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground flex flex-col", // ensure flex-col
                 className
            )}
            style={
              {
                "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
            {...props} // Pass original props to SheetContent
          >
            {/* Removed the explicit close button, SheetContent has one by default */}
            {children}
          </SheetContent>
        </Sheet>
      );
    }

    // Desktop Sidebar
    if (collapsible === "none") {
        return (
             <div
                ref={ref}
                data-sidebar="sidebar"
                data-state="expanded" // Always expanded if collapsible is none
                data-collapsible="none"
                className={cn(
                "hidden md:flex h-full flex-col text-sidebar-foreground transition-[width] duration-300 ease-in-out w-[var(--sidebar-width)]",
                className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }


    return (
      <div
        ref={ref}
        data-sidebar="sidebar"
        data-state={state}
        data-collapsible={collapsible}
        className={cn(
          "hidden md:flex h-full flex-col text-sidebar-foreground transition-[width] duration-300 ease-in-out",
          state === "expanded" ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";


const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  const { state, isMobile } = useSidebar();
  return (
    <main
      ref={ref}
      data-variant="inset"
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background transition-[margin-left] duration-300 ease-in-out",
        !isMobile && state === 'expanded' && "md:ml-[var(--sidebar-width)]",
        !isMobile && state === 'collapsed' && "md:ml-[var(--sidebar-width-icon)]",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col", className)} 
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-0.5 mt-auto", className)} 
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn(
        "bg-sidebar-border transition-all duration-300 ease-in-out my-1", 
        state === 'expanded' ? "mx-2 w-auto" : "mx-auto w-3/4", 
        className
      )}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto", 
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col items-start gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative w-full", className)} 
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  cn(
    "peer/menu-button flex w-full items-center rounded-md text-sm outline-none ring-sidebar-ring transition-all duration-300 ease-in-out",
    "text-sidebar-foreground/80 hover:text-primary hover:bg-sidebar-accent/10", 
    "data-[active=true]:text-primary data-[active=true]:bg-primary/10", // Active state with subtle background
    "disabled:pointer-events-none disabled:opacity-50",
    // Desktop expanded state (icon left, text right)
    "group-data-[state=expanded]:flex-row group-data-[state=expanded]:justify-start group-data-[state=expanded]:items-center group-data-[state=expanded]:gap-2.5 group-data-[state=expanded]:h-10 group-data-[state=expanded]:px-3",
    "group-data-[state=expanded]:[&>svg]:size-5 group-data-[state=expanded]:[&>svg]:shrink-0",
    "group-data-[state=expanded]:[&>span:last-child]:max-w-full group-data-[state=expanded]:[&>span:last-child]:leading-tight group-data-[state=expanded]:[&>span:last-child]:truncate",
    // Desktop collapsed state (centered icon)
    "group-data-[state=collapsed]:flex-row group-data-[state=collapsed]:items-center group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:h-12 group-data-[state=collapsed]:w-12 group-data-[state=collapsed]:p-0 group-data-[state=collapsed]:mx-auto group-data-[state=collapsed]:gap-0", 
    "group-data-[state=collapsed]:[&>svg]:m-0 group-data-[state=collapsed]:[&>svg]:size-6" 
  ),
  {
    variants: { 
      variant: { 
        default: "", 
        ghost: "hover:bg-sidebar-accent/10", 
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant, 
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { state, isMobile } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant }), className)}
        {...props}
      />
    )

    if (!tooltip || (state === "expanded" && !isMobile)) { 
      return button
    }
    
    const tooltipContentProps = typeof tooltip === "string" ? { children: <p>{tooltip}</p> } : tooltip;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          className="bg-background text-foreground border-border shadow-md"
          {...tooltipContentProps} 
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  // SidebarClose, // No longer explicitly exported, SheetClose is used inside SheetContent
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  // SidebarTitle, // Not part of this structure
  // SidebarDescription, // Not part of this structure
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInset,
  useSidebar,
}
