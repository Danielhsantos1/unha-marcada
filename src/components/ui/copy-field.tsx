"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { Label } from "@/components/ui/label";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-neutral-700">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="text-neutral-400 hover:text-neutral-700"
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
