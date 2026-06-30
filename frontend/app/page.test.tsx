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
let mockIsHydrated = true;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isHydrated: mockIsHydrated,
    access: mockIsAuthenticated ? "token" : null,
    refresh: null,
    login: vi.fn(),
    logout: vi.fn(),
    clearSession: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Home (redirect gate)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockIsHydrated = true;
  });

  it("renders nothing and does not redirect while isHydrated is false", () => {
    mockIsHydrated = false;
    const { container } = render(<Home />);

    expect(container.innerHTML).toBe("");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to /login when unauthenticated and hydrated", () => {
    mockIsAuthenticated = false;
    mockIsHydrated = true;
    render(<Home />);

    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("redirects to /notes when authenticated and hydrated", () => {
    mockIsAuthenticated = true;
    mockIsHydrated = true;
    render(<Home />);

    expect(mockReplace).toHaveBeenCalledWith("/notes");
  });

  it("renders nothing (null)", () => {
    const { container } = render(<Home />);

    expect(container.innerHTML).toBe("");
  });
});
