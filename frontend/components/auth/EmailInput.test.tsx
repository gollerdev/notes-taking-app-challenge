import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailInput } from "./EmailInput";

describe("EmailInput", () => {
  it("renders the email input with placeholder", () => {
    render(<EmailInput value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Email address");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "Email address");
  });

  it("displays the current value", () => {
    render(<EmailInput value="test@example.com" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Email address");
    expect(input).toHaveValue("test@example.com");
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<EmailInput value="" onChange={handleChange} />);

    await user.type(screen.getByLabelText("Email address"), "a");
    expect(handleChange).toHaveBeenCalledWith("a");
  });

  it("shows error message when error prop is provided", () => {
    render(<EmailInput value="" onChange={vi.fn()} error="Invalid email format" />);

    expect(screen.getByText("Invalid email format")).toBeInTheDocument();
  });

  it("does not show error message when error prop is absent", () => {
    render(<EmailInput value="" onChange={vi.fn()} />);

    expect(screen.queryByText("Invalid email format")).not.toBeInTheDocument();
  });

  it("applies error border styling when error is present", () => {
    const { container } = render(
      <EmailInput value="" onChange={vi.fn()} error="Required" />,
    );

    const wrapper = container.querySelector(".border-red-600");
    expect(wrapper).toBeInTheDocument();
  });
});
