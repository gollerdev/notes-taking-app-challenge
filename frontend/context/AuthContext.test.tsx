import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { mockAuthTokens } from "@/test-utils/factories";

vi.mock("@/lib/api", () => ({
  setAccessToken: vi.fn(),
}));

import { setAccessToken } from "@/lib/api";

/** Test component that exposes auth state for assertions. */
function TestConsumer() {
  const { access, refresh, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{isAuthenticated ? "true" : "false"}</span>
      <span data-testid="access">{access ?? "null"}</span>
      <span data-testid="refresh">{refresh ?? "null"}</span>
      <button
        data-testid="login"
        onClick={() => login({ access: "test-access", refresh: "test-refresh" })}
      />
      <button data-testid="logout" onClick={logout} />
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts unauthenticated with null tokens", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("access").textContent).toBe("null");
    expect(screen.getByTestId("refresh").textContent).toBe("null");
  });

  it("login stores tokens and calls setAccessToken", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("login").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("access").textContent).toBe("test-access");
    expect(screen.getByTestId("refresh").textContent).toBe("test-refresh");
    expect(setAccessToken).toHaveBeenCalledOnce();
    expect(setAccessToken).toHaveBeenCalledWith("test-access");
  });

  it("logout clears tokens and calls setAccessToken(null)", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("login").click();
    });
    act(() => {
      screen.getByTestId("logout").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("access").textContent).toBe("null");
    expect(screen.getByTestId("refresh").textContent).toBe("null");
    expect(setAccessToken).toHaveBeenCalledTimes(2);
    expect(setAccessToken).toHaveBeenLastCalledWith(null);
  });

  it("login stores randomized tokens correctly", () => {
    const tokens = mockAuthTokens();

    function TokenConsumer() {
      const { access, refresh, isAuthenticated, login } = useAuth();
      return (
        <div>
          <span data-testid="authenticated">{isAuthenticated ? "true" : "false"}</span>
          <span data-testid="access">{access ?? "null"}</span>
          <span data-testid="refresh">{refresh ?? "null"}</span>
          <button data-testid="login" onClick={() => login(tokens)} />
        </div>
      );
    }

    render(
      <AuthProvider>
        <TokenConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("login").click();
    });

    expect(screen.getByTestId("access").textContent).toBe(tokens.access);
    expect(screen.getByTestId("refresh").textContent).toBe(tokens.refresh);
    expect(setAccessToken).toHaveBeenCalledWith(tokens.access);
  });

  it("useAuth throws when used outside AuthProvider", () => {
    function Orphan() {
      useAuth();
      return null;
    }

    // Suppress console.error for the expected React error boundary output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Orphan />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );

    consoleSpy.mockRestore();
  });

  it("initializes access and refresh tokens from localStorage on mount", () => {
    localStorage.setItem("access_token", "stored-access");
    localStorage.setItem("refresh_token", "stored-refresh");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("access").textContent).toBe("stored-access");
    expect(screen.getByTestId("refresh").textContent).toBe("stored-refresh");
  });

  it("calls setAccessToken with stored token on mount", () => {
    localStorage.setItem("access_token", "stored-access");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(setAccessToken).toHaveBeenCalledWith("stored-access");
  });

  it("does not call setAccessToken on mount when no token is stored", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(setAccessToken).not.toHaveBeenCalled();
  });

  it("login stores refresh token in localStorage", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("login").click();
    });

    expect(localStorage.getItem("refresh_token")).toBe("test-refresh");
  });

  it("logout removes refresh token from localStorage", () => {
    localStorage.setItem("refresh_token", "stored-refresh");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("logout").click();
    });

    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });
});
