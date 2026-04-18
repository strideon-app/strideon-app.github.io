import { apiClient } from "./client";

export interface Group {
  id: number;
  name: string;
  description: string | null;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  has_password: boolean;
  google_linked: boolean;
  created_at: string;
  groups: Group[];
}

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<CurrentUser> {
  const { data } = await apiClient.post<CurrentUser>("/auth/register", payload);
  return data;
}

export async function loginWithPassword(payload: LoginPayload): Promise<Token> {
  const { data } = await apiClient.post<Token>("/auth/login", payload);
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<Token> {
  const { data } = await apiClient.post<Token>("/auth/google", { id_token: idToken });
  return data;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser>("/auth/me");
  return data;
}
