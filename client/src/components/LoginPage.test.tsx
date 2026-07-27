import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./LoginPage";
import { useAuth } from "../AuthContext";

vi.mock("../AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe("LoginPage", () => {
  let login: ReturnType<typeof vi.fn>;
  let signup: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    login = vi.fn().mockResolvedValue(undefined);
    signup = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      signup,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("renders the login form by default", () => {
    render(<LoginPage />);
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("toggles to the signup form", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByText("Create one"));

    expect(screen.getByText("Create an account to get started")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByText("At least 8 characters.")).toBeInTheDocument();
  });

  it("submits the entered credentials to login", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Username"), "dahlia");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(login).toHaveBeenCalledWith("dahlia", "password123");
    expect(signup).not.toHaveBeenCalled();
  });

  it("submits the entered credentials to signup after toggling mode", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByText("Create one"));

    await userEvent.type(screen.getByLabelText("Username"), "newuser");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(signup).toHaveBeenCalledWith("newuser", "password123");
  });

  it("shows an error message when login fails", async () => {
    login.mockRejectedValue(new Error("Invalid username or password"));
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Username"), "dahlia");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid username or password")).toBeInTheDocument();
  });

  it("clears the error when switching modes", async () => {
    login.mockRejectedValue(new Error("Invalid username or password"));
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Username"), "dahlia");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Invalid username or password")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Create one"));

    expect(screen.queryByText("Invalid username or password")).not.toBeInTheDocument();
  });
});
