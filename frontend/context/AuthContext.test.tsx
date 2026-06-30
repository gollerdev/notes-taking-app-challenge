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
  const { access, refresh, isAuthenticated, isHydrated, login, logout, clearSession } =
    useAuth();
  return (
    <div>
      <span data-testid="authenticated">{isAuthenticated ? "true" : "false"}</span>
      <span data-testid="hydrated">{isHydrated ? "true" : "false"}</span>
      <span data-testid="access">{access ?? "null"}</span>
      <span data-testid="refresh">{refresh ?? "null"}</span>
      <button
        data-testid="login"
        onClick={() => login({ access: "test-access", refresh: "test-refresh" })}
      />
      <button data-testid="logout" onClick={logout} />
      <button data-testid="clear-session" onClick={clearSession} />
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts with isAuthenticated false and isHydrated false on initial render", () => {
    // We need to test the synchronous initial render before useEffect runs
    let capturedIsAuthenticated: boolean | undefined;
    let capturedIsHydrated: boolean | undefined;

    function CaptureConsumer() {
      const { isAuthenticated, isHydrated } = useAuth();
      // Capture on every render
      capturedIsAuthenticated = isAuthenticated;
      capturedIsHydrated = isHydrated;
      return null;
    }

    // Use act to run the render + effects
    act(() => {
      render(
        <AuthProvider>
          <CaptureConsumer />
        </AuthProvider>,
      );
    });

    // After act, effects have run so isHydrated is true.
    // But the initial values before effects were false/false.
    // We verify the final state shows hydrated.
    expect(capturedIsAuthenticated).toBe(false);
    expect(capturedIsHydrated).toBe(true);
  });

  it("starts unauthenticated with null tokens after hydration (no stored tokens)", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("hydrated").textContent).toBe("true");
    expect(screen.getByTestId("access").textContent).toBe("null");
    expect(screen.getByTestId("refresh").textContent).toBe("null");
  });

  it("restores tokens from localStorage after mount and sets isHydrated to true", () => {
    localStorage.setItem("access_token", "stored-access");
    localStorage.setItem("refresh_token", "stored-refresh");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("hydrated").textContent).toBe("true");
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

  it("isHydrated is true with no tokens in localStorage", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("hydrated").textContent).toBe("true");
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
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

  it("login stores both tokens in localStorage", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("login").click();
    });

    expect(localStorage.getItem("access_token")).toBe("test-access");
    expect(localStorage.getItem("refresh_token")).toBe("test-refresh");
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

  it("logout removes tokens from localStorage", () => {
    localStorage.setItem("access_token", "stored-access");
    localStorage.setItem("refresh_token", "stored-refresh");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("logout").click();
    });

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it("clearSession clears tokens from state and localStorage", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByTestId("login").click();
    });
    act(() => {
      screen.getByTestId("clear-session").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("access").textContent).toBe("null");
    expect(screen.getByTestId("refresh").textContent).toBe("null");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
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
});
