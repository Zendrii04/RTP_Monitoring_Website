import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Password validation helper
const validatePassword = (pw: string) => {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(pw)) errors.push("At least 1 uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("At least 1 lowercase letter");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("At least 1 special character");
  return errors;
};

const getStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const Signup: React.FC = () => {
  const { signup, checkFieldUnique } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    contactNumber: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email address";
    if (!formData.contactNumber.trim())
      newErrors.contactNumber = "Contact number is required";
    if (!formData.birthDate) newErrors.birthDate = "Birth date is required";

    const pwErrors = validatePassword(formData.password);
    if (pwErrors.length > 0) newErrors.password = pwErrors.join(", ");
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      // ── Uniqueness checks before creating the account ────────────────
      const nameUnique = await checkFieldUnique("name", formData.name);
      if (!nameUnique) {
        setGlobalError(
          `The full name "${formData.name}" is already used by another instructor account. Please use a different name.`
        );
        setLoading(false);
        return;
      }
      const usernameUnique = await checkFieldUnique("username", formData.username);
      if (!usernameUnique) {
        setGlobalError(
          `The username "${formData.username}" is already taken. Please choose a different username.`
        );
        setLoading(false);
        return;
      }
      // ──────────────────────────────────────────────────────────────────

      await signup(formData.email, formData.password, {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        contactNumber: formData.contactNumber,
        birthDate: formData.birthDate,
      });
      navigate("/");
    } catch (err: any) {
      console.error("Signup error:", err);
      setGlobalError(
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : `Error: ${err.message || err.code || "Failed to create account. Please try again."}`
      );
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(formData.password);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo-area">
          <div className="auth-logo">RTP</div>
          <h1>Create Instructor Account</h1>
          <p>Rizal Through Play — Monitoring System</p>
        </div>

        {globalError && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{globalError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className={`form-group ${errors.name ? "error" : ""}`}>
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Juan dela Cruz"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className={`form-group ${errors.username ? "error" : ""}`}>
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="instructor01"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>
          </div>

          <div className={`form-group ${errors.email ? "error" : ""}`}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="instructor@school.edu.ph"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className={`form-group ${errors.contactNumber ? "error" : ""}`}>
              <label>Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                placeholder="09xx-xxx-xxxx"
                value={formData.contactNumber}
                onChange={handleChange}
              />
              {errors.contactNumber && <span className="form-error">{errors.contactNumber}</span>}
            </div>
            <div className={`form-group ${errors.birthDate ? "error" : ""}`}>
              <label>Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
              {errors.birthDate && <span className="form-error">{errors.birthDate}</span>}
            </div>
          </div>

          <div className={`form-group ${errors.password ? "error" : ""}`}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 8 chars, 1 upper, 1 lower, 1 special"
              value={formData.password}
              onChange={handleChange}
            />
            {formData.password && (
              <div className="strength-bar">
                <div className={`strength-fill strength-${strength}`} />
              </div>
            )}
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className={`form-group ${errors.confirmPassword ? "error" : ""}`}>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
