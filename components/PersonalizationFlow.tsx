"use client";

import { useState } from "react";
import type { PersonalizationInput } from "@/lib/validators";

const VIBE_OPTIONS = [
  "Family gathering",
  "Girls' night",
  "Guys' night",
  "Couples",
  "Office party",
  "Road trip",
  "Kids' birthday",
  "College friends",
];

type Step = "age" | "language" | "script" | "location" | "vibe" | "group";

const ALL_STEPS: Step[] = [
  "age",
  "language",
  "script",
  "location",
  "vibe",
  "group",
];

function getActiveSteps(language: string): Step[] {
  return ALL_STEPS.filter((s) => s !== "script" || language !== "English");
}

interface PersonalizationFlowProps {
  onComplete: (data: PersonalizationInput) => void;
}

export default function PersonalizationFlow({
  onComplete,
}: PersonalizationFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isAdult, setIsAdult] = useState<boolean | null>(null);
  const [language, setLanguage] = useState("English");
  const [script, setScript] = useState<"native" | "latin" | undefined>();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [vibe, setVibe] = useState("");
  const [customVibe, setCustomVibe] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const activeSteps = getActiveSteps(language);
  const currentStep = activeSteps[stepIndex];
  const isLastStep = stepIndex === activeSteps.length - 1;

  const canGenerate =
    isAdult !== null &&
    language.trim() !== "" &&
    vibe !== "" &&
    (vibe !== "Custom" || customVibe.trim() !== "");

  function buildResult(): PersonalizationInput {
    return {
      isAdult: isAdult!,
      language: language.trim(),
      script: language !== "English" ? script : undefined,
      country: country.trim() || undefined,
      city: city.trim() || undefined,
      vibe: vibe === "Custom" ? customVibe.trim() : vibe,
      groupDescription: groupDescription.trim() || undefined,
    };
  }

  function handleGenerate() {
    if (!canGenerate) return;
    onComplete(buildResult());
  }

  function advance() {
    if (isLastStep) {
      handleGenerate();
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
      case "location":
        return true;
      case "vibe":
        return vibe !== "" && (vibe !== "Custom" || customVibe.trim() !== "");
      case "group":
        return true;
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
            <input
              type="text"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (e.target.value === "English") setScript(undefined);
              }}
              placeholder="e.g., English, Urdu, Hindi"
              className="w-full max-w-xs rounded-xl border border-foreground/20 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-foreground/50"
            />
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
              {([["native", "Native script"], ["latin", "Latin / Roman letters"]] as const).map(
                ([val, label]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setScript(val);
                      setStepIndex(stepIndex + 1);
                    }}
                    className={`cursor-pointer rounded-full px-8 py-3 text-lg font-medium transition-colors ${
                      script === val
                        ? "bg-foreground text-background"
                        : "border border-foreground/20 hover:bg-foreground/5"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        );

      case "location":
        return (
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold">Where are you all from?</h2>
            <p className="text-foreground/60">
              Optional — helps make prompts culturally relevant
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-foreground/50"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City (optional)"
                className="w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-foreground/50"
              />
            </div>
          </div>
        );

      case "vibe":
        return (
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold">What&apos;s the vibe?</h2>
            <div className="flex max-w-sm flex-wrap justify-center gap-2">
              {[...VIBE_OPTIONS, "Custom"].map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    vibe === v
                      ? "bg-foreground text-background"
                      : "border border-foreground/20 hover:bg-foreground/5"
                  }`}
                >
                  {v === "Custom" ? "Custom..." : v}
                </button>
              ))}
            </div>
            {vibe === "Custom" && (
              <input
                type="text"
                value={customVibe}
                onChange={(e) => setCustomVibe(e.target.value)}
                placeholder="Describe the vibe"
                className="w-full max-w-xs rounded-xl border border-foreground/20 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-foreground/50"
              />
            )}
          </div>
        );

      case "group":
        return (
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold">Tell us about your group</h2>
            <p className="text-center text-sm text-foreground/60">
              Optional — but the more you share, the better the prompts
            </p>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder={`e.g., South Indian Malayali family, big cricket fans, Uncle Raj always burns the rice, our dog Bruno thinks he's in charge`}
              rows={4}
              maxLength={500}
              className="w-full max-w-xs resize-none rounded-xl border border-foreground/20 bg-transparent px-4 py-3 text-base outline-none focus:border-foreground/50"
            />
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

        {!isLastStep && stepIndex > 0 && canGenerate && (
          <button
            onClick={handleGenerate}
            className="cursor-pointer text-sm text-foreground/50 underline underline-offset-2 hover:text-foreground/70"
          >
            Generate now with what I&apos;ve given
          </button>
        )}
      </div>
    </div>
  );
}
