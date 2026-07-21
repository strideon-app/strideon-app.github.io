import {
  DURATION_TYPE_LABELS,
  STEP_TYPE_LABELS,
  type ExecutableStep,
  type WorkoutStep,
} from "@/api/trainingPlans";

import { formatPace } from "./pace";

function formatDuration(step: ExecutableStep): string | null {
  switch (step.duration_type) {
    case "LAP_BUTTON":
      return "Lap";
    case "TIME":
      if (step.duration_value == null) return null;
      return formatDurationSeconds(step.duration_value);
    case "DISTANCE":
      if (step.duration_value == null) return null;
      return formatDistanceMeters(step.duration_value);
    case "CALORIES":
      if (step.duration_value == null) return null;
      return `${step.duration_value} kcal`;
    case "HEART_RATE":
      if (step.duration_value == null) return null;
      return `${step.duration_value} bpm`;
  }
  return null;
}

function formatTarget(step: ExecutableStep): string | null {
  switch (step.target_type) {
    case "NO_TARGET":
      return null;
    case "PACE":
      if (step.target_value_one != null && step.target_value_two != null) {
        return `${formatPace(step.target_value_one)}–${formatPace(step.target_value_two)}/km`;
      }
      if (step.target_value_one != null) return `${formatPace(step.target_value_one)}/km`;
      return "Pace";
    case "CADENCE":
      if (step.target_value_one != null && step.target_value_two != null) {
        return `${step.target_value_one}–${step.target_value_two} spm`;
      }
      return "Cadência";
    case "HEART_RATE_ZONE":
      return step.target_value_one != null ? `Zona FC ${step.target_value_one}` : "Zona FC";
    case "HEART_RATE_CUSTOM":
      if (step.target_value_one != null && step.target_value_two != null) {
        return `${step.target_value_one}–${step.target_value_two} bpm`;
      }
      return "FC personalizada";
    case "POWER_ZONE":
      return step.target_value_one != null
        ? `Zona Pot. ${step.target_value_one}`
        : "Zona Potência";
    case "POWER_CUSTOM":
      if (step.target_value_one != null && step.target_value_two != null) {
        return `${step.target_value_one}–${step.target_value_two} W`;
      }
      return "Potência personalizada";
  }
  return null;
}

export function executableStepSummary(step: ExecutableStep): string {
  const parts: string[] = [STEP_TYPE_LABELS[step.step_type]];
  const duration = formatDuration(step);
  if (duration) parts.push(duration);
  const target = formatTarget(step);
  if (target) parts.push(target);
  return parts.join(" · ");
}

export function executableStepShortSummary(step: ExecutableStep): string {
  const parts: string[] = [];
  const duration = formatDuration(step);
  if (duration && duration !== "Lap") parts.push(duration);
  const target = formatTarget(step);
  if (target) parts.push(target);
  if (parts.length === 0) parts.push(DURATION_TYPE_LABELS[step.duration_type]);
  return parts.join(" · ");
}

export function blockSummary(steps: WorkoutStep[]): string {
  const fragments: string[] = [];
  for (const step of steps) {
    if (step.kind === "EXECUTABLE") {
      fragments.push(`${STEP_TYPE_LABELS[step.step_type]} ${formatDuration(step) ?? ""}`.trim());
    } else {
      const inner = step.children
        .map((c) => `${STEP_TYPE_LABELS[c.step_type]} ${formatDuration(c) ?? ""}`.trim())
        .join(" + ");
      fragments.push(`${step.repeat_count}× (${inner})`);
    }
  }
  return fragments.filter(Boolean).join(" · ");
}

function formatDurationSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60);
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}min`;
  return `${minutes}min ${seconds}s`;
}

function formatDistanceMeters(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return Number.isInteger(km) ? `${km} km` : `${km.toFixed(2)} km`;
  }
  return `${meters} m`;
}
