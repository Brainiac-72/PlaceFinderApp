import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SavedState {
  savedIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSaved: (id: string) => 
        set((state) => {
          const isAlreadySaved = state.savedIds.includes(id);
          if (isAlreadySaved) {
            return { savedIds: state.savedIds.filter(savedId => savedId !== id) };
          } else {
            return { savedIds: [...state.savedIds, id] };
          }
        }),
      isSaved: (id: string) => get().savedIds.includes(id),
    }),
    {
      name: 'saved-properties-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
