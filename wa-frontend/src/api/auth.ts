import { post, get } from "./client"
import type { User } from "../types"

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>("/api/v1/auth/login", { email, password })
}

export function getMe(): Promise<User> {
  return get<User>("/api/v1/auth/me")
}
