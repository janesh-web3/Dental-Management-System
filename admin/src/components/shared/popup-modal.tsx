import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

type TPopupModalProps = {
  onConfirm?: () => void;
  loading?: boolean;
  renderModal: (onClose: () => void) => React.ReactNode;
  text: string;
  buttonVariant?: "default" | "ai" | "outline" | "secondary" | "ghost";
  icon: any;
};
export default function PopupModal({
  renderModal,
  text,
  icon,
  buttonVariant = "default",
}: TPopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  return (
    <>
      <Button variant={buttonVariant} className="text-xs md:text-sm" onClick={() => setIsOpen(true)}>
        {icon} {text}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className={
          "!bg-background !px-1 w-full min-w-[300px] max-w-[1300px] overflow-y-auto"
        }
      >
        <ScrollArea className="max-h-[90vh] px-2 overflow-y-auto ">
          {renderModal(onClose)}
        </ScrollArea>
      </Modal>
    </>
  );
}
