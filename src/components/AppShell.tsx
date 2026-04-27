import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useTheme, Theme } from "../contexts/ThemeContext";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/profile": "Profile Settings",
  "/feedback": "Submit Feedback",
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Dashboard";
  const { theme, setTheme } = useTheme();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <span className="top-bar-title">{title}</span>
          <div className="top-bar-right">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              style={{
                background: "var(--clr-surface-2)",
                color: "var(--clr-text-primary)",
                border: "1px solid var(--clr-border)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
              <option value="midnight">Midnight Purple</option>
              <option value="ocean">Ocean Blue</option>
            </select>
            <span
              style={{
                fontSize: 12,
                color: "var(--clr-text-secondary)",
                background: "var(--clr-surface-2)",
                padding: "4px 12px",
                borderRadius: 20,
                border: "1px solid var(--clr-border)",
              }}
            >
              {new Date().toLocaleDateString("en-PH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
