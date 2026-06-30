import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import NewNotePage from "./page";
import { useAuth } from "@/context/AuthContext";
import { notesService } from "@/services/notes";
import { mockNote } from "@/test-utils/factories";

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const searchParamsState = { current: new URLSearchParams() };
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => searchParamsState.current,
}));

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock notesService
vi.mock("@/services/notes", () => ({
  notesService: {
    create: vi.fn(),
  },
}));

const authValue = {
  isAuthenticated: true,
  isHydrated: true,
  access: "token",
  refresh: "refresh",
  login: vi.fn(),
  logout: vi.fn(),
  clearSession: vi.fn(),
};

describe("NewNotePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsState.current = new URLSearchParams();
  });

  it("renders nothing while isHydrated is false", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authValue,
      isHydrated: false,
    });

    const { container } = render(<NewNotePage />);

    expect(container.innerHTML).toBe("");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to /login when unauthenticated and hydrated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      access: null,
      refresh: null,
      login: vi.fn(),
      logout: vi.fn(),
      clearSession: vi.fn(),
    });

    render(<NewNotePage />);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("calls notesService.create with default values on mount", async () => {
    const newNote = mockNote({ id: "new-note-id" });
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.create).mockResolvedValue(newNote);

    render(<NewNotePage />);

    await waitFor(() => {
      expect(notesService.create).toHaveBeenCalledWith({
        title: "Untitled",
        body: "",
        category: "personal",
      });
    });
  });

  it("uses category from search params when provided", async () => {
    searchParamsState.current = new URLSearchParams("category=school");
    const newNote = mockNote({ id: "school-note-id" });
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.create).mockResolvedValue(newNote);

    render(<NewNotePage />);

    await waitFor(() => {
      expect(notesService.create).toHaveBeenCalledWith({
        title: "Untitled",
        body: "",
        category: "school",
      });
    });
  });

  it("redirects to /notes/[id] on success using router.replace", async () => {
    const newNote = mockNote({ id: "created-note-id" });
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.create).mockResolvedValue(newNote);

    render(<NewNotePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/notes/created-note-id");
    });
  });

  it("creates the note only once even if the effect re-runs", async () => {
    const newNote = mockNote({ id: "once-note-id" });
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.create).mockResolvedValue(newNote);

    const { rerender } = render(<NewNotePage />);

    await waitFor(() => {
      expect(notesService.create).toHaveBeenCalledTimes(1);
    });

    // A re-render that re-runs the effect must not create a second note.
    act(() => {
      rerender(<NewNotePage />);
    });

    expect(notesService.create).toHaveBeenCalledTimes(1);
  });

  it('shows "Creating note..." loading state', () => {
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.create).mockReturnValue(new Promise(() => {}));

    render(<NewNotePage />);

    expect(screen.getByText("Creating note...")).toBeInTheDocument();
  });
});
