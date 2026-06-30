import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotesPage from "./page";
import { useAuth } from "@/context/AuthContext";
import { notesService } from "@/services/notes";
import { mockNote } from "@/test-utils/factories";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/image to render a plain img
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock notesService
vi.mock("@/services/notes", () => ({
  notesService: {
    getAll: vi.fn(),
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

describe("NotesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while isHydrated is false", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authValue,
      isHydrated: false,
    });
    vi.mocked(notesService.getAll).mockResolvedValue([]);

    const { container } = render(<NotesPage />);

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
    vi.mocked(notesService.getAll).mockResolvedValue([]);

    render(<NotesPage />);

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("renders the sidebar and note grid when authenticated with all notes visible by default", async () => {
    const notes = [
      mockNote({
        title: "Random Note",
        category: "random_thoughts",
        created_at: new Date().toISOString(),
      }),
      mockNote({
        title: "School Note",
        category: "school",
        created_at: new Date().toISOString(),
      }),
    ];
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue(notes);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText("Random Note")).toBeInTheDocument();
    });

    expect(screen.getByText("All Categories")).toBeInTheDocument();
    expect(screen.getByText("New Note")).toBeInTheDocument();
    // All notes visible by default (no category filter)
    expect(screen.getByText("School Note")).toBeInTheDocument();
  });

  it("filters notes when selecting a category", async () => {
    const notes = [
      mockNote({
        title: "Random Note",
        category: "random_thoughts",
        created_at: new Date().toISOString(),
      }),
      mockNote({
        title: "School Note",
        category: "school",
        created_at: new Date().toISOString(),
      }),
    ];
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue(notes);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText("Random Note")).toBeInTheDocument();
    });

    // Click "School" category in the sidebar (the button containing "School")
    const schoolButtons = screen.getAllByText("School");
    const sidebarSchool = schoolButtons.find((el) => el.closest("button") !== null);
    fireEvent.click(sidebarSchool!);

    expect(screen.getByText("School Note")).toBeInTheDocument();
    expect(screen.queryByText("Random Note")).not.toBeInTheDocument();
  });

  it("clears the filter when clicking All Categories", async () => {
    const notes = [
      mockNote({
        title: "Random Note",
        category: "random_thoughts",
        created_at: new Date().toISOString(),
      }),
      mockNote({
        title: "School Note",
        category: "school",
        created_at: new Date().toISOString(),
      }),
    ];
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue(notes);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText("Random Note")).toBeInTheDocument();
    });

    // Both notes visible by default
    expect(screen.getByText("School Note")).toBeInTheDocument();

    // Select a category first, then click All Categories to clear filter
    const schoolButtons = screen.getAllByText("School");
    const sidebarSchool = schoolButtons.find((el) => el.closest("button") !== null);
    fireEvent.click(sidebarSchool!);

    // Only school note visible now
    expect(screen.queryByText("Random Note")).not.toBeInTheDocument();

    // Click All Categories to show all again
    fireEvent.click(screen.getByText("All Categories"));

    expect(screen.getByText("Random Note")).toBeInTheDocument();
    expect(screen.getByText("School Note")).toBeInTheDocument();
  });

  it("NewNoteButton navigates to /notes/new when clicked", async () => {
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue([]);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading notes...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Note"));
    expect(mockPush).toHaveBeenCalledWith("/notes/new");
  });

  it("clicking a NoteCard navigates to /notes/[id]", async () => {
    const note = mockNote({
      id: "card-nav-test-id",
      title: "Clickable Note",
      category: "personal",
      created_at: new Date().toISOString(),
    });
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue([note]);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText("Clickable Note")).toBeInTheDocument();
    });

    // Click the note card
    fireEvent.click(screen.getByText("Clickable Note"));
    expect(mockPush).toHaveBeenCalledWith("/notes/card-nav-test-id");
  });

  it("shows loading state while notes are being fetched", () => {
    vi.mocked(useAuth).mockReturnValue(authValue);
    // Never resolves to keep loading state
    vi.mocked(notesService.getAll).mockReturnValue(new Promise(() => {}));

    render(<NotesPage />);

    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });

  it("shows error message when notes fail to load", async () => {
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockRejectedValue(new Error("Network"));

    render(<NotesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load notes. Please try again later."),
      ).toBeInTheDocument();
    });
  });
});
