"use client";
import { navGroups, NavGroup } from "@/constants/data";
import { Icons } from "@/components/ui/icons";
import { NavItem } from "@/types";
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Settings,
  User,
  LogOut,
  X,
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
import { cn } from "@/lib/utils";

type TMobileSidebarProps = {
  className?: string;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
};

interface MobileCollapsibleGroupProps {
  group: NavGroup;
  currentPath: string;
  onItemClick: () => void;
}

const MobileCollapsibleGroup = ({ group, currentPath, onItemClick }: MobileCollapsibleGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasActiveItem = group.items.some(item => isRouteActive(item.href, currentPath));

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full justify-between px-3 py-2 h-9 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
          hasActiveItem && "text-primary"
        )}
      >
        <span className="uppercase tracking-wider text-xs">{group.title}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </Button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-1 pl-3"
          >
            {group.items.map((item, index) => (
              <MobileNavItem
                key={index}
                item={item}
                isActive={isRouteActive(item.href, currentPath)}
                onClick={onItemClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MobileNavItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const MobileNavItem = ({ item, isActive, onClick }: MobileNavItemProps) => {
  const iconName = item.icon || "arrowRight";
  const Icon = Icons[iconName] || Icons["arrowRight"];

  return (
    <Link
      to={item.disabled ? "/" : item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
        item.disabled && "cursor-not-allowed opacity-60 pointer-events-none"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary-foreground")} />
      <span className="truncate">{item.title}</span>
    </Link>
  );
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

export default function EnhancedMobileSidebar({
  setSidebarOpen,
  sidebarOpen,
}: TMobileSidebarProps) {
  const location = useLocation();

  const handleItemClick = () => {
    setSidebarOpen(false);
  };

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent 
        side="left" 
        className="flex flex-col p-0 w-80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/95 dark:supports-[backdrop-filter]:bg-background/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <img 
              src="/logoT.png" 
              alt="Dental Management System" 
              className="h-8 w-8 brightness-125" 
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold">DMS</span>
              <span className="text-xs text-muted-foreground">Dental Management System</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-4">
            {navGroups.map((group, index) => (
              <div key={index}>
                <MobileCollapsibleGroup
                  group={group}
                  currentPath={location.pathname}
                  onItemClick={handleItemClick}
                />
                {index < navGroups.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ModeToggle />
          </div>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-3 hover:bg-accent transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">Admin User</span>
                  <span className="text-xs text-muted-foreground">admin@dms.com</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetContent>
    </Sheet>
  );
}