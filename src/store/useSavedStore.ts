import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Shape of the saved properties store state.
 */
interface SavedState {
  savedIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
}

/**
 * Global Zustand store that manages the user's "Saved" or "Favorited" properties.
 * It uses the `persist` middleware to automatically save the state to `AsyncStorage`,
 * ensuring saved items survive app restarts.
 */
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
