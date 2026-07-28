import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useAuth } from "./AuthContext";
import { fetchTopics } from "./api";

vi.mock("./AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("./api", () => ({ fetchTopics: vi.fn() }));

vi.mock("./components/LoginPage", () => ({ default: () => <div>LOGIN_PAGE</div> }));
vi.mock("./components/ChatWindow", () => ({
  default: ({ topic }: { topic: string }) => <div>CHAT_WINDOW:{topic}</div>,
}));
vi.mock("./components/QuizPanel", () => ({
  default: ({ topic }: { topic: string }) => <div>QUIZ_PANEL:{topic}</div>,
}));
vi.mock("./components/ProjectsSection", () => ({ default: () => <div>PROJECTS_SECTION</div> }));
vi.mock("./components/TopicsSection", () => ({
  default: ({ onSelect }: { onSelect: (t: string) => void }) => (
    <button onClick={() => onSelect("Signals & Systems")}>TOPICS_SECTION_PICK</button>
  ),
}));
vi.mock("./components/EquationsSection", () => ({ default: () => <div>EQUATIONS_SECTION</div> }));
vi.mock("./components/HowItWorks", () => ({ default: () => <div>HOW_IT_WORKS</div> }));
vi.mock("./components/Footer", () => ({ default: () => <div>FOOTER</div> }));

const mockUseAuth = vi.mocked(useAuth);
const mockFetchTopics = vi.mocked(fetchTopics);

describe("App", () => {
  beforeEach(() => {
    mockFetchTopics.mockResolvedValue(["Circuit Analysis", "Signals & Systems"]);
  });

  it("renders nothing but a blank screen while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, login: vi.fn(), signup: vi.fn(), logout: vi.fn() });
    render(<App />);
    expect(screen.queryByText("LOGIN_PAGE")).not.toBeInTheDocument();
    expect(screen.queryByText("ECEBuddy")).not.toBeInTheDocument();
  });

  it("shows the login page when there is no signed-in user", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), signup: vi.fn(), logout: vi.fn() });
    render(<App />);
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("shows the main app with the username once signed in", async () => {
    mockUseAuth.mockReturnValue({
      user: { username: "dahlia" },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });
    render(<App />);

    expect(screen.getByText("dahlia")).toBeInTheDocument();
    expect(await screen.findByText(/CHAT_WINDOW/)).toBeInTheDocument();
    expect(screen.getByText("PROJECTS_SECTION")).toBeInTheDocument();
    expect(screen.getByText("HOW_IT_WORKS")).toBeInTheDocument();
    expect(screen.getByText("EQUATIONS_SECTION")).toBeInTheDocument();
    expect(screen.getByText("FOOTER")).toBeInTheDocument();
  });

  it("calls logout when the Log out button is clicked", async () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { username: "dahlia" },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout,
    });
    render(<App />);

    await userEvent.click(screen.getByText("Log out"));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("defaults to the first fetched topic and chat mode", async () => {
    mockUseAuth.mockReturnValue({
      user: { username: "dahlia" },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });
    render(<App />);

    expect(await screen.findByText("CHAT_WINDOW:Circuit Analysis")).toBeInTheDocument();
  });

  it("switches to the quiz panel when Practice quiz is clicked", async () => {
    mockUseAuth.mockReturnValue({
      user: { username: "dahlia" },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });
    render(<App />);
    await screen.findByText("CHAT_WINDOW:Circuit Analysis");

    await userEvent.click(screen.getByRole("button", { name: /Practice quiz/ }));

    expect(screen.getByText("QUIZ_PANEL:Circuit Analysis")).toBeInTheDocument();
    expect(screen.queryByText(/CHAT_WINDOW/)).not.toBeInTheDocument();
  });

  it("switches topic and back to chat mode when TopicsSection picks one", async () => {
    mockUseAuth.mockReturnValue({
      user: { username: "dahlia" },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });
    render(<App />);
    await screen.findByText("CHAT_WINDOW:Circuit Analysis");

    await userEvent.click(screen.getByRole("button", { name: /Practice quiz/ }));
    await userEvent.click(screen.getByText("TOPICS_SECTION_PICK"));

    expect(screen.getByText("CHAT_WINDOW:Signals & Systems")).toBeInTheDocument();
  });

  it("falls back to an empty topic list when fetchTopics fails", async () => {
    mockFetchTopics.mockRejectedValue(new Error("network error"));
    mockUseAuth.mockReturnValue({
      user: { username: "dahlia" },
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });
    render(<App />);

    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/CHAT_WINDOW/)).not.toBeInTheDocument();
    expect(screen.queryByText("PROJECTS_SECTION")).not.toBeInTheDocument();
  });
});
