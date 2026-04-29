import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const TUTORIAL_KEY = "rtp_tutorial_shown_login_v2";

// ─── PASTE YOUR GOOGLE DRIVE VIDEO LINK HERE ───────────────────────────────
// Replace the URL below with your shareable Google Drive link.
// Make sure the sharing is set to "Anyone with the link can view".
const HOW_TO_USE_URL = "https://drive.google.com/file/d/1W7ccOhderzIp9EOlmi99MrDa7HkazPQg/view?usp=sharing";
// ────────────────────────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tutorial state
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  // Ref on the "How to Use?" button so we can measure its position
  const howToUseRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem(TUTORIAL_KEY);
    if (!hasSeen) {
      setShowTutorialPrompt(true);
    }
  }, []);

  // Every time tutorial mode turns on, measure the button's position
  useEffect(() => {
    if (isTutorialMode && howToUseRef.current) {
      const rect = howToUseRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2, // vertically centred on the button
        left: rect.right + 16,           // 16px gap to the right of the button
      });
    }
  }, [isTutorialMode]);

  const startTutorial = () => {
    setShowTutorialPrompt(false);
    setIsTutorialMode(true);
  };

  const endTutorial = () => {
    setIsTutorialMode(false);
    setTooltipPos(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate("/");
    } catch (err: any) {
      const code = err.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Failed to sign in. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Background Blur Overlay + Tooltip ─────────────────────────── */}
      {isTutorialMode && (
        <div
          className="tutorial-overlay"
          onClick={endTutorial}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9998,
            cursor: "pointer",
          }}
        >
          {/* Tooltip — positioned beside the button */}
          {tooltipPos && (
            <div
              onClick={(e) => e.stopPropagation()} // don't dismiss when clicking tooltip
              style={{
                position: "fixed",
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: "translateY(-50%)",
                background: "var(--clr-surface)",
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--clr-primary)",
                boxShadow: "var(--shadow-glow)",
                color: "var(--clr-text-primary)",
                width: "240px",
                animation: "fadeUp 0.3s ease",
                zIndex: 9999,
                pointerEvents: "none", // let clicks fall through to the overlay
              }}
            >
              {/* Arrow pointing left toward the button */}
              <div
                style={{
                  position: "absolute",
                  left: -10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderRight: "10px solid var(--clr-primary)",
                }}
              />
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>👆 Need Help?</h3>
              <p style={{ fontSize: 13, color: "var(--clr-text-secondary)", lineHeight: 1.5 }}>
                Click the highlighted <b>How to Use?</b> button to watch a quick video guide.
                <br /><br />
                <i>Click anywhere to dismiss.</i>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Login Card ────────────────────────────────────────────────── */}
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo-area">
            <div className="auth-logo">RTP</div>
            <h1>Rizal Through Play</h1>
            <p>Instructor Monitoring Portal</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="instructor@school.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13 }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* ── How to Use? button ──────────────────────────────────── */}
          <div style={{ marginTop: "12px" }}>
            <a
              id="login-how-to-use"
              ref={howToUseRef}
              href={HOW_TO_USE_URL}
              target="_blank"
              rel="noreferrer"
              onClick={isTutorialMode ? endTutorial : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "9px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.3s ease",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--clr-text-secondary)",
                border: "1px solid var(--clr-border)",
                ...(isTutorialMode
                  ? {
                    position: "relative",
                    zIndex: 9999,
                    background: "var(--clr-primary)",
                    color: "#fff",
                    boxShadow: "var(--shadow-glow)",
                    transform: "scale(1.03)",
                    border: "2px solid #fff",
                  }
                  : {}),
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              How to Use?
            </a>
          </div>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>

      {/* ── Tutorial Welcome Modal ─────────────────────────────────────── */}
      {showTutorialPrompt && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-content"
            style={{ animation: "fadeUp 0.3s ease", textAlign: "center" }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>
              Welcome to RTP Monitoring!
            </h2>
            <div className="modal-body">
              <p
                style={{
                  color: "var(--clr-text-secondary)",
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                Would you like a quick tutorial on how to use the dashboard and
                track your students?
              </p>
            </div>
            <div
              className="modal-actions"
              style={{ justifyContent: "center", gap: 12 }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => {
                  localStorage.setItem(TUTORIAL_KEY, "true");
                  setShowTutorialPrompt(false);
                }}
                style={{ width: "120px" }}
              >
                No, thanks
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  localStorage.setItem(TUTORIAL_KEY, "true");
                  startTutorial();
                }}
                style={{ width: "120px" }}
              >
                Yes, show me
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
