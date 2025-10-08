"use client";

import * as React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  type?: ToastType;
  duration?: number;
  action?: React.ReactElement;
  onOpenChange?: (open: boolean) => void;
}

export interface Toast extends Required<Pick<ToastProps, "id">> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: ToastType;
  duration?: number;
  action?: React.ReactElement;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ToastState {
  toasts: Toast[];
}

const TOAST_LIMIT = 8;

type ActionType =
  | "ADD_TOAST"
  | "UPDATE_TOAST"
  | "DISMISS_TOAST"
  | "REMOVE_TOAST";

type Action =
  | {
      type: "ADD_TOAST";
      toast: Toast;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<Toast>;
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: string;
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: string;
    };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration: number) => {
  // Clear existing timeout if any
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId));
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, duration);

  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: ToastState, action: Action): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        // Clear the auto-dismiss timeout when manually dismissed
        if (toastTimeouts.has(toastId)) {
          clearTimeout(toastTimeouts.get(toastId));
          toastTimeouts.delete(toastId);
        }
      } else {
        state.toasts.forEach((toast) => {
          if (toastTimeouts.has(toast.id)) {
            clearTimeout(toastTimeouts.get(toast.id));
            toastTimeouts.delete(toast.id);
          }
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

const listeners: Array<(state: ToastState) => void> = [];

let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

export function toast(props: ToastProps) {
  const id = props.id || genId();

  const icons: Record<ToastType, React.ReactNode> = {
    success: React.createElement(CheckCircle, { className: "h-4 w-4" }),
    error: React.createElement(XCircle, { className: "h-4 w-4" }),
    warning: React.createElement(AlertTriangle, { className: "h-4 w-4" }),
    info: React.createElement(Info, { className: "h-4 w-4" }),
  };

  // Set appropriate durations for each toast type
  const defaultDurations: Record<ToastType, number> = {
    success: 8000,  // 8 seconds
    error: 12000,   // 12 seconds
    warning: 10000, // 10 seconds
    info: 8000,     // 8 seconds
  };

  const type = props.type || "info";
  const duration = props.duration || defaultDurations[type];

  const toastData: Toast = {
    ...props,
    id,
    type,
    duration,
    open: true,
    title: props.title
      ? React.createElement(
          "div",
          { className: "flex items-center gap-2" },
          icons[type],
          props.title
        )
      : undefined,
    onOpenChange: (open: boolean) => {
      if (!open) {
        dispatch({ type: "DISMISS_TOAST", toastId: id });
      }
    },
  };

  dispatch({
    type: "ADD_TOAST",
    toast: toastData,
  });

  // Set auto-dismiss timeout
  addToRemoveQueue(id, duration);

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (props: ToastProps) =>
      dispatch({
        type: "UPDATE_TOAST",
        toast: { ...props, id },
      }),
  };
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}