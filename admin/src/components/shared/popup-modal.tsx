import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TPopupModalProps = {
  onConfirm?: () => void;
  loading?: boolean;
  renderModal: (onClose: () => void) => React.ReactNode;
  text: string;
  icon?: React.ReactNode;
  buttonVariant?: "default" | "ai" | "outline" | "secondary" | "ghost";
  className?: string;
};

export default function PopupModal({
  renderModal,
  text,
  icon,
  onConfirm,
  loading,
  buttonVariant = "default",
  className,
}: TPopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);

  return (
    <>
      <Button
        variant={buttonVariant}
        className={cn("text-xs md:text-sm gap-1", className)}
        onClick={() => setIsOpen(true)}
        disabled={loading}
      >
        {icon}
        {text}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <Modal isOpen={isOpen} onClose={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "bg-background p-4 md:px-6 w-full max-w-[95vw] md:max-w-3xl lg:max-w-5xl rounded-xl shadow-xl",
                "overflow-hidden"
              )}
            >
              <ScrollArea className="max-h-[85vh] pr-1">
                {renderModal(onClose)}
              </ScrollArea>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
