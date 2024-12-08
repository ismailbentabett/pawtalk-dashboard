import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuickAddPetForm } from "@/components/QuickAddPetForm";
import { useToast } from "@/hooks/use-toast";

export function QuickAddPetModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Pet</DialogTitle>
        </DialogHeader>
        <QuickAddPetForm
          onSuccess={() => {
            toast({
              title: "Pet Added",
              description: "The pet has been successfully added.",
              className: "bg-green-50 border-green-200 text-green-800",
            });
            onClose();
          }}
          onError={(error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }}
        />
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAddPetModal;
