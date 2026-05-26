import { create } from "zustand";

interface UIState {
  apiKeyModalOpen: boolean;
  hasApiKey: boolean;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;
  setHasApiKey: (b: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  apiKeyModalOpen: false,
  hasApiKey: false,
  openApiKeyModal: () => set({ apiKeyModalOpen: true }),
  closeApiKeyModal: () => set({ apiKeyModalOpen: false }),
  setHasApiKey: (hasApiKey) => set({ hasApiKey }),
}));
