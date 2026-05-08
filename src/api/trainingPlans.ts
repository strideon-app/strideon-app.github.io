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

export interface WorkoutBlock {
  id: number;
  week_id: number;
  day_of_week: number;
  position: number;
  type: WorkoutType;
  title: string;
  description: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  target_pace_seconds: number | null;
  notes: string | null;
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
  distance_km?: number | null;
  duration_minutes?: number | null;
  target_pace_seconds?: number | null;
  notes?: string | null;
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
