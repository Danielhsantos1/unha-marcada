"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PixPanel({
  qrCodeBase64,
  pixCopyPaste,
}: {
  qrCodeBase64: string;
  pixCopyPaste: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-[252px] rounded-2xl border border-neutral-200 bg-white p-4">
        <Image
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          width={220}
          height={220}
          unoptimized
          className="h-auto w-full"
        />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <p className="text-center text-xs text-neutral-500">
          Ou copie o código Pix Copia e Cola:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            {pixCopyPaste}
          </code>
          <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
