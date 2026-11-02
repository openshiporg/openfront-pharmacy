"use client";

import * as React from "react";
import { PlatformSelect, type PlatformSelectOption } from "./PlatformSelect";

type OptionProps = { value?: string; disabled?: boolean; children?: React.ReactNode };

function text(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return text(node.props.children);
  return "";
}

/** `<option>` children (mapped arrays, conditionals and fragments included) as PlatformSelect options. */
export function optionsFromChildren(children: React.ReactNode): PlatformSelectOption[] {
  const out: PlatformSelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<OptionProps>(child)) return;
    if (child.type === React.Fragment) { out.push(...optionsFromChildren(child.props.children)); return; }
    const label = text(child.props.children);
    out.push({ value: child.props.value ?? label, label, disabled: child.props.disabled });
  });
  return out;
}

/**
 * Drop-in for a controlled native `<select>` with `<option>` children: same options,
 * rendered as the platform popover list so phones get the admin's own type and touch targets.
 */
export function OptionSelect({ value, onValueChange, children, placeholder, ...rest }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const options = optionsFromChildren(children);
  const empty = options.find((option) => option.value === "");
  return <PlatformSelect value={value} onValueChange={onValueChange} options={options} placeholder={placeholder ?? empty?.label ?? "Select"} {...rest} />;
}
