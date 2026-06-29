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
  access: "token",
  refresh: "refresh",
  login: vi.fn(),
  logout: vi.fn(),
};

describe("NotesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when unauthenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      access: null,
      refresh: null,
      login: vi.fn(),
      logout: vi.fn(),
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

  it("creates a note with random_thoughts when clicking + New Note from All Categories", async () => {
    const existingNotes = [
      mockNote({
        title: "Existing Note",
        category: "random_thoughts",
        created_at: new Date().toISOString(),
      }),
    ];
    const createdNote = mockNote({
      title: "Untitled",
      category: "random_thoughts",
      created_at: new Date().toISOString(),
    });

    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue(existingNotes);
    vi.mocked(notesService.create).mockResolvedValue(createdNote);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.getByText("Existing Note")).toBeInTheDocument();
    });

    // Click "+ New Note"
    fireEvent.click(screen.getByText("New Note"));

    await waitFor(() => {
      expect(notesService.create).toHaveBeenCalledWith({
        title: "Untitled",
        body: "",
        category: "random_thoughts",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Untitled")).toBeInTheDocument();
    });
  });

  it("creates a note with the selected category when a specific category is active", async () => {
    const existingNotes = [
      mockNote({
        title: "School Note",
        category: "school",
        created_at: new Date().toISOString(),
      }),
    ];
    const createdNote = mockNote({
      title: "Untitled",
      category: "school",
      created_at: new Date().toISOString(),
    });

    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue(existingNotes);
    vi.mocked(notesService.create).mockResolvedValue(createdNote);

    render(<NotesPage />);

    await waitFor(() => {
      // Wait for notes to load (empty state for random_thoughts is fine)
      expect(screen.queryByText("Loading notes...")).not.toBeInTheDocument();
    });

    // Select "School" category
    const schoolButtons = screen.getAllByText("School");
    const sidebarSchool = schoolButtons.find((el) => el.closest("button") !== null);
    fireEvent.click(sidebarSchool!);

    await waitFor(() => {
      expect(screen.getByText("School Note")).toBeInTheDocument();
    });

    // Click "+ New Note"
    fireEvent.click(screen.getByText("New Note"));

    await waitFor(() => {
      expect(notesService.create).toHaveBeenCalledWith({
        title: "Untitled",
        body: "",
        category: "school",
      });
    });
  });

  it("creates a note with random_thoughts after switching back to All Categories", async () => {
    const existingNotes = [
      mockNote({
        title: "A Note",
        category: "personal",
        created_at: new Date().toISOString(),
      }),
    ];
    const createdNote = mockNote({
      title: "Untitled",
      category: "random_thoughts",
      created_at: new Date().toISOString(),
    });

    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue(existingNotes);
    vi.mocked(notesService.create).mockResolvedValue(createdNote);

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading notes...")).not.toBeInTheDocument();
    });

    // Select Personal, then go back to All Categories
    const personalButtons = screen.getAllByText("Personal");
    const sidebarPersonal = personalButtons.find((el) => el.closest("button") !== null);
    fireEvent.click(sidebarPersonal!);
    fireEvent.click(screen.getByText("All Categories"));

    // Click "+ New Note" — should default to random_thoughts
    fireEvent.click(screen.getByText("New Note"));

    await waitFor(() => {
      expect(notesService.create).toHaveBeenCalledWith({
        title: "Untitled",
        body: "",
        category: "random_thoughts",
      });
    });
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

  it("shows error message when creating a note fails", async () => {
    vi.mocked(useAuth).mockReturnValue(authValue);
    vi.mocked(notesService.getAll).mockResolvedValue([]);
    vi.mocked(notesService.create).mockRejectedValue(new Error("Server error"));

    render(<NotesPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading notes...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Note"));

    await waitFor(() => {
      expect(screen.getByText("Failed to create note.")).toBeInTheDocument();
    });
  });
});
