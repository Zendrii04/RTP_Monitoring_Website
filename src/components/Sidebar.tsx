import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    end: true,
  },
  {
    to: "/profile",
    label: "Profile Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const Sidebar: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  useEffect(() => {
    if (profile) {
      const tutorialKey = `rtp_tutorial_shown_${profile.name}`;
      const hasSeen = localStorage.getItem(tutorialKey);
      if (!hasSeen) {
        setShowTutorialPrompt(true);
        localStorage.setItem(tutorialKey, "true");
      }
    }
  }, [profile]);

  const confirmLogout = async () => {
    await logout();
    navigate("/login");
  };

  const startTutorial = () => {
    setShowTutorialPrompt(false);
    setIsTutorialMode(true);
  };

  const endTutorial = () => {
    setIsTutorialMode(false);
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "IN";

  return (
    <>
      {/* Background Blur Overlay for Tutorial Mode */}
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
            cursor: "pointer"
          }}
        >
          <div style={{
            position: "absolute",
            bottom: "120px",
            left: "20px",
            background: "var(--clr-surface)",
            padding: "16px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--clr-primary)",
            boxShadow: "var(--shadow-glow)",
            color: "var(--clr-text-primary)",
            width: "250px",
            animation: "fadeUp 0.3s ease"
          }}>
            <h3 style={{ fontSize: 14, marginBottom: 4 }}>Need Help?</h3>
            <p style={{ fontSize: 13, color: "var(--clr-text-secondary)" }}>
              Click the highlighted <b>How to Use?</b> button to watch a quick video guide.
              <br/><br/><i>Click anywhere to dismiss.</i>
            </p>
          </div>
        </div>
      )}

      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">RTP</div>
          <div className="sidebar-brand-text">
            <h2>Rizal Through Play</h2>
            <span>Instructor Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mini Panel */}
        <div className="sidebar-mini-panel">
          <div className="mini-panel-user">
            <div className="mini-panel-avatar">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="profile" />
              ) : (
                initials
              )}
            </div>
            <div className="mini-panel-info">
              <div className="mini-panel-name">
                {profile?.username || profile?.name || "Instructor"}
              </div>
              <div className="mini-panel-role">Instructor</div>
            </div>
          </div>
          <div className="mini-panel-email">{profile?.email || ""}</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <NavLink
              to="/feedback"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              style={{ justifyContent: "center", padding: "6px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Submit Feedback
            </NavLink>
            
            <a
              href="https://youtube.com/"
              target="_blank"
              rel="noreferrer"
              className="sidebar-link"
              onClick={isTutorialMode ? endTutorial : undefined}
              style={{
                justifyContent: "center", 
                padding: "6px", 
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                ...(isTutorialMode ? {
                  position: "relative",
                  zIndex: 9999,
                  background: "var(--clr-primary)",
                  color: "#fff",
                  boxShadow: "var(--shadow-glow)",
                  transform: "scale(1.05)",
                  transition: "all 0.3s ease",
                  border: "2px solid #fff"
                } : {})
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              How to Use?
            </a>

            <button className="btn btn-danger btn-full btn-sm" onClick={() => setShowLogoutConfirm(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Tutorial Initial Prompt Modal */}
      {showTutorialPrompt && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ animation: "fadeUp 0.3s ease", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Welcome to RTP Monitoring!</h2>
            <div className="modal-body">
              <p style={{ color: "var(--clr-text-secondary)", lineHeight: 1.5, marginBottom: 20 }}>
                Would you like a quick tutorial on how to use the dashboard and track your students?
              </p>
            </div>
            <div className="modal-actions" style={{ justifyContent: "center", gap: 12 }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowTutorialPrompt(false)}
                style={{ width: "120px" }}
              >
                No, thanks
              </button>
              <button 
                className="btn btn-primary" 
                onClick={startTutorial}
                style={{ width: "120px" }}
              >
                Yes, show me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content">
            <div className="modal-header">Confirm Sign Out</div>
            <div className="modal-body">
              Are you sure you want to sign out of the Instructor Portal?
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
