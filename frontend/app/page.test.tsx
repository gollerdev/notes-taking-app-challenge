import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import Home from "./page";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

let mockIsAuthenticated = false;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    access: mockIsAuthenticated ? "token" : null,
    refresh: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Home (redirect gate)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
  });

  it("redirects to /login when unauthenticated", () => {
    mockIsAuthenticated = false;
    render(<Home />);

    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("redirects to /notes when authenticated", () => {
    mockIsAuthenticated = true;
    render(<Home />);

    expect(mockReplace).toHaveBeenCalledWith("/notes");
  });

  it("renders nothing (null)", () => {
    const { container } = render(<Home />);

    expect(container.innerHTML).toBe("");
  });
});
