"use client";

import { useState } from "react";
import type { PersonalizationInput } from "@/lib/validators";

const LANGUAGES = [
  "Arabic",
  "Bengali",
  "English",
  "French",
  "German",
  "Hindi",
  "Indonesian",
  "Japanese",
  "Korean",
  "Chinese",
  "Portuguese",
  "Russian",
  "Spanish",
  "Urdu",
];

type Step = "age" | "language" | "script";

const ALL_STEPS: Step[] = ["age", "language", "script"];

function getActiveSteps(language: string): Step[] {
  return ALL_STEPS.filter((s) => s !== "script" || language !== "English");
}

interface PersonalizationFlowProps {
  onComplete: (data: PersonalizationInput) => void;
  onBack: () => void;
}

export default function PersonalizationFlow({
  onComplete,
  onBack,
}: PersonalizationFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isAdult, setIsAdult] = useState<boolean | null>(null);
  const [language, setLanguage] = useState("English");
  const [script, setScript] = useState<"native" | "latin" | undefined>();

  const activeSteps = getActiveSteps(language);
  const currentStep = activeSteps[stepIndex];
  const isLastStep = stepIndex === activeSteps.length - 1;

  function buildResult(): PersonalizationInput {
    return {
      isAdult: isAdult!,
      language: language.trim(),
      script: language !== "English" ? script : undefined,
    };
  }

  function advance() {
    if (isLastStep) {
      onComplete(buildResult());
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function canAdvance(): boolean {
    switch (currentStep) {
      case "age":
        return isAdult !== null;
      case "language":
        return language.trim() !== "";
      case "script":
        return script !== undefined;
      default:
        return false;
    }
  }

  const autoAdvanceSteps: Step[] = ["age", "script"];
  const showNextButton = !autoAdvanceSteps.includes(currentStep);

  function renderStep() {
    switch (currentStep) {
      case "age":
        return (
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold">Is everyone 18+?</h2>
            <p className="text-foreground/60">
              This helps us set the right tone
            </p>
            <div className="flex gap-4">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => {
                    setIsAdult(val);
                    setStepIndex(stepIndex + 1);
                  }}
                  className={`cursor-pointer rounded-full px-8 py-3 text-lg font-medium transition-colors ${
                    isAdult === val
                      ? "bg-foreground text-background"
                      : "border border-foreground/20 hover:bg-foreground/5"
                  }`}
                >
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        );

      case "language":
        return (
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold">Language for content?</h2>
            <p className="text-foreground/60">
              Prompts will be generated in this language
            </p>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (e.target.value === "English") setScript(undefined);
              }}
              className="w-full max-w-xs appearance-none rounded-xl border border-foreground/20 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-foreground/50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        );

      case "script":
        return (
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold">Script preference?</h2>
            <p className="text-foreground/60">
              How should {language} content be written?
            </p>
            <div className="flex flex-col gap-3">
              {(
                [
                  ["native", "Native script"],
                  ["latin", "Latin / Roman letters"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => {
                    setScript(val);
                    if (isLastStep) {
                      onComplete({
                        isAdult: isAdult!,
                        language: language.trim(),
                        script: val,
                      });
                    } else {
                      setStepIndex(stepIndex + 1);
                    }
                  }}
                  className={`cursor-pointer rounded-full px-8 py-3 text-lg font-medium transition-colors ${
                    script === val
                      ? "bg-foreground text-background"
                      : "border border-foreground/20 hover:bg-foreground/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
      <div className="flex gap-1.5">
        {activeSteps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= stepIndex ? "bg-foreground" : "bg-foreground/20"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center">{renderStep()}</div>

      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        {showNextButton && (
          <button
            onClick={advance}
            disabled={!canAdvance()}
            className="w-full cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-30"
          >
            {isLastStep ? "Generate" : "Next"}
          </button>
        )}
        <button
          onClick={stepIndex === 0 ? onBack : () => setStepIndex(stepIndex - 1)}
          className="cursor-pointer px-4 py-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
        >
          &larr; Back
        </button>
      </div>
    </div>
  );
}
