import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'text-foreground/70',
        emphasis: 'text-foreground font-semibold',
        subtle: 'text-muted-foreground',
        error: 'text-red-500',
        success: 'text-green-600',
        ai: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-semibold',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  animate?: boolean;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, size, animate = false, ...props }, ref) => {

  // For motion.label, only pass motion-specific and valid HTML props
  if (animate) {
    // Extract motion-specific props and filter out conflicting DOM event handlers
    const {
      onAnimationStart,
      onAnimationEnd,
      onDrag,
      onDragEnd,
      onDragStart,
      onDragOver,
      ...restProps
    } = props;

    return (
      <LabelPrimitive.Root asChild>
        <motion.label
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          ref={ref}
          className={cn(labelVariants({ variant, size }), className)}
          {...restProps}
        />
      </LabelPrimitive.Root>
    );
  }

  return (
    <LabelPrimitive.Root asChild>
      <label
        ref={ref}
        className={cn(labelVariants({ variant, size }), className)}
        {...props}
      />
    </LabelPrimitive.Root>
  );
});

Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };
