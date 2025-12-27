import { create } from 'zustand';

type ToastItem = {
  id: string;
  message: string;
  duration?: number;
};

type ToastStore = {
  toasts: ToastItem[];
  add: (message: string, duration?: number) => void;
  remove: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, duration) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: `${Date.now()}`,
          message,
          ...(duration !== undefined && { duration }),
        },
      ],
    })),
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const useToast = () => {
  const { toasts, add, remove } = useToastStore();
  return { toasts, add, remove };
};
