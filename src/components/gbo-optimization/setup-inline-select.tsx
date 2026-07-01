"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SetupSelectOption = {
  value: string;
  label: string;
};

type SetupInlineSelectProps = {
  label: string;
  value: string | null;
  options: readonly SetupSelectOption[];
  placeholder: string;
  onValueChange: (value: string) => void;
  triggerClassName?: string;
  onClear?: () => void;
};

const INLINE_SELECT_TRIGGER_BASE =
  "flex w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-10";

export function SetupInlineSelect({
  label,
  value,
  options,
  placeholder,
  onValueChange,
  triggerClassName,
  onClear,
}: SetupInlineSelectProps) {
  const [listOpen, setListOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const triggerId = useId();
  const labelId = useId();

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? null;

  useEffect(() => {
    if (!listOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setListOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [listOpen]);

  return (
    <div ref={rootRef} className="space-y-1.5">
      <Label id={labelId} htmlFor={triggerId} className="text-sm font-normal text-slate-500">
        {label}
      </Label>

      <div className="relative">
        <button
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-haspopup="listbox"
          aria-labelledby={labelId}
          className={cn(INLINE_SELECT_TRIGGER_BASE, triggerClassName)}
          onClick={() => setListOpen((current) => !current)}
        >
          <span
            className={cn(
              "flex flex-1 text-left text-sm",
              selectedLabel ? "text-slate-700" : "text-slate-400",
            )}
          >
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {value && onClear ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClear();
              setListOpen(false);
            }}
            className="absolute top-1/2 right-9 z-10 -translate-y-1/2 rounded-sm p-0.5 text-slate-400 transition-colors hover:text-slate-600"
            aria-label="Clear selection"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {listOpen ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="mt-1 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md ring-1 ring-foreground/10"
        >
          {options.map((option) => {
            const isSelected = value === option.value;

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "relative flex w-full cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-left text-sm outline-hidden select-none hover:bg-slate-100 focus:bg-slate-100",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onValueChange(option.value);
                    setListOpen(false);
                  }}
                >
                  {option.label}
                  {isSelected ? (
                    <Check className="absolute right-2 size-4 text-slate-900" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
