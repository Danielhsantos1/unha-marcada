import { cn } from "@/lib/utils";

const STEP_LABELS = ["Serviço", "Data", "Horário", "Seus dados", "Resumo"];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mx-auto flex w-full max-w-xl items-center justify-between px-2">
      {STEP_LABELS.map((label, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {index > 0 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    isDone || isActive ? "bg-rose-400" : "bg-neutral-200",
                  )}
                />
              )}
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isDone
                    ? "bg-rose-500 text-white"
                    : isActive
                      ? "border-2 border-rose-500 bg-white text-rose-600"
                      : "border border-neutral-300 bg-white text-neutral-400",
                )}
              >
                {step}
              </span>
              {index < STEP_LABELS.length - 1 && (
                <div
                  className={cn("h-px flex-1", isDone ? "bg-rose-400" : "bg-neutral-200")}
                />
              )}
            </div>
            <span
              className={cn(
                "hidden text-[11px] sm:block",
                isActive ? "font-medium text-rose-600" : "text-neutral-400",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
