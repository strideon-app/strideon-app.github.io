import { apiClient } from "./client";
import type { CurrentUser, Group } from "./auth";

export type AdminUser = CurrentUser;

export async function listUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>("/users");
  return data;
}

export async function listGroups(): Promise<Group[]> {
  const { data } = await apiClient.get<Group[]>("/groups");
  return data;
}

export async function addUserToGroup(userId: number, groupId: number): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>(`/users/${userId}/groups`, {
    group_id: groupId,
  });
  return data;
}

export async function removeUserFromGroup(
  userId: number,
  groupId: number,
): Promise<AdminUser> {
  const { data } = await apiClient.delete<AdminUser>(`/users/${userId}/groups/${groupId}`);
  return data;
}
