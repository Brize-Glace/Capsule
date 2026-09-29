"use client";

import { Plus } from "lucide-react";
import { useApp } from "@/components/app/app-context";
import { Button } from "@/components/ui/button";

export function NewLeaveButton() {
  const { openNewLeave } = useApp();
  return (
    <Button className="primary-action" onClick={() => openNewLeave()}>
      <Plus /> Poser des congés
    </Button>
  );
}
