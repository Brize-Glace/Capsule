"use client";

import { Download, Ellipsis, RotateCcw, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DataActionsProps = {
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
};

/** Backup, restore and reset, at the bottom of the desktop sidebar. */
export function SidebarDataActions({ onExport, onImport, onReset }: DataActionsProps) {
  return (
    <div className="sidebar-data">
      <p>Vos données restent sur cet appareil. Sauvegardez-les de temps en temps.</p>
      <div className="sidebar-data-actions">
        <button onClick={onExport}>
          <Download aria-hidden="true" /> Sauvegarder
        </button>
        <button onClick={onImport}>
          <Upload aria-hidden="true" /> Restaurer
        </button>
      </div>
      <button className="sidebar-reset" onClick={onReset}>
        Tout réinitialiser…
      </button>
    </div>
  );
}

/** Same actions, in a menu of the mobile top bar. */
export function MobileDataMenu({ onExport, onImport, onReset }: DataActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="icon-button" aria-label="Sauvegarde des données">
          <Ellipsis />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="data-menu">
        <DropdownMenuLabel>Données enregistrées sur cet appareil</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onExport}>
          <Download /> Sauvegarder
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onImport}>
          <Upload /> Restaurer une sauvegarde
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onReset}>
          <RotateCcw /> Tout réinitialiser…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
