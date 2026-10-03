import type { Metadata } from "next";
import { business } from "@/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Owner login" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <h1 className="text-xl font-bold text-stone-900">Owner dashboard</h1>
        <p className="mt-1 mb-6 text-sm text-stone-600">{business.name}</p>
        <LoginForm />
      </div>
    </main>
  );
}
