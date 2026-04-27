import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const StarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hovered || value) ? "active" : "inactive"}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const Feedback: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating === 0) {
      setError("Please select a star rating before submitting.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a comment before submitting.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        rating,
        comment: comment.trim(),
        instructorId: currentUser?.uid,
        instructorName: profile?.name || "Unknown Instructor",
        instructorEmail: currentUser?.email,
        submittedAt: serverTimestamp(),
      });
      setSuccess(true);
      setRating(0);
      setComment("");
    } catch {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Submit Feedback</h1>
        <p>Help us improve the Rizal Through Play monitoring system.</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">⭐ Rate Your Experience</span>
          </div>
          <div className="card-body">
            {success && (
              <div className="alert alert-success" style={{ marginBottom: 20 }}>
                ✅ Thank you for your feedback! Your response has been recorded.
              </div>
            )}
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Overall Rating</label>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--clr-warning)",
                      fontWeight: 600,
                    }}
                  >
                    {RATING_LABELS[rating]}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Comments & Suggestions</label>
                <textarea
                  rows={5}
                  placeholder="Share your thoughts on the monitoring system, features you'd like to see, or any issues you encountered…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Submitting…" : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
