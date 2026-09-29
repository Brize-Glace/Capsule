"use client";

import { FieldHelp } from "./field-help";

type MoneyInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  help?: string;
};

export function MoneyInput({ label, value, onChange, help }: MoneyInputProps) {
  return (
    <label className="field">
      <span>
        {label}
        {help && <FieldHelp text={help} />}
      </span>
      <span className="money-field">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <b>€</b>
      </span>
    </label>
  );
}
