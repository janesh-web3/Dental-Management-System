import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground ring-transparent shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground ring-transparent',
        destructive: 'bg-destructive text-white ring-transparent shadow',
        outline: 'bg-transparent text-foreground ring-border',
        success: 'bg-green-500 text-white ring-green-400/50',
        warning: 'bg-yellow-400 text-black ring-yellow-500/40',
        info: 'bg-blue-500 text-white ring-blue-400/50',
        glass: 'bg-white/10 text-white ring-white/20 backdrop-blur-md',
        ai: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white ring-0 shadow',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

import type { HTMLMotionProps } from 'framer-motion';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  animate?: boolean;
  motionProps?: HTMLMotionProps<'span'>;
}

function Badge({ className, variant, animate = false, motionProps, ...props }: BadgeProps) {
  if (animate) {
    return (
      <motion.span
        className={cn(badgeVariants({ variant }), className)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        {...motionProps}
      >
        {props.children}
      </motion.span>
    );
  }

  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
