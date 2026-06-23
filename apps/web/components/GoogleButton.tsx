"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GoogleButton() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  async function handleSuccess(response: CredentialResponse) {
    if (!response.credential) return;
    setError("");
    try {
      await authService.googleLogin(response.credential);
      await refreshUser();
      router.replace("/");
    } catch {
      setError("Google login failed. Try again.");
    }
  }

  return (
    <div className="mt-4">
      <div className="relative flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">or</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError("Google login failed. Try again.")}
        theme="filled_black"
        size="large"
        width="100%"
        shape="rectangular"
        text="continue_with"
      />

      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5 mt-3">
          {error}
        </p>
      )}
    </div>
  );
}