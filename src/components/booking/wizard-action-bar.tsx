"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WizardActionBar({
  onBack,
  backDisabled,
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  primaryType = "button",
  formId,
  onPrimaryClick,
  summary,
}: {
  onBack?: () => void;
  backDisabled?: boolean;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryType?: "button" | "submit";
  formId?: string;
  onPrimaryClick?: () => void;
  summary?: string | null;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-white/95 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        {summary && (
          <p className="truncate text-xs font-medium text-neutral-500">{summary}</p>
        )}
        <div className={cn("flex items-center gap-3", !onBack && "justify-stretch")}>
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={backDisabled}
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <Button
            type={primaryType}
            form={formId}
            onClick={primaryType === "button" ? onPrimaryClick : undefined}
            disabled={primaryDisabled}
            size="lg"
            className="flex-1"
          >
            {primaryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
