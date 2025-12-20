"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Mail, Shield, Calendar, Clock } from "lucide-react";

interface UserViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    created_at: string;
    updated_at: string;
  } | null;
}

export function UserViewDialog({ isOpen, onClose, user }: UserViewDialogProps) {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-gradient-to-br from-background to-muted">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary/10 dark:bg-primary/20 animate-pulse" />
          <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-primary/5 dark:bg-primary/10 animate-pulse delay-1000" />
          <div className="absolute right-1/4 bottom-1/4 w-16 h-16 rounded-lg rotate-45 bg-primary/5 dark:bg-primary/10 animate-pulse delay-2000" />
        </div>

        <div className="relative flex flex-col space-y-4 p-2">
          <DialogHeader>
            <DialogTitle className="text-center">User Details</DialogTitle>
          </DialogHeader>

          {/* User Avatar/Icon */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              {/* <p className="text-sm text-muted-foreground">User ID: {user.id}</p> */}
            </div>
          </div>

          {/* Details Panel */}
          <ScrollArea className="w-full max-h-[300px] rounded-lg border bg-card/50 backdrop-blur-sm p-2">
            <div className="space-y-2">
              {/* Email */}
              <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent/30 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Email
                  </div>
                  <div className="text-sm font-semibold text-foreground break-all">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent/30 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Roles
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <span
                          key={index}
                          className="text-sm font-semibold text-foreground break-all"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No roles assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Created At */}
              {/* <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent/30 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Created At
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatDate(user.created_at)}
                  </div>
                </div>
              </div> */}

              {/* Updated At */}
              {/* <div className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent/30 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Last Updated
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatDate(user.updated_at)}
                  </div>
                </div>
              </div> */}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
