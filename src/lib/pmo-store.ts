"use client";

import { create } from "zustand";

export type ViewKey =
  | "overview"
  | "kanban"
  | "list"
  | "bi"
  | "reports"
  | "mytasks"
  | "members";

interface PMOState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  // The "signed-in" perspective. Manager can create tasks; members see their own.
  currentMemberId: string | null;
  isManager: boolean;
  setCurrentMember: (id: string, isManager: boolean) => void;
  // Last task that was updated (to trigger toasts/refreshes)
  taskVersion: number;
  bumpTaskVersion: () => void;
}

export const usePMOStore = create<PMOState>((set) => ({
  view: "overview",
  setView: (view) => set({ view }),
  currentMemberId: null,
  isManager: true,
  setCurrentMember: (currentMemberId, isManager) =>
    set({ currentMemberId, isManager }),
  taskVersion: 0,
  bumpTaskVersion: () => set((s) => ({ taskVersion: s.taskVersion + 1 })),
}));
