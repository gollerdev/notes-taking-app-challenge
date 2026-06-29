import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword } from "./validation";

describe("validateEmail", () => {
  it("returns error for empty string", () => {
    expect(validateEmail("")).toBe("Email is required");
  });

  it("returns error for whitespace-only string", () => {
    expect(validateEmail("   ")).toBe("Email is required");
  });

  it("returns error for invalid email format", () => {
    expect(validateEmail("notanemail")).toBe("Invalid email format");
  });

  it("returns error for email without domain", () => {
    expect(validateEmail("user@")).toBe("Invalid email format");
  });

  it("returns error for email without TLD", () => {
    expect(validateEmail("user@domain")).toBe("Invalid email format");
  });

  it("returns undefined for valid email", () => {
    expect(validateEmail("user@example.com")).toBeUndefined();
  });
});

describe("validatePassword", () => {
  it("returns error for empty string", () => {
    expect(validatePassword("")).toBe("Password is required");
  });

  it("returns error for password shorter than 8 characters", () => {
    expect(validatePassword("1234567")).toBe("Password must be at least 8 characters");
  });

  it("returns undefined for password of exactly 8 characters", () => {
    expect(validatePassword("12345678")).toBeUndefined();
  });

  it("returns undefined for long password", () => {
    expect(validatePassword("averylongpassword123")).toBeUndefined();
  });
});
