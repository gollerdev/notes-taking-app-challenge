import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "./page";
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

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input, password input, and submit button", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("renders the greeting text", () => {
    render(<RegisterPage />);

    expect(screen.getByText("Yay, New Friend!")).toBeInTheDocument();
  });

  it("renders the navigation link to login", () => {
    render(<RegisterPage />);

    const link = screen.getByText("We're already friends!");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows validation errors on empty submit and does not call authService", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("shows email validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email address"), "notanemail");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Invalid email format")).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("shows password validation error for short password", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("calls authService.register with correct credentials and redirects on success", async () => {
    const user = userEvent.setup();
    const tokens = mockAuthTokens();
    vi.mocked(authService.register).mockResolvedValue(tokens);

    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email address"), "newuser@example.com");
    await user.type(screen.getByLabelText("Password"), "newpassword123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(authService.register).toHaveBeenCalledOnce();
    expect(authService.register).toHaveBeenCalledWith({
      email: "newuser@example.com",
      password: "newpassword123",
    });
    expect(mockLogin).toHaveBeenCalledWith(tokens);
    expect(mockReplace).toHaveBeenCalledWith("/notes");
  });

  it("does not call authService.login on register", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockResolvedValue(mockAuthTokens());

    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email address"), "newuser@example.com");
    await user.type(screen.getByLabelText("Password"), "newpassword123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(authService.login).not.toHaveBeenCalled();
  });

  it("shows API error message on failed registration", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockRejectedValue(
      new ApiError(400, { detail: "Email already exists" }),
    );

    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email address"), "existing@example.com");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
  });

  it("shows generic error on unexpected failure", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockRejectedValue(new Error("Network error"));

    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email address"), "newuser@example.com");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText("An unexpected error occurred."),
    ).toBeInTheDocument();
  });

  it("shows fallback message when API error body has no detail", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockRejectedValue(
      new ApiError(400, { email: ["This field is required"] }),
    );

    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email address"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "validpassword123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText("Registration failed. Please try again."),
    ).toBeInTheDocument();
  });
});
