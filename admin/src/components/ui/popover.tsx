import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 8, children, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <AnimatePresence>
      <PopoverPrimitive.Content
        ref={ref}
        asChild
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'z-50 w-72 rounded-xl border border-border bg-background/70 text-foreground shadow-xl ring-1 ring-muted backdrop-blur-md p-4',
            'transition-all duration-300 ease-in-out focus:outline-none',
            className
          )}
        >
          {children}
        </motion.div>
      </PopoverPrimitive.Content>
    </AnimatePresence>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
