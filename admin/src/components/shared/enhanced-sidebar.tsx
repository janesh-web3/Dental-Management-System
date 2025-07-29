  "use client";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { navGroups, NavGroup } from "@/constants/data";
import { Icons } from "@/components/ui/icons";
import { NavItem } from "@/types";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/shared/theme-toggle";

type SidebarProps = {
  className?: string;
};

interface CollapsibleGroupProps {
  group: NavGroup;
  isMinimized: boolean;
  currentPath: string;
}

const CollapsibleGroup = ({ group, isMinimized, currentPath }: CollapsibleGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasActiveItem = group.items.some(item => isRouteActive(item.href, currentPath));

  // Auto-expand groups with active items
  useEffect(() => {
    if (hasActiveItem && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveItem, isExpanded]);

  if (isMinimized) {
    return (
      <div className="space-y-1">
        {group.items.map((item, index) => (
          <NavItemComponent
            key={index}
            item={item}
            isMinimized={true}
            isActive={isRouteActive(item.href, currentPath)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full justify-between px-2 py-1.5 h-8 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
          hasActiveItem && "text-primary"
        )}
      >
        <span className="uppercase tracking-wider">{group.title}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3 w-3" />
        </motion.div>
      </Button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-1"
          >
            {group.items.map((item, index) => (
              <NavItemComponent
                key={index}
                item={item}
                isMinimized={false}
                isActive={isRouteActive(item.href, currentPath)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface NavItemComponentProps {
  item: NavItem;
  isMinimized: boolean;
  isActive: boolean;
}

const NavItemComponent = ({ item, isMinimized, isActive }: NavItemComponentProps) => {
  const iconName = item.icon || "arrowRight";
  const Icon = Icons[iconName] || Icons["arrowRight"];

  const navItem = (
    <Link
      to={item.disabled ? "/" : item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
        item.disabled && "cursor-not-allowed opacity-60 pointer-events-none",
        isMinimized && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary-foreground")} />
      
      {!isMinimized && (
        <>
          <span className="truncate">{item.title}</span>
        </>
      )}
    </Link>
  );

  if (isMinimized) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {navItem}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return navItem;
};

// Helper function to check if route is active
const isRouteActive = (itemHref: string, currentPath: string) => {
  if (currentPath === itemHref) return true;
  
  // Special cases for income and expense routes
  if ((itemHref === "/income" && currentPath === "/finance/income") || 
      (itemHref === "/finance/income" && currentPath === "/income")) {
    return true;
  }
  
  if ((itemHref === "/expense" && currentPath === "/finance/expense") || 
      (itemHref === "/finance/expense" && currentPath === "/expense")) {
    return true;
  }
  
  return false;
};

export default function EnhancedSidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleToggle = () => {
    setIsTransitioning(true);
    toggle();
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <TooltipProvider>
      <motion.nav
        animate={{
          width: isMinimized ? 80 : 220,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className={cn(
          "relative z-20 hidden h-screen flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/95 dark:supports-[backdrop-filter]:bg-background/80 md:flex",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <AnimatePresence mode="wait">
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <img 
                  src="/logoT.png" 
                  alt="Dental Management System" 
                  className="h-8 w-8 brightness-125" 
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">DMS</span>
                  <span className="text-xs text-muted-foreground">Dental System</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className={cn(
                  "h-8 w-8 p-0 hover:bg-accent",
                  isTransitioning && "animate-pulse"
                )}
              >
                {isMinimized ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isMinimized ? "right" : "bottom"}>
              {isMinimized ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-4">
            {navGroups.map((group, index) => (
              <div key={index}>
                <CollapsibleGroup
                  group={group}
                  isMinimized={isMinimized}
                  currentPath={location.pathname}
                />
                {index < navGroups.length - 1 && !isMinimized && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </motion.nav>
    </TooltipProvider>
  );
}