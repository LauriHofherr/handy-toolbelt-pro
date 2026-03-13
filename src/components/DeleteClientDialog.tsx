import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  hasAssociatedRecords: boolean;
  onConfirm: () => void;
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  clientName,
  hasAssociatedRecords,
  onConfirm,
}: DeleteClientDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  const canDelete = hasAssociatedRecords ? confirmText === 'DELETE' : true;

  const handleConfirm = () => {
    if (!canDelete) return;
    onConfirm();
    setConfirmText('');
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setConfirmText('');
    onOpenChange(val);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {clientName}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {hasAssociatedRecords ? (
                <>
                  <p>
                    This client has existing jobs and invoices. Deleting them will permanently remove all associated records.
                  </p>
                  <p className="font-medium text-destructive">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm.
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="tap-target"
                    autoFocus
                  />
                </>
              ) : (
                <p>Are you sure you want to delete {clientName}? This cannot be undone.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
