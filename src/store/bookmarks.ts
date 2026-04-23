import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookmarksState {
  bookmarks: string[];
  addBookmark: (toolId: string) => void;
  removeBookmark: (toolId: string) => void;
  isBookmarked: (toolId: string) => boolean;
}

export const useBookmarks = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (toolId) => {
        set((state) =>
          state.bookmarks.includes(toolId)
            ? state
            : { bookmarks: [...state.bookmarks, toolId] },
        );
      },
      removeBookmark: (toolId) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((id) => id !== toolId),
        }));
      },
      isBookmarked: (toolId) => {
        return get().bookmarks.includes(toolId);
      },
    }),
    {
      name: "devtool-bookmarks",
    },
  ),
);
