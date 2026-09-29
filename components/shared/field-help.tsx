"use client";

import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** "?" icon next to a label, with an explanation in a tooltip. */
export function FieldHelp({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="help-button" aria-label="En savoir plus">
          <CircleHelp size={15} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 bg-[#142238] text-white">{text}</TooltipContent>
    </Tooltip>
  );
}
