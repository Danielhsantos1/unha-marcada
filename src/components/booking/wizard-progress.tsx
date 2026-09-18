import { cn } from "@/lib/utils";

const STEP_LABELS = ["Serviço", "Data", "Horário", "Seus dados", "Resumo"];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  const total = STEP_LABELS.length;
  const label = STEP_LABELS[currentStep - 1];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs font-medium text-neutral-500">
        <span>
          Passo {currentStep} de {total}
        </span>
        <span className="text-rose-600">{label}</span>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={total}>
        {STEP_LABELS.map((stepLabel, index) => {
          const step = index + 1;
          const isDone = step < currentStep;
          const isActive = step === currentStep;
          return (
            <div
              key={stepLabel}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                isDone || isActive ? "bg-rose-500" : "bg-neutral-200",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
