import { apiClient } from "./client";

export type WorkoutType =
  | "LONG_RUN"
  | "INTERVAL"
  | "TEMPO_RUN"
  | "EASY_RUN"
  | "RECOVERY"
  | "REST"
  | "STRENGTH"
  | "FREE";

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  LONG_RUN: "Longo",
  INTERVAL: "Intervalado",
  TEMPO_RUN: "Ritmado",
  EASY_RUN: "Rodagem",
  RECOVERY: "Regenerativo",
  REST: "Descanso",
  STRENGTH: "Fortalecimento",
  FREE: "Livre",
};

export const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  LONG_RUN: "blue",
  INTERVAL: "red",
  TEMPO_RUN: "yellow",
  EASY_RUN: "teal",
  RECOVERY: "green",
  REST: "gray",
  STRENGTH: "violet",
  FREE: "orange",
};

export type WorkoutStepType =
  | "WARMUP"
  | "RUN"
  | "WALK"
  | "RECOVERY"
  | "REST"
  | "COOLDOWN"
  | "OTHER";

export const STEP_TYPE_LABELS: Record<WorkoutStepType, string> = {
  WARMUP: "Aquecimento",
  RUN: "Corrida",
  WALK: "Caminhada",
  RECOVERY: "Recuperação",
  REST: "Descanso",
  COOLDOWN: "Desaquecimento",
  OTHER: "Outros",
};

export const STEP_TYPE_COLORS: Record<WorkoutStepType, string> = {
  WARMUP: "orange",
  RUN: "blue",
  WALK: "cyan",
  RECOVERY: "green",
  REST: "gray",
  COOLDOWN: "indigo",
  OTHER: "grape",
};

export type WorkoutDurationType =
  | "TIME"
  | "DISTANCE"
  | "LAP_BUTTON"
  | "CALORIES"
  | "HEART_RATE";

export const DURATION_TYPE_LABELS: Record<WorkoutDurationType, string> = {
  TIME: "Tempo",
  DISTANCE: "Distância",
  LAP_BUTTON: "Pressionar botão Lap",
  CALORIES: "Calorias",
  HEART_RATE: "Freq. cardíaca",
};

export type WorkoutTargetType =
  | "NO_TARGET"
  | "PACE"
  | "CADENCE"
  | "HEART_RATE_ZONE"
  | "HEART_RATE_CUSTOM"
  | "POWER_ZONE"
  | "POWER_CUSTOM";

export const TARGET_TYPE_LABELS: Record<WorkoutTargetType, string> = {
  NO_TARGET: "Sem objetivo",
  PACE: "Ritmo",
  CADENCE: "Cadência",
  HEART_RATE_ZONE: "Zona de frequência cardíaca",
  HEART_RATE_CUSTOM: "Frequência cardíaca personalizada",
  POWER_ZONE: "Zona de potência",
  POWER_CUSTOM: "Potência personalizada",
};

export interface ExecutableStep {
  kind: "EXECUTABLE";
  id?: number;
  step_type: WorkoutStepType;
  notes: string | null;
  duration_type: WorkoutDurationType;
  duration_value: number | null;
  target_type: WorkoutTargetType;
  target_value_one: number | null;
  target_value_two: number | null;
}

export interface RepeatStep {
  kind: "REPEAT";
  id?: number;
  repeat_count: number;
  children: ExecutableStep[];
}

export type WorkoutStep = ExecutableStep | RepeatStep;

export interface WorkoutBlock {
  id: number;
  week_id: number;
  day_of_week: number;
  position: number;
  type: WorkoutType;
  title: string;
  description: string | null;
  steps: WorkoutStep[];
}

export interface PlanWeek {
  id: number;
  week_number: number;
  blocks: WorkoutBlock[];
}

export interface TrainingPlanSummary {
  id: number;
  distance_km: number;
  target_pace_seconds: number;
  level: number;
  title: string;
  description: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingPlanDetail extends TrainingPlanSummary {
  weeks: PlanWeek[];
}

export interface TrainingPlanCreatePayload {
  distance_km: number;
  target_pace_seconds: number;
  level: number;
  title: string;
  description?: string | null;
  published?: boolean;
}

export interface TrainingPlanUpdatePayload {
  title?: string;
  description?: string | null;
  published?: boolean;
}

export interface WorkoutBlockPayload {
  day_of_week: number;
  position?: number;
  type: WorkoutType;
  title: string;
  description?: string | null;
  steps?: WorkoutStep[];
}

export async function listPlans(): Promise<TrainingPlanSummary[]> {
  const { data } = await apiClient.get<TrainingPlanSummary[]>("/admin/plans");
  return data;
}

export async function getPlan(planId: number): Promise<TrainingPlanDetail> {
  const { data } = await apiClient.get<TrainingPlanDetail>(`/admin/plans/${planId}`);
  return data;
}

export async function createPlan(
  payload: TrainingPlanCreatePayload,
): Promise<TrainingPlanDetail> {
  const { data } = await apiClient.post<TrainingPlanDetail>("/admin/plans", payload);
  return data;
}

export async function updatePlan(
  planId: number,
  payload: TrainingPlanUpdatePayload,
): Promise<TrainingPlanDetail> {
  const { data } = await apiClient.patch<TrainingPlanDetail>(
    `/admin/plans/${planId}`,
    payload,
  );
  return data;
}

export async function deletePlan(planId: number): Promise<void> {
  await apiClient.delete(`/admin/plans/${planId}`);
}

export async function createBlock(
  planId: number,
  weekNumber: number,
  payload: WorkoutBlockPayload,
): Promise<WorkoutBlock> {
  const { data } = await apiClient.post<WorkoutBlock>(
    `/admin/plans/${planId}/weeks/${weekNumber}/blocks`,
    payload,
  );
  return data;
}

export async function updateBlock(
  blockId: number,
  payload: Partial<WorkoutBlockPayload>,
): Promise<WorkoutBlock> {
  const { data } = await apiClient.patch<WorkoutBlock>(
    `/admin/plans/blocks/${blockId}`,
    payload,
  );
  return data;
}

export async function deleteBlock(blockId: number): Promise<void> {
  await apiClient.delete(`/admin/plans/blocks/${blockId}`);
}

export function defaultExecutableStep(stepType: WorkoutStepType): ExecutableStep {
  return {
    kind: "EXECUTABLE",
    step_type: stepType,
    notes: null,
    duration_type: "LAP_BUTTON",
    duration_value: null,
    target_type: "NO_TARGET",
    target_value_one: null,
    target_value_two: null,
  };
}

export function defaultRepeatStep(): RepeatStep {
  return {
    kind: "REPEAT",
    repeat_count: 2,
    children: [defaultExecutableStep("RUN"), defaultExecutableStep("RECOVERY")],
  };
}

export function defaultWorkoutSteps(): WorkoutStep[] {
  return [
    defaultExecutableStep("WARMUP"),
    defaultExecutableStep("RUN"),
    defaultExecutableStep("COOLDOWN"),
  ];
}
