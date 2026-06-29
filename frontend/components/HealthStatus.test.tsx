import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HealthStatus from "./HealthStatus";

// Mock the api module
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked api after setting up the mock
import { api } from "@/lib/api";

const mockedApi = vi.mocked(api);

describe("HealthStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockedApi.get.mockReturnValue(new Promise(() => {}));
    render(<HealthStatus />);
    expect(screen.getByTestId("health-loading")).toBeInTheDocument();
    expect(screen.getByText("Checking backend...")).toBeInTheDocument();
  });

  it("shows up state when backend returns ok", async () => {
    mockedApi.get.mockResolvedValue({ status: "ok" });
    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-up")).toBeInTheDocument();
    });
    expect(screen.getByText("Backend: up")).toBeInTheDocument();

    // Strict call verification: only get was called, with the health endpoint
    expect(mockedApi.get).toHaveBeenCalledOnce();
    expect(mockedApi.get).toHaveBeenCalledWith("/health/");
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it("shows down state when backend request fails", async () => {
    mockedApi.get.mockRejectedValue(new Error("Network error"));
    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-down")).toBeInTheDocument();
    });
    expect(screen.getByText("Backend: down")).toBeInTheDocument();

    // Strict call verification
    expect(mockedApi.get).toHaveBeenCalledOnce();
    expect(mockedApi.get).toHaveBeenCalledWith("/health/");
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it("shows down state when backend returns non-ok status", async () => {
    mockedApi.get.mockResolvedValue({ status: "error" });
    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-down")).toBeInTheDocument();
    });
    expect(screen.getByText("Backend: down")).toBeInTheDocument();
  });
});
