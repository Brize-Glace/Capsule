"use client";

import { Download, ShieldAlert, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ResetDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onReset: () => void;
  onBackupAndReset: () => void;
};

export function ResetDialog({ open, setOpen, onReset, onBackupAndReset }: ResetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="reset-dialog">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <ShieldAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Tout remettre à zéro ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les emplois et leurs compteurs, les congés planifiés, le budget et les dépenses enregistrés sur cet
            appareil seront effacés. Sans sauvegarde, c’est définitif.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="reset-actions">
          <AlertDialogCancel>Non, conserver</AlertDialogCancel>
          <AlertDialogAction variant="outline" onClick={onBackupAndReset}>
            <Download /> Sauvegarder puis effacer
          </AlertDialogAction>
          <AlertDialogAction variant="destructive" onClick={onReset}>
            <Trash2 /> Tout effacer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
