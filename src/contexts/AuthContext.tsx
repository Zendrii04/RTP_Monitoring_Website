import {
  createContext,
  useContext,
  useEffect,
  useRef,
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

  // Prevents onAuthStateChanged from running fetchProfile mid-signup,
  // which would find no Firestore doc yet and cause a redirect to login.
  const isSigningUp = useRef(false);

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
        // Skip profile fetch during signup — the signup function handles it directly
        if (user && !isSigningUp.current) {
          await fetchProfile(user.uid);
        } else if (!user) {
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
    // Block onAuthStateChanged from interfering while we write to Firestore
    isSigningUp.current = true;

    let cred;
    try {
      // 1. Create the Firebase Auth user
      cred = await createUserWithEmailAndPassword(auth, email, password);

      const profileData: InstructorProfile = {
        ...data,
        email,
        photoURL: "",
        role: "instructor",
        createdAt: new Date().toISOString(),
        uid: cred.user.uid,
      };

      // 2. Write to `instructors` collection (website dashboard + game compatibility)
      await setDoc(doc(db, "instructors", cred.user.uid), profileData);

      // 3. Set profile in state so the UI transitions to dashboard immediately
      setProfile(profileData);
      setCurrentUser(cred.user);
      setLoading(false);

    } catch (err) {
      // If anything fails after the auth user was created, clean it up
      if (cred) {
        await deleteUser(cred.user).catch(console.error);
      }
      throw err;
    } finally {
      isSigningUp.current = false;
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

  const updateProfile = async (data: Partial<InstructorProfile>) => {
    if (!currentUser) return;
    await setDoc(doc(db, "instructors", currentUser.uid), data, { merge: true });
    setProfile((prev) => (prev ? { ...prev, ...data } : (data as InstructorProfile)));
  };

  /**
   * Returns true if the value is unique (not used by any other instructor).
   * Pass excludeUid to ignore the current user's own document.
   * NOTE: Only call this when the user is already authenticated (e.g. from Settings).
   */
  const checkFieldUnique = async (
    field: "name" | "username",
    value: string,
    excludeUid?: string
  ): Promise<boolean> => {
    try {
      const q = query(
        collection(db, "instructors"),
        where(field, "==", value.trim())
      );
      const snap = await getDocs(q);
      return snap.empty || snap.docs.every((d) => d.id === excludeUid);
    } catch {
      // If security rules block the query (e.g. unauthenticated), assume unique
      return true;
    }
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
