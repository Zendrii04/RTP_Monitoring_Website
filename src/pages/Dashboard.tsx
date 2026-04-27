import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

// This matches the Unity→Firebase sync schema exactly
interface Student {
  id: string;
  name: string;
  email: string;
  sex: string;
  year_level: string | number;
  checkpoints_finished: number;
  total_hours: number;
  current_chapter: string | number;
  last_chapter: string | number;
  puzzles_solved: number;
}

const MOTD =
  "Welcome back! Keep track of your students' progress in Rizal Through Play. Every checkpoint they complete brings them closer to understanding Philippine history. 🇵🇭";

const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Real-time listener — Firestore collection 'students'
    const q = query(collection(db, "students"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = students.length;
  const avgHours =
    students.length > 0
      ? (
          students.reduce((sum, s) => sum + (s.total_hours || 0), 0) /
          students.length
        ).toFixed(1)
      : "0";
  const totalPuzzles = students.reduce(
    (sum, s) => sum + (s.puzzles_solved || 0),
    0
  );
  const totalCheckpoints = students.reduce(
    (sum, s) => sum + (s.checkpoints_finished || 0),
    0
  );

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Student Monitoring Dashboard</h1>
        <p>Real-time data synced from the Rizal Through Play Unity game.</p>
      </div>

      {/* Message of the Day */}
      <div className="motd-banner">
        <div className="motd-icon">📢</div>
        <div className="motd-content">
          <p>{MOTD}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{totalStudents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Time Played</div>
          <div className="stat-value">{avgHours}h</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Puzzles Solved</div>
          <div className="stat-value">{totalPuzzles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Checkpoints Done</div>
          <div className="stat-value">{totalCheckpoints}</div>
        </div>
      </div>

      {/* How to Use Video + Table */}
      <div className="dashboard-grid">
        {/* LEFT: Data Table */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Student Records</span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--clr-text-secondary)",
                }}
              >
                {filtered.length} of {totalStudents} students
              </span>
            </div>
            <div className="table-search-bar">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="table-wrapper">
              {loading ? (
                <div className="table-empty">
                  <div className="spinner" style={{ margin: "0 auto" }} />
                  <p>Loading student data…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="table-empty">
                  <span style={{ fontSize: 32 }}>🎮</span>
                  <p>
                    {students.length === 0
                      ? "No students yet. They will appear here once they sync from the game."
                      : "No students match your search."}
                  </p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Sex</th>
                      <th>Year Level</th>
                      <th>Checkpoints</th>
                      <th>Time Played</th>
                      <th>Current Chapter</th>
                      <th>Last Chapter</th>
                      <th>Puzzles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{ color: "var(--clr-text-muted)" }}>
                          {i + 1}
                        </td>
                        <td className="td-name">{s.name}</td>
                        <td className="td-email">{s.email}</td>
                        <td>{s.sex}</td>
                        <td>
                          <span className="badge badge-blue">
                            Year {s.year_level}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-green">
                            {s.checkpoints_finished}
                          </span>
                        </td>
                        <td>{s.total_hours}h</td>
                        <td>
                          <span className="badge badge-purple">
                            Ch. {s.current_chapter}
                          </span>
                        </td>
                        <td>Ch. {s.last_chapter}</td>
                        <td>{s.puzzles_solved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Video Player */}
        <div>
          <div className="card video-section">
            <div className="card-header">
              <span className="card-title">📹 How to Use</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div
                className="video-container"
                style={{ borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}
              >
                {/* 
                  TODO: Replace the src below with a real YouTube embed URL.
                  Example: src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                  To get the embed URL:
                  1. Open your video on YouTube.
                  2. Click Share → Embed.
                  3. Copy the src link from the <iframe> code shown.
                */}
                <div className="video-placeholder">
                  <div className="video-play-btn">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="var(--clr-primary)"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, textAlign: "center", maxWidth: 200 }}>
                    Video placeholder — paste a YouTube embed URL in Dashboard.tsx
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
