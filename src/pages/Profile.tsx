import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const validatePassword = (pw: string) => {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(pw)) errors.push("At least 1 uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("At least 1 lowercase letter");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("At least 1 special character");
  return errors;
};

const Profile: React.FC = () => {
  const { profile, updateProfile, updateUserEmail, updateUserPassword, uploadProfilePhoto, checkFieldUnique, currentUser } =
    useAuth();

  const [username, setUsername] = useState(profile?.username || "");
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "IN";

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      await uploadProfilePhoto(file);
      setProfileSuccess("Profile photo updated!");
    } catch (err: any) {
      console.error("Photo upload error:", err);
      setProfileError("Failed to upload photo: " + (err.message || "Please check your Firebase Storage rules."));
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    // ── Uniqueness checks ──────────────────────────────────────────────
    const uid = currentUser?.uid;
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (trimmedName !== profile?.name) {
      const nameUnique = await checkFieldUnique("name", trimmedName, uid);
      if (!nameUnique) {
        setProfileError(
          `The full name "${trimmedName}" is already used by another instructor account. Please use a different name.`
        );
        return;
      }
    }

    if (trimmedUsername !== profile?.username) {
      const usernameUnique = await checkFieldUnique("username", trimmedUsername, uid);
      if (!usernameUnique) {
        setProfileError(
          `The username "${trimmedUsername}" is already taken. Please choose a different username.`
        );
        return;
      }
    }
    // ──────────────────────────────────────────────────────────────────

    let emailUpdated = true;
    let emailErrorMsg = "";

    try {
      const updates: Record<string, string> = { username: trimmedUsername, name: trimmedName };
      
      if (email !== profile?.email) {
        try {
          await updateUserEmail(email);
          updates.email = email;
        } catch (err: any) {
          console.error("Email update error:", err);
          emailUpdated = false;
          emailErrorMsg = err.code === "auth/requires-recent-login"
            ? "Firebase requires you to log out and log back in to change your email."
            : err.message || "Failed to update email.";
        }
      }

      await updateProfile(updates);
      
      if (!emailUpdated) {
        setProfileError(`Name & Username saved, but... ${emailErrorMsg}`);
      } else {
        setProfileSuccess("Profile updated successfully!");
      }
    } catch (err: any) {
      console.error("Profile save error:", err);
      setProfileError("Failed to save profile: " + (err.message || ""));
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      setPasswordError(errors.join(", "));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    try {
      await updateUserPassword(newPassword);
      setPasswordSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Failed to update password. Please re-login and try again.");
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <h1>Profile Settings</h1>
        <p>Manage your instructor account details.</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          maxWidth: 900,
        }}
      >
        {/* Profile Info Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👤 Account Info</span>
          </div>
          <div className="card-body">
            {/* Profile Photo */}
            <div className="profile-photo-area">
              <div className="profile-photo-ring">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile photo" />
                ) : (
                  <div className="profile-photo-placeholder">{initials}</div>
                )}
                <button
                  className="photo-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoLoading}
                  title="Change profile photo"
                >
                  {photoLoading ? "…" : "✎"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
              <span style={{ fontSize: 12, color: "var(--clr-text-secondary)" }}>
                Click the pencil to change photo
              </span>
            </div>

            {profileSuccess && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@school.edu.ph"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </form>
          </div>
        </div>

        {/* Password Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔒 Change Password</span>
          </div>
          <div className="card-body">
            {passwordSuccess && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                {passwordError}
              </div>
            )}
            <form onSubmit={handlePasswordSave} className="auth-form">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 chars, 1 upper, 1 lower, 1 special"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
              <button type="submit" className="btn btn-secondary">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
