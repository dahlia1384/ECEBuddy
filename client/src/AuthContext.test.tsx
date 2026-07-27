import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

function Consumer() {
  const { user, loading, login, signup, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.username ?? "none"}</span>
      {error && <span data-testid="error">{error}</span>}
      <button onClick={() => login("alice", "password123").catch((e) => setError(e.message))}>login</button>
      <button onClick={() => signup("alice", "password123").catch((e) => setError(e.message))}>signup</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("resolves the current user from /api/auth/me on mount", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ user: { username: "dahlia" } })
    );

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("dahlia");
  });

  it("leaves user null when there is no active session", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, json: async () => ({}) } as Response);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("logs in successfully and updates the user", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response); // initial /me
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { username: "alice" } })); // /login

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("alice"));
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(init.body)).toEqual({ username: "alice", password: "password123" });
  });

  it("surfaces a login error without setting a user", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response); // initial /me
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Invalid username or password" }, false)); // /login

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("error").textContent).toBe("Invalid username or password"));
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("signup updates the user on success", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { username: "alice" } }));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await userEvent.click(screen.getByText("signup"));

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("alice"));
  });

  it("logout clears the user", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { username: "dahlia" } })); // initial /me
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true })); // /logout

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("dahlia"));

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("none"));
  });
});
