"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  hideLabel?: boolean;
  menuMinWidth?: number;
};

const INLINE_SELECT_TRIGGER_BASE =
  "flex w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-10";

/** Dropdown must be wide enough for label + check icon even when the trigger is compact. */
const MENU_MIN_WIDTH_PX = 144;

export function SetupInlineSelect({
  label,
  value,
  options,
  placeholder,
  onValueChange,
  triggerClassName,
  onClear,
  hideLabel = false,
  menuMinWidth = MENU_MIN_WIDTH_PX,
}: SetupInlineSelectProps) {
  const [listOpen, setListOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const triggerId = useId();
  const labelId = useId();

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? null;

  useLayoutEffect(() => {
    if (!listOpen || !triggerRef.current) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, menuMinWidth),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [listOpen, menuMinWidth]);

  useEffect(() => {
    if (!listOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setListOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [listOpen]);

  return (
    <div ref={rootRef} className={cn(!hideLabel && "space-y-1.5")}>
      {!hideLabel ? (
        <Label id={labelId} htmlFor={triggerId} className="text-sm font-normal text-slate-500">
          {label}
        </Label>
      ) : null}

      <div className="relative">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-haspopup="listbox"
          aria-labelledby={hideLabel ? undefined : labelId}
          aria-label={hideLabel ? label : undefined}
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

        {listOpen && menuPosition
          ? createPortal(
              <ul
                ref={menuRef}
                id={listId}
                role="listbox"
                aria-label={label}
                style={{
                  position: "fixed",
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                }}
                className="z-50 flex max-h-60 flex-col gap-0.5 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-md ring-1 ring-foreground/10"
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
                          "flex w-full cursor-default items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-hidden select-none hover:bg-slate-100 focus:bg-slate-100",
                          isSelected && "bg-accent text-accent-foreground",
                        )}
                        onClick={() => {
                          onValueChange(option.value);
                          setListOpen(false);
                        }}
                      >
                        <span className="min-w-0 flex-1">{option.label}</span>
                        {isSelected ? (
                          <Check className="size-4 shrink-0 text-slate-900" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
}
