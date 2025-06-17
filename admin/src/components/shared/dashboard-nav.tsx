"use client";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { useSidebar } from "@/hooks/use-sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

interface DashboardNavProps {
  items: NavItem[];
  setOpen?: Dispatch<SetStateAction<boolean>>;
  isMobileNav?: boolean;
}

export default function DashboardNav({
  items,
  setOpen,
  isMobileNav = false,
}: DashboardNavProps) {
  const location = useLocation();
  const path = location.pathname;
  const { isMinimized } = useSidebar();

  if (!items?.length) {
    return null;
  }

  // Function to check if route is active
  const isRouteActive = (itemHref: string) => {
    // Exact match
    if (path === itemHref) {
      return true;
    }
    
    // Special case for income routes
    if ((itemHref === "/income" && path === "/finance/income") || 
        (itemHref === "/finance/income" && path === "/income")) {
      return true;
    }
    
    // Special case for expense routes
    if ((itemHref === "/expense" && path === "/finance/expense") || 
        (itemHref === "/finance/expense" && path === "/expense")) {
      return true;
    }
    
    return false;
  };

  return (
    <nav className="grid items-start gap-2">
      <TooltipProvider>
        {items.map((item, index) => {
          // Use a fallback icon if the specified icon doesn't exist
          const iconName = item.icon || "arrowRight";
          const Icon = Icons[iconName] || Icons["arrowRight"];
          const isActive = isRouteActive(item.href);
          
          return (
            item.href && (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.disabled ? "/" : item.href}
                    className={cn(
                      "flex items-center gap-2 overflow-hidden rounded-md py-2 text-sm font-medium hover:text-muted-foreground",
                      isActive
                        ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                        : "transparent",
                      item.disabled && "cursor-not-allowed opacity-80"
                    )}
                    onClick={() => {
                      if (setOpen) setOpen(false);
                    }}
                  >
                    <Icon className={`ml-2.5 size-5`} />

                    {isMobileNav || (!isMinimized && !isMobileNav) ? (
                      <span className="mr-2 truncate">{item.title}</span>
                    ) : (
                      ""
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  align="center"
                  side="right"
                  sideOffset={8}
                  className={!isMinimized ? "hidden" : "inline-block"}
                >
                  {item.title}
                </TooltipContent>
              </Tooltip>
            )
          );
        })}
      </TooltipProvider>
    </nav>
  );
}
