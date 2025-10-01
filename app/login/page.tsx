"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import Image from "next/image";
import { locations } from "@/lib/data";
import { useRouter } from "next/navigation";
import api from "@/utils/api"; // import your api.ts

export default function LoginSplitPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!location) {
      alert("Please select a location.");
      return;
    }

    setLoading(true);
    try {
      // Call Laravel API login
      const response = await api.post("/login", {
        name: username, // assuming Laravel login uses 'email'
        password,
      });

      // Save token in localStorage
      const token = response.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("userLocation", location);

      // Optional: set a cookie if you use middleware
      document.cookie = `isLoggedIn=true; path=/`;

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location
                  </Label>
                  <Select value={location} onValueChange={setLocation} required>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.locCode}>
                          {loc.locName} - {loc.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
