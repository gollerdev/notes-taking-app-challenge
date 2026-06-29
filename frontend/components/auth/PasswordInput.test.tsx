import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("renders the password input with placeholder", () => {
    render(<PasswordInput value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Password");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("placeholder", "Password");
  });

  it("displays the current value", () => {
    render(<PasswordInput value="secret123" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveValue("secret123");
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordInput value="" onChange={handleChange} />);

    await user.type(screen.getByLabelText("Password"), "a");
    expect(handleChange).toHaveBeenCalledWith("a");
  });

  it("shows error message when error prop is provided", () => {
    render(<PasswordInput value="" onChange={vi.fn()} error="Password is required" />);

    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("does not show error message when error prop is absent", () => {
    render(<PasswordInput value="" onChange={vi.fn()} />);

    expect(screen.queryByText("Password is required")).not.toBeInTheDocument();
  });

  it("toggles input type from password to text when Show is clicked", async () => {
    const user = userEvent.setup();
    render(<PasswordInput value="secret" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByLabelText("Show password"));
    expect(input).toHaveAttribute("type", "text");
  });

  it("toggles input type back to password when Hide is clicked", async () => {
    const user = userEvent.setup();
    render(<PasswordInput value="secret" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Password");

    await user.click(screen.getByLabelText("Show password"));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByLabelText("Hide password"));
    expect(input).toHaveAttribute("type", "password");
  });

  it("applies error border styling when error is present", () => {
    const { container } = render(
      <PasswordInput value="" onChange={vi.fn()} error="Required" />,
    );

    const wrapper = container.querySelector(".border-red-600");
    expect(wrapper).toBeInTheDocument();
  });
});
