"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-lg",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
