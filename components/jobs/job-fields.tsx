"use client";

import { FieldHelp } from "@/components/shared/field-help";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDays } from "@/lib/format";
import { partialConfig, WEEK_DAYS, workDaysLabel } from "@/lib/leave-rules";
import type { CountMode, PartialFields, PartialRule, WorkType } from "@/lib/types";

// Form fields shared by the "add" and "edit" job dialogs.

export function ContractTypeSelect({ value, onChange }: { value: WorkType; onChange: (type: WorkType) => void }) {
  return (
    <label className="field">
      <span>Type de contrat</span>
      <Select value={value} onValueChange={(v) => onChange(v as WorkType)}>
        <SelectTrigger className="select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="totalTime">Temps plein</SelectItem>
          <SelectItem value="partial">Temps partiel</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );
}

type CountModeSelectProps = { value: CountMode; onChange: (mode: CountMode) => void; help: string };

export function CountModeSelect({ value, onChange, help }: CountModeSelectProps) {
  return (
    <label className="field">
      <span>
        Décompte hebdomadaire <FieldHelp text={help} />
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as CountMode)}>
        <SelectTrigger className="select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ouvres">Jours ouvrés (5 / semaine)</SelectItem>
          <SelectItem value="ouvrables">Jours ouvrables (6 / semaine)</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
  placeholder?: string;
};

export function TextField({ label, value, onChange, type = "text", placeholder }: TextFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="form-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

type NumberFieldProps = {
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  step?: string;
  min?: string;
  className?: string;
};

export function NumberField({ label, value, onChange, step, min, className = "form-input" }: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className={className}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

const WORK_DAY_PRESETS = [
  { label: "Week-end", days: [6, 0] },
  { label: "Lun–Ven", days: [1, 2, 3, 4, 5] },
  { label: "Lun–Sam", days: [1, 2, 3, 4, 5, 6] },
];

/** Worked days and counting rule of a partial-time job. */
export function PartialRuleFields({ job, onChange }: { job: PartialFields; onChange: (patch: PartialFields) => void }) {
  const config = partialConfig(job);
  const workDays = config.workDays;
  const toggleDay = (day: number) =>
    onChange({ workDays: workDays.includes(day) ? workDays.filter((d) => d !== day) : [...workDays, day] });

  const plural = config.dayCost > 1 ? "s" : "";
  const preview =
    config.rule === "week"
      ? `Poser des congés qui touchent ${workDaysLabel(workDays)} d’une même semaine retire ${fmtDays(config.weekCost)} jours.`
      : `Chaque jour travaillé posé (${workDaysLabel(workDays)}) retire ${fmtDays(config.dayCost)} jour${plural}.`;

  return (
    <div className="partial-rule">
      <div className="field">
        <span>
          Jours travaillés{" "}
          <FieldHelp text="Seuls ces jours sont décomptés quand vous posez des congés sur cet emploi." />
        </span>
        <div className="weekday-toggle">
          {WEEK_DAYS.map((day) => (
            <button
              type="button"
              key={day.value}
              aria-label={day.label}
              aria-pressed={workDays.includes(day.value)}
              onClick={() => toggleDay(day.value)}
            >
              {day.short}
            </button>
          ))}
          <span className="weekday-presets">
            {WORK_DAY_PRESETS.map((preset) => (
              <button type="button" key={preset.label} onClick={() => onChange({ workDays: preset.days })}>
                {preset.label}
              </button>
            ))}
          </span>
        </div>
        {!workDays.length && <small className="field-error">Choisissez au moins un jour.</small>}
      </div>

      <div className="two-fields">
        <label className="field">
          <span>Mode de décompte</span>
          <Select value={config.rule} onValueChange={(v) => onChange({ partialRule: v as PartialRule })}>
            <SelectTrigger className="select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Forfait par semaine travaillée</SelectItem>
              <SelectItem value="day">Par jour travaillé posé</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {config.rule === "week" ? (
          <NumberField
            label={
              <>
                Jours retirés par semaine{" "}
                <FieldHelp text="Ex. CDI week-end : poser un samedi et/ou un dimanche retire 6 jours." />
              </>
            }
            min="0"
            step="0.5"
            value={config.weekCost}
            onChange={(v) => onChange({ weekendCost: v })}
          />
        ) : (
          <NumberField
            label="Jours retirés par jour travaillé"
            min="0"
            step="0.5"
            value={config.dayCost}
            onChange={(v) => onChange({ dayCost: v })}
          />
        )}
      </div>

      {workDays.length > 0 && <p className="rule-preview">{preview}</p>}
    </div>
  );
}

/** Small "L M M J V S D" strip with the worked days highlighted. */
export function WorkDaysBadges({ days }: { days: number[] }) {
  return (
    <span className="workday-badges" aria-label={`Jours travaillés : ${workDaysLabel(days)}`}>
      {WEEK_DAYS.map((day) => (
        <i key={day.value} className={days.includes(day.value) ? "on" : ""}>
          {day.short}
        </i>
      ))}
    </span>
  );
}
