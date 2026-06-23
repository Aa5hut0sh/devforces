import api from "@/lib/api";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "@/lib/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<{
      success: boolean;
      user: User;
      token: string;
    }>("/auth/login", payload);
    if (typeof window !== "undefined")
      localStorage.setItem("token", data.token);
    return { user: data.user, token: data.token };
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<{
      success: boolean;
      user: User;
      token: string;
    }>("/auth/register", payload);
    if (typeof window !== "undefined")
      localStorage.setItem("token", data.token);
    return { user: data.user, token: data.token };
  },

  async googleLogin(credential: string): Promise<AuthResponse> {
    const { data } = await api.post<{
      success: boolean;
      user: User;
      token: string;
    }>("/auth/google-login", { credential });
    if (typeof window !== "undefined")
      localStorage.setItem("token", data.token);
    return { user: data.user, token: data.token };
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ success: boolean; user: User }>(
      "/auth/me",
    );
    return data.user;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  },
};
