import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { mockAuthTokens } from "@/test-utils/factories";

// Mock next/navigation
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

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={width} height={height} />;
  },
}));

// Mock authService
vi.mock("@/services/auth", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    logout: vi.fn(),
    access: null,
    refresh: null,
    isAuthenticated: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { authService } from "@/services/auth";
import { ApiError } from "@/lib/api";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input, password input, and submit button", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("renders the greeting text", () => {
    render(<LoginPage />);

    expect(screen.getByText("Yay, You're Back!")).toBeInTheDocument();
  });

  it("renders the navigation link to register", () => {
    render(<LoginPage />);

    const link = screen.getByText("Oops! I've never been here before");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/register");
  });

  it("shows validation errors on empty submit and does not call authService", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("shows email validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "notanemail");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid email format")).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("shows password validation error for short password", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("calls authService.login with correct credentials and redirects on success", async () => {
    const user = userEvent.setup();
    const tokens = mockAuthTokens();
    vi.mocked(authService.login).mockResolvedValue(tokens);

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(authService.login).toHaveBeenCalledOnce();
    expect(authService.login).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "validpassword123",
    });
    expect(mockLogin).toHaveBeenCalledWith(tokens);
    expect(mockReplace).toHaveBeenCalledWith("/notes");
  });

  it("does not call authService.register on login", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue(mockAuthTokens());

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(authService.register).not.toHaveBeenCalled();
  });

  it("shows API error message on failed login", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(401, { detail: "Invalid credentials" }),
    );

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword1");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows generic error on unexpected failure", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValue(new Error("Network error"));

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("An unexpected error occurred."),
    ).toBeInTheDocument();
  });

  it("shows fallback message when API error body has no detail", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(400, { non_field_errors: ["bad request"] }),
    );

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Login failed. Please try again."),
    ).toBeInTheDocument();
  });
});
