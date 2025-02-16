'use client';

import * as React from 'react';
import { toast as sonnerToast } from "sonner";

const TOAST_LIMIT = 1;

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

type State = {
  toasts: ToastProps[];
};

let memoryState: State = { toasts: [] };
const listeners: ((state: State) => void)[] = [];

function dispatch(state: State) {
  memoryState = state;
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ title, description, variant = "default" }: ToastProps) {
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
    });
  } else {
    sonnerToast(title, {
      description,
    });
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

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
    dismiss: () => {
      dispatch({ ...memoryState, toasts: [] });
    },
  };
}

export { useToast, toast };



