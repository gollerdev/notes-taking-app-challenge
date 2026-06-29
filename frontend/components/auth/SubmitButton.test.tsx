import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("renders the label text", () => {
    render(<SubmitButton label="Login" loading={false} />);

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("is not disabled when loading is false", () => {
    render(<SubmitButton label="Login" loading={false} />);

    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("is disabled when loading is true", () => {
    render(<SubmitButton label="Login" loading={true} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows Loading... text when loading", () => {
    render(<SubmitButton label="Login" loading={true} />);

    expect(screen.getByRole("button")).toHaveTextContent("Loading...");
  });

  it("is disabled when disabled prop is true", () => {
    render(<SubmitButton label="Sign Up" loading={false} disabled={true} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has type submit", () => {
    render(<SubmitButton label="Login" loading={false} />);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
