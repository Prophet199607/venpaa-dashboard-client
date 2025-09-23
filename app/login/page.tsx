"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Image from "next/image";

export default function LoginSplitPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert("Frontend-only demo");
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[40%_60%]">
      {/* Left Side - Brand Section*/}
      <div className="hidden lg:flex bg-white text-neutral-900 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Image
            src="/images/logo4.png"
            alt="Login Illustration"
            width={200}
            height={200}
            className="mx-auto mb-6"
          />
          <h2 className="text-4xl font-semibold leading-tight mb-4">
            Venpa Login
          </h2>
        </div>
      </div>

      {/* Right Side - Login Form*/}
      <div className="flex items-center justify-center p-6 bg-neutral-900 lg:col-span-1">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-lg bg-white">
          <CardHeader className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Login</h1>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
