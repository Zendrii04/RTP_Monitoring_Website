import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

// This matches the Unity→Firebase sync schema exactly
interface StudentData {
  id: string;
  name: string;
  email: string;
  sex: string;
  yearLevel: string;
  checkpointsFinished: number;
  totalHours: number;
  currentChapter: string;
  lastChapter: string;
  puzzlesSolved: number;
}

// Matches ChapterAssessmentManager.cs → WriteToFirestore()
// Path: users/{uid}/assessments/chapter{1|2|3}
interface AssessmentResult {
  score: number;
  total: number;
  passed: boolean;
}

interface AssessmentMap {
  chapter1?: AssessmentResult;
  chapter2?: AssessmentResult;
  chapter3?: AssessmentResult;
}

const MOTD =
  "Welcome back! Keep track of your students' progress in Rizal Through Play. Every checkpoint they complete brings them closer to understanding Philippine history. 🇵🇭";

const formatTime = (hours: number): string => {
  if (!hours || hours === 0) return "0m";
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  return `${hours.toFixed(1)}h`;
};

// Renders "3/5 (60%)" with a colored badge, or a muted dash if not taken yet
const AssessmentCell: React.FC<{ result?: AssessmentResult }> = ({ result }) => {
  if (!result) {
    return <span style={{ color: "var(--clr-text-muted)" }}>—</span>;
  }
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const badgeClass = result.passed ? "badge-green" : "badge-danger";
  return (
    <span className={`badge ${badgeClass}`} title={result.passed ? "Passed" : "Failed"}>
      {result.score}/{result.total} ({pct}%)
    </span>
  );
};

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [assessments, setAssessments] = useState<Record<string, AssessmentMap>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  // Tracks one onSnapshot unsubscribe per student's assessments subcollection,
  // so we can add/remove listeners as the student roster changes without leaking.
  const assessmentUnsubs = useRef<Record<string, () => void>>({});

  const subscribeToAssessments = (studentId: string) => {
    if (assessmentUnsubs.current[studentId]) return; // already subscribed

    const q = collection(db, "users", studentId, "assessments");
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAssessments((prev) => {
          const next: AssessmentMap = { ...prev[studentId] };
          snap.docs.forEach((d) => {
            const data = d.data() as AssessmentResult;
            const result: AssessmentResult = {
              score: data.score ?? 0,
              total: data.total ?? 0,
              passed: !!data.passed,
            };
            if (d.id === "chapter1") next.chapter1 = result;
            if (d.id === "chapter2") next.chapter2 = result;
            if (d.id === "chapter3") next.chapter3 = result;
          });
          return { ...prev, [studentId]: next };
        });
      },
      (error) => {
        console.error(`Error fetching assessments for ${studentId}:`, error);
      }
    );
    assessmentUnsubs.current[studentId] = unsub;
  };

  const unsubscribeStale = (activeIds: Set<string>) => {
    Object.keys(assessmentUnsubs.current).forEach((id) => {
      if (!activeIds.has(id)) {
        assessmentUnsubs.current[id]();
        delete assessmentUnsubs.current[id];
        setAssessments((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  };

  useEffect(() => {
    if (!profile?.name) {
      setLoading(false);
      setErrorMsg(
        "Your instructor profile is missing a name. This usually means your account " +
        "doesn't have a matching document in the 'instructors' collection, or it's " +
        "missing the 'name' field. Please contact support or re-create your account " +
        "through the Sign Up page."
      );
      return;
    }

    // Real-time listener — Only get users who have this instructor's name
    const q = query(
      collection(db, "users"),
      where("instructor", "==", profile.name)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => {
          const d = doc.data();
          // Fuse first name, middle initial, and last name
          const fullName = [d.firstName, d.middleInitial, d.lastName]
            .filter(Boolean)
            .join(" ");

          return {
            id: doc.id,
            name: fullName || "Unknown Player",
            email: d.email || "No Email",
            sex: d.sex || "N/A",
            yearLevel: d.yearLevel || "N/A",
            checkpointsFinished: d.checkpointFinished || 0,
            totalHours: d.totalHoursPlayed || 0,
            currentChapter: d.currentChapter || "None",
            lastChapter: d.lastFinishedChapter || "None",
            puzzlesSolved: d.progress?.puzzlesSolved || 0,
          };
        }) as StudentData[];

        // Sort alphabetically by name
        data.sort((a, b) => a.name.localeCompare(b.name));

        setStudents(data);
        setLoading(false);
        setErrorMsg("");

        // Keep one assessments listener per visible student, drop stale ones
        const activeIds = new Set(data.map((s) => s.id));
        data.forEach((s) => subscribeToAssessments(s.id));
        unsubscribeStale(activeIds);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setErrorMsg(error.message);
        setLoading(false);
      }
    );

    return () => {
      unsub();
      // Clean up every per-student assessments listener on unmount
      Object.values(assessmentUnsubs.current).forEach((fn) => fn());
      assessmentUnsubs.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.name]);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = students.length;
  const avgHours =
    students.length > 0
      ? (
          students.reduce((sum, s) => sum + (s.totalHours || 0), 0) /
          students.length
        ).toFixed(1)
      : "0";
  const totalPuzzles = students.reduce(
    (sum, s) => sum + (s.puzzlesSolved || 0),
    0
  );
  const totalCheckpoints = students.reduce(
    (sum, s) => sum + (s.checkpointsFinished || 0),
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

      {/* Data Table */}
      <div className="card" style={{ marginTop: "1rem" }}>
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
          {errorMsg ? (
            <div className="table-empty">
              <span style={{ fontSize: 32 }}>⚠️</span>
              <p style={{ color: "var(--clr-danger)" }}>Database Error: {errorMsg}</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Please check your Firestore Security Rules.</p>
            </div>
          ) : loading ? (
            <div className="table-empty">
              <div className="spinner" style={{ margin: "0 auto" }} />
              <p>Loading student data…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="table-empty">
              <span style={{ fontSize: 32 }}>🎮</span>
              <p>
                {students.length === 0
                  ? "No students found for this instructor yet."
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
                  <th>Chap 1 Assessment</th>
                  <th>Chap 2 Assessment</th>
                  <th>Chap 3 Assessment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const a = assessments[s.id];
                  return (
                    <tr key={s.id}>
                      <td style={{ color: "var(--clr-text-muted)" }}>
                        {i + 1}
                      </td>
                      <td className="td-name">{s.name}</td>
                      <td className="td-email">{s.email}</td>
                      <td>{s.sex}</td>
                      <td>
                        <span className="badge badge-blue">
                          {s.yearLevel}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-green">
                          {s.checkpointsFinished}
                        </span>
                      </td>
                      <td>{formatTime(s.totalHours)}</td>
                      <td>
                        <span className="badge badge-purple">
                          {s.currentChapter}
                        </span>
                      </td>
                      <td>{s.lastChapter}</td>
                      <td>{s.puzzlesSolved}</td>
                      <td><AssessmentCell result={a?.chapter1} /></td>
                      <td><AssessmentCell result={a?.chapter2} /></td>
                      <td><AssessmentCell result={a?.chapter3} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
