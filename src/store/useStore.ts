import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LearningMode, BodyPart, UnsplashImage } from '../types';

interface AppState {
  // UI State
  mode: LearningMode;
  setMode: (mode: LearningMode) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Image State
  currentImage: UnsplashImage | null;
  setCurrentImage: (image: UnsplashImage | null) => void;

  // Learning State
  selectedBodyPart: BodyPart | null;
  setSelectedBodyPart: (part: BodyPart | null) => void;
  revealedParts: Set<string>;
  toggleRevealPart: (partId: string) => void;
  revealAllParts: () => void;
  hideAllParts: () => void;

  // Quiz State
  quizScore: number;
  quizTotal: number;
  incrementScore: () => void;
  incrementTotal: () => void;
  resetQuiz: () => void;

  // Progress State
  masteredParts: Set<string>;
  markAssMastered: (partId: string) => void;
  studyTime: number;
  addStudyTime: (seconds: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // UI State
      mode: 'study',
      setMode: (mode) => set({ mode }),
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Image State
      currentImage: null,
      setCurrentImage: (image) => set({ currentImage: image }),

      // Learning State
      selectedBodyPart: null,
      setSelectedBodyPart: (part) => set({ selectedBodyPart: part }),
      revealedParts: new Set(),
      toggleRevealPart: (partId) =>
        set((state) => {
          const newRevealed = new Set(state.revealedParts);
          if (newRevealed.has(partId)) {
            newRevealed.delete(partId);
          } else {
            newRevealed.add(partId);
          }
          return { revealedParts: newRevealed };
        }),
      revealAllParts: () =>
        set({ revealedParts: new Set(['all']) }),
      hideAllParts: () =>
        set({ revealedParts: new Set() }),

      // Quiz State
      quizScore: 0,
      quizTotal: 0,
      incrementScore: () => set((state) => ({ quizScore: state.quizScore + 1 })),
      incrementTotal: () => set((state) => ({ quizTotal: state.quizTotal + 1 })),
      resetQuiz: () => set({ quizScore: 0, quizTotal: 0 }),

      // Progress State
      masteredParts: new Set(),
      markAssMastered: (partId) =>
        set((state) => ({
          masteredParts: new Set([...state.masteredParts, partId])
        })),
      studyTime: 0,
      addStudyTime: (seconds) =>
        set((state) => ({ studyTime: state.studyTime + seconds }))
    }),
    {
      name: 'cuerpo-humano-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              masteredParts: new Set(state.masteredParts || [])
            }
          };
        },
        setItem: (name, value) => {
          const str = JSON.stringify({
            state: {
              ...value.state,
              masteredParts: Array.from(value.state.masteredParts)
            }
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);
