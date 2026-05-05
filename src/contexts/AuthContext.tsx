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
  deleteUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  uid?: string;
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
  checkFieldUnique: (field: "name" | "username", value: string, excludeUid?: string) => Promise<boolean>;
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

  // Fetch instructor profile from 'instructors' collection
  const fetchProfile = async (uid: string) => {
    const snap = await getDoc(doc(db, "instructors", uid));
    if (snap.exists()) {
      setProfile(snap.data() as InstructorProfile);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          await fetchProfile(user.uid);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to restore session. Logging out...", err);
        setCurrentUser(null);
        setProfile(null);
        await signOut(auth).catch(() => {});
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const signup = async (
    email: string,
    password: string,
    data: Omit<InstructorProfile, "role" | "createdAt" | "photoURL">
  ) => {
    // 1. Create the user in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    try {
      // 2. Check uniqueness against 'instructors' collection
      const nameUnique = await checkFieldUnique("name", data.name);
      if (!nameUnique) {
        throw new Error(`The full name "${data.name}" is already used by another instructor account. Please use a different name.`);
      }
      const usernameUnique = await checkFieldUnique("username", data.username);
      if (!usernameUnique) {
        throw new Error(`The username "${data.username}" is already taken. Please choose a different username.`);
      }

      // 3. Save instructor profile to 'instructors' collection
      const profileData: InstructorProfile = {
        ...data,
        email,
        photoURL: "",
        role: "instructor",
        createdAt: new Date().toISOString(),
        uid: cred.user.uid,
      };
      await setDoc(doc(db, "instructors", cred.user.uid), profileData);
      setProfile(profileData);
    } catch (err) {
      // Rollback: delete the Auth user if Firestore write fails
      await deleteUser(cred.user).catch(console.error);
      throw err;
    }
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
  const updateUserEmail = (email: string) => updateEmail(currentUser!, email);
  const updateUserPassword = (password: string) => updatePassword(currentUser!, password);

  // Update instructor profile in 'instructors' collection
  const updateProfile = async (data: Partial<InstructorProfile>) => {
    if (!currentUser) return;
    await setDoc(doc(db, "instructors", currentUser.uid), data, { merge: true });
    setProfile((prev) => (prev ? { ...prev, ...data } : (data as InstructorProfile)));
  };

  /**
   * Returns true if the value is unique (not used by any other instructor).
   * Pass excludeUid to ignore the current user's own document.
   */
  const checkFieldUnique = async (
    field: "name" | "username",
    value: string,
    excludeUid?: string
  ): Promise<boolean> => {
    const q = query(
      collection(db, "instructors"),
      where(field, "==", value.trim())
    );
    const snap = await getDocs(q);
    return snap.empty || snap.docs.every((d) => d.id === excludeUid);
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
        checkFieldUnique,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
