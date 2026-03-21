"use client";

import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
        <div className="relative w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
          <ShieldAlert size={35} strokeWidth={2} />
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
        Access Denied
      </h1>

      <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-4 text-sm leading-relaxed">
        You don&apos;t have the required permissions to access this page. Please
        contact your administrator if you believe this is an error.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2 rounded-xl group"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Go Back
        </Button>
        <Button
          onClick={() => router.push("/dashboard")}
          className="gap-2 rounded-xl bg-neutral-900 border-none hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <Home size={16} />
          Dashboard Home
        </Button>
      </div>
    </div>
  );
}
