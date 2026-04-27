import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";

interface InstructorProfile {
  name: string;
  username: string;
  email: string;
  contactNumber: string;
  birthDate: string;
  photoURL: string;
  role: "instructor";
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  profile: InstructorProfile | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    data: Omit<InstructorProfile, "role" | "createdAt" | "photoURL">
  ) => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  updateProfile: (data: Partial<InstructorProfile>) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const snap = await getDoc(doc(db, "instructors", uid));
    if (snap.exists()) setProfile(snap.data() as InstructorProfile);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await fetchProfile(user.uid);
      else setProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (
    email: string,
    password: string,
    data: Omit<InstructorProfile, "role" | "createdAt" | "photoURL">
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profileData: InstructorProfile = {
      ...data,
      email,
      photoURL: "",
      role: "instructor",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "instructors", cred.user.uid), profileData);
    setProfile(profileData);
  };

  const login = async (email: string, password: string, remember: boolean) => {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
  const updateUserEmail = (email: string) =>
    updateEmail(currentUser!, email);
  const updateUserPassword = (password: string) =>
    updatePassword(currentUser!, password);

  const updateProfile = async (data: Partial<InstructorProfile>) => {
    if (!currentUser) return;
    await updateDoc(doc(db, "instructors", currentUser.uid), data);
    setProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  const uploadProfilePhoto = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error("Not authenticated");
    const storageRef = ref(storage, `profilePhotos/${currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateProfile({ photoURL: url });
    return url;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        signup,
        login,
        logout,
        resetPassword,
        updateUserEmail,
        updateUserPassword,
        updateProfile,
        uploadProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
