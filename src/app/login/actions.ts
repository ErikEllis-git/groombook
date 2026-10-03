"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession, passwordMatches } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    // Slow down repeated guessing.
    await new Promise((resolve) => setTimeout(resolve, 750));
    return { error: "That password isn't right." };
  }
  await createSession();
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
