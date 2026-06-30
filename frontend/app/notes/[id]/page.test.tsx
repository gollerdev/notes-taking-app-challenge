import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import NoteEditorPage from "./page";
import { useAuth } from "@/context/AuthContext";
import { notesService } from "@/services/notes";
import { mockNote } from "@/test-utils/factories";

// Mock next/navigation
const mockPush = vi.fn();
const testId = "test-note-id-123";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: testId }),
}));

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock notesService
vi.mock("@/services/notes", () => ({
  notesService: {
    getById: vi.fn(),
    patch: vi.fn(),
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

describe("NoteEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while isHydrated is false", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authValue,
      isHydrated: false,
    });

    const { container } = render(<NoteEditorPage />);

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

    render(<NoteEditorPage />);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("calls notesService.getById with the correct id", async () => {
    const note = mockNote({
      id: testId,
      title: "Loaded Note",
      body: "Loaded body",
      category: "personal",
    });
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getById).mockResolvedValue(note);

    render(<NoteEditorPage />);

    await waitFor(() => {
      expect(notesService.getById).toHaveBeenCalledWith(testId);
    });
  });

  it("renders the editor pre-filled with the note content", async () => {
    const note = mockNote({
      id: testId,
      title: "My Note Title",
      body: "My note body",
      category: "school",
    });
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getById).mockResolvedValue(note);

    render(<NoteEditorPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("My Note Title")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("My note body")).toBeInTheDocument();
    expect(screen.getByText("School")).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getById).mockReturnValue(new Promise(() => {}));

    render(<NoteEditorPage />);

    expect(screen.getByText("Loading note...")).toBeInTheDocument();
  });

  it("shows error state when note is not found", async () => {
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getById).mockRejectedValue(new Error("Not found"));

    render(<NoteEditorPage />);

    await waitFor(() => {
      expect(screen.getByText("Note not found.")).toBeInTheDocument();
    });
  });
});
