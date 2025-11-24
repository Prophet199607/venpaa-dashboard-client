"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { authApi } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginSplitPage() {
  const router = useRouter();
  const fetched = useRef(false);
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [fetching, setFetching] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      setFetching(true);
      const { data: res } = await authApi.get("/locations");

      if (!res.success) {
        throw new Error(res.message);
      }

      setLocations(res.data);
    } catch (err: any) {
      console.error("Failed to fetch locations:", err);
      toast({
        title: "Failed to load locations",
        description: err.response?.data?.message || "Please try again",
        type: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchLocations();
  }, [fetchLocations]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedLocation) {
      toast({
        title: "Validation Error",
        description: "Please select a location.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.post("/login", {
        name: username,
        password,
      });

      // Save token in localStorage
      const token = response.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("userLocation", selectedLocation);

      // Optional: set a cookie if you use middleware
      document.cookie = `isLoggedIn=true; path=/`;

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Login Failed",
        description:
          error.response?.data?.message ||
          "Please check your credentials and try again.",
        type: "error",
      });
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

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 bg-neutral-900 lg:col-span-1">
        <div className="w-full max-w-md flex flex-col items-center">
          <Card className="w-full border-0 shadow-none lg:shadow-lg bg-white">
            <CardHeader className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold">Login</h1>
            </CardHeader>

            <CardContent className="space-y-6">
              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">
                      Location
                    </Label>
                    <Select
                      value={selectedLocation}
                      onValueChange={setSelectedLocation}
                      required
                      disabled={fetching}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={
                            fetching
                              ? "Loading locations..."
                              : "Select location"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem
                            key={location.loca_code}
                            value={location.loca_code}
                          >
                            {location.loca_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username"
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

          <p className="mt-4 sm:mt-6 text-center text-sm text-gray-400">
            V&nbsp;1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
