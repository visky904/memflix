import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { supabase, BUCKET } from "./supabase";

// ── Firestore + Storage helpers ─────────────────────────────────────
// Same function names/signatures as before (dbGetAll/dbPut/dbDelete/...)
// so the rest of the app below didn't need to change — only what's
// "under the hood" changed: data now lives in Firebase, shared by
// everyone who opens the link, instead of one browser's IndexedDB.

async function dbGetAll(storeName) {
  const snap = await getDocs(collection(db, storeName));
  return snap.docs.map((d) => d.data());
}

async function dbPut(storeName, item) {
  await setDoc(doc(db, storeName, item.id), item, { merge: true });
}

async function dbDelete(storeName, id) {
  await deleteDoc(doc(db, storeName, id));
}

async function dbGetCategories() {
  return dbGetAll("categories");
}

async function dbAddCategory(name) {
  const id = `cat_${Date.now()}`;
  await dbPut("categories", { id, name });
  return id;
}

// Upload any File/Blob to Supabase Storage and return its public URL
async function uploadToStorage(fileBlob, path) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, fileBlob, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Upload music for a category to Storage; metadata + URL go to Firestore.
// (Field is still called "base64" everywhere it's consumed below — it's
// just a Storage URL now instead of an actual base64 string — kept the
// name so nothing downstream needed renaming.)
async function dbSaveMusic(categoryId, fileBlob, fileName) {
  const path = `music/${categoryId}/${Date.now()}_${fileName}`;
  const url = await uploadToStorage(fileBlob, path);
  const id = `music_${categoryId}`;
  const track = { id, categoryId, base64: url, fileName, storagePath: path };
  await dbPut("musicTracks", track);
  return track;
}

// ── Constants ──────────────────────────────────────────────────────
const PALETTE = [
  { bg: "#831010", text: "#f5c6c6", accent: "#e50914" },
  { bg: "#0d5c8c", text: "#bde0f5", accent: "#1e90ff" },
  { bg: "#1a5c2e", text: "#b8edc8", accent: "#2ecc71" },
  { bg: "#5b2d8c", text: "#d8b8f5", accent: "#9b59b6" },
  { bg: "#8c5e0d", text: "#f5d8a0", accent: "#f39c12" },
  { bg: "#1a4a5c", text: "#a8d8e8", accent: "#00bcd4" },
];

const DEFAULT_PROFILES = [
  { id: "p2022", year: "2022", colorIdx: 0, order: 0 },
  { id: "p2023", year: "2023", colorIdx: 1, order: 1 },
  { id: "p2024", year: "2024", colorIdx: 2, order: 2 },
  { id: "p2025", year: "2025", colorIdx: 3, order: 3 },
];

// ── Styles ─────────────────────────────────────────────────────────
const S = {
  app: {
    background: "#0a0a0a",
    minHeight: "100vh",
    fontFamily: "'Georgia', serif",
    color: "#e5e5e5",
    overflow: "hidden",
  },
  intro: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh",
    background: "radial-gradient(ellipse at 50% 0%, #1a0808 0%, #0a0a0a 70%)",
    padding: "2rem",
  },
  logo: {
    fontSize: "clamp(32px, 6vw, 56px)", fontWeight: "700",
    color: "#e50914", letterSpacing: "6px",
    fontFamily: "'Georgia', serif", marginBottom: "4px",
  },
  sub: { fontSize: "13px", color: "#666", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "3rem" },
  profilesGrid: {
    display: "flex", gap: "clamp(1rem, 3vw, 2rem)",
    flexWrap: "wrap", justifyContent: "center", maxWidth: "700px",
  },
  profileCard: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "10px", cursor: "pointer", transition: "transform 0.2s",
    padding: "0.5rem",
  },
  profileAvatar: {
    width: "clamp(70px, 12vw, 100px)", height: "clamp(70px, 12vw, 100px)",
    borderRadius: "10px", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "clamp(16px, 3vw, 24px)",
    fontWeight: "600", letterSpacing: "1px", border: "2px solid transparent",
    transition: "border-color 0.2s, transform 0.2s",
  },
  profileLabel: { fontSize: "13px", color: "#888", transition: "color 0.2s" },
  nav: {
    position: "sticky", top: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.75rem clamp(1rem, 4vw, 2rem)",
    background: "rgba(10,10,10,0.95)", backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  navLeft: { display: "flex", alignItems: "center", gap: "12px" },
  navLogo: { fontSize: "18px", fontWeight: "700", color: "#e50914", letterSpacing: "3px" },
  navAvatar: {
    width: "30px", height: "30px", borderRadius: "6px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "11px", fontWeight: "600",
  },
  backBtn: {
    background: "none", border: "1px solid rgba(255,255,255,0.2)",
    color: "#aaa", padding: "5px 12px", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer", letterSpacing: "1px",
  },
  searchWrap: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px", padding: "6px 14px",
  },
  searchInput: {
    background: "none", border: "none", color: "#e5e5e5",
    fontSize: "13px", outline: "none", width: "clamp(80px, 15vw, 160px)",
    fontFamily: "'Georgia', serif",
  },
  hero: {
    position: "relative", width: "100%",
    height: "clamp(220px, 40vw, 400px)", overflow: "hidden",
    background: "#111",
  },
  heroMedia: {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    objectFit: "cover", opacity: 0.55,
  },
  heroGradient: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.4) 50%, transparent 100%)",
  },
  heroInfo: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "clamp(1rem, 3vw, 2rem)",
  },
  heroBadge: {
    display: "inline-block", background: "#e50914", color: "#fff",
    fontSize: "10px", fontWeight: "600", padding: "3px 10px",
    borderRadius: "3px", marginBottom: "8px", letterSpacing: "2px", textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: "clamp(18px, 3.5vw, 32px)", fontWeight: "700",
    marginBottom: "6px", textShadow: "0 2px 8px rgba(0,0,0,0.8)",
    maxWidth: "600px",
  },
  heroSummary: {
    fontSize: "clamp(12px, 1.8vw, 14px)", color: "#ccc",
    maxWidth: "480px", lineHeight: "1.6", marginBottom: "12px",
    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
    display: "-webkit-box", WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  heroActions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  heroBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px clamp(12px, 2vw, 20px)", borderRadius: "5px",
    fontSize: "clamp(12px, 1.5vw, 14px)", fontWeight: "600",
    cursor: "pointer", border: "none", transition: "opacity 0.2s, transform 0.15s",
    letterSpacing: "0.5px",
  },
  section: { padding: "1.2rem clamp(1rem, 4vw, 2rem)" },
  sectionTitle: {
    fontSize: "14px", fontWeight: "600", color: "#aaa",
    letterSpacing: "2px", textTransform: "uppercase", marginBottom: "1rem",
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(clamp(110px, 18vw, 160px), 1fr))",
    gap: "10px",
  },
  mediaCard: {
    cursor: "pointer", borderRadius: "8px", overflow: "hidden",
    border: "2px solid transparent", transition: "transform 0.18s, border-color 0.18s",
    background: "#1a1a1a",
  },
  mediaThumb: {
    width: "100%", aspectRatio: "16/9", background: "#222",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", position: "relative",
  },
  mediaLabel: {
    fontSize: "11px", color: "#ccc", padding: "6px 8px 8px",
    background: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  addBtn: {
    width: "100%", padding: "14px",
    border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: "8px",
    background: "none", color: "#666", fontSize: "13px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    letterSpacing: "1px", transition: "border-color 0.2s, color 0.2s",
    fontFamily: "'Georgia', serif",
  },
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.88)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 200,
    padding: "1rem",
  },
  modal: {
    background: "#181818", borderRadius: "12px",
    padding: "1.5rem", width: "100%", maxWidth: "380px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  modalTitle: { fontSize: "16px", fontWeight: "600", marginBottom: "1rem", color: "#e5e5e5" },
  label: { fontSize: "11px", color: "#888", display: "block", marginBottom: "4px", marginTop: "12px", letterSpacing: "1px", textTransform: "uppercase" },
  input: {
    width: "100%", background: "#222", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px", color: "#e5e5e5", fontSize: "13px", padding: "8px 10px",
    fontFamily: "'Georgia', serif", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", background: "#222", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px", color: "#e5e5e5", fontSize: "13px", padding: "8px 10px",
    minHeight: "80px", resize: "vertical", fontFamily: "'Georgia', serif",
    boxSizing: "border-box",
  },
  fileBtn: {
    width: "100%", padding: "10px",
    border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: "6px",
    background: "none", color: "#888", fontSize: "12px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "6px", marginTop: "4px", fontFamily: "'Georgia', serif",
    transition: "border-color 0.2s, color 0.2s",
  },
  modalActions: { display: "flex", gap: "8px", marginTop: "1.2rem" },
  slideshowOverlay: {
    position: "fixed", inset: 0, background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 300, flexDirection: "column",
  },
  empty: { color: "#444", fontSize: "13px", padding: "2rem 0", gridColumn: "1/-1", textAlign: "center" },
};

// ── Confetti Component ─────────────────────────────────────────────
function ConfettiPiece({ style }) {
  return <div style={style} />;
}

// ── Intro Animation ────────────────────────────────────────────────
function IntroAnimation({ onDone }) {
  const [phase, setPhase] = useState("zoom"); // zoom | burst | fade

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burst"), 1200);
    const t2 = setTimeout(() => setPhase("fade"), 2800);
    const t3 = setTimeout(() => onDone(), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const confettiColors = ["#e50914", "#fff", "#ffb81c", "#1e90ff", "#ff69b4", "#00ff88", "#ff6600", "#cc00ff"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: `${6 + Math.random() * 10}px`,
    rotation: Math.random() * 720,
    isStreamer: i % 5 === 0,
  }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, overflow: "hidden",
      opacity: phase === "fade" ? 0 : 1,
      transition: phase === "fade" ? "opacity 0.8s ease-out" : "none",
    }}>
      <style>{`
        @keyframes mZoomIn {
          0% { transform: scale(0.05); opacity: 0; filter: blur(20px); }
          60% { transform: scale(1.15); opacity: 1; filter: blur(0); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(var(--rot)); opacity: 0.3; }
        }
        @keyframes streamerFall {
          0% { transform: translateY(-20px) rotate(0deg) scaleX(1); opacity: 1; }
          50% { transform: translateY(50vh) rotate(180deg) scaleX(0.8); }
          100% { transform: translateY(110vh) rotate(360deg) scaleX(1.2); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 40px rgba(229,9,20,0.6), 0 0 80px rgba(229,9,20,0.3); }
          50% { text-shadow: 0 0 80px rgba(229,9,20,1), 0 0 160px rgba(229,9,20,0.6), 0 0 240px rgba(229,9,20,0.3); }
        }
        .netflix-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* M Logo */}
      <div style={{
        fontSize: "clamp(120px, 25vw, 220px)",
        fontWeight: "900",
        color: "#e50914",
        fontFamily: "'Georgia', serif",
        letterSpacing: "-8px",
        animation: "mZoomIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards, glowPulse 1s ease-in-out 1.2s infinite",
        userSelect: "none",
        position: "relative", zIndex: 2,
      }}>M</div>

      {/* Confetti & Streamers */}
      {phase !== "zoom" && pieces.map((p) => (
        <div key={p.id} style={{
          position: "absolute",
          left: p.left,
          top: "-30px",
          width: p.isStreamer ? "4px" : p.size,
          height: p.isStreamer ? `${40 + Math.random() * 60}px` : p.size,
          background: p.color,
          borderRadius: p.isStreamer ? "2px" : "2px",
          "--rot": `${p.rotation}deg`,
          animation: `${p.isStreamer ? "streamerFall" : "confettiFall"} ${p.duration} ${p.delay} ease-in forwards`,
          zIndex: 1,
          opacity: 0,
        }} />
      ))}

      {/* Tagline */}
      {phase === "burst" && (
        <div style={{
          position: "absolute", bottom: "20%", left: "50%",
          transform: "translateX(-50%)",
          color: "#aaa", fontSize: "clamp(12px, 2vw, 16px)",
          letterSpacing: "6px", textTransform: "uppercase",
          animation: "mZoomIn 0.6s ease-out forwards",
          whiteSpace: "nowrap",
        }}>
          Your Memory Archive
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────
export default function Memflix() {
  const [profiles, setProfiles] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [screen, setScreen] = useState("intro");
  const [activeProfile, setActiveProfile] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [heroItem, setHeroItem] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalState, setModalState] = useState({ title: "", summary: "", category: "", fileURL: null, fileType: null, fileName: "" });
  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState([]); // [{ id, title, fileURL, fileType, fileName }]
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSummary, setBulkSummary] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const [slideshowPlay, setSlideshowPlay] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [adminTargetProfile, setAdminTargetProfile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [modeSelectionProfile, setModeSelectionProfile] = useState(null);

  // Music state
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [categoryMusicTracks, setCategoryMusicTracks] = useState({});
  const [activeMusicCategory, setActiveMusicCategory] = useState(null);
  const audioRef = useRef(null);
  const musicSavedTimeRef = useRef(0); // persists playback position across photo/video switches
  const currentMusicCatRef = useRef(null); // track what category is currently loaded

  // Viewing state
  const [viewingPhoto, setViewingPhoto] = useState(null); // { id, idx }
  const [isViewingPhoto, setIsViewingPhoto] = useState(false); // true = showing photo
  const [viewerCategory, setViewerCategory] = useState(null); // category locked when viewer opens

  // Idle slideshow
  const [isIdle, setIsIdle] = useState(false);
  const [idleSlideshowIdx, setIdleSlideshowIdx] = useState(0);
  const [idleSlides, setIdleSlides] = useState([]);

  // Intro animation
  const [showIntro, setShowIntro] = useState(true);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);

  const idleTimer = useRef(null);
  const idleSlideshowTimer = useRef(null);
  const slideshowTimer = useRef(null);
  const fileInputRef = useRef(null);
  const musicUploadRef = useRef(null);

  // ── Load from Firebase (seed once if empty, then listen live) ────
  useEffect(() => {
    (async () => {
      // One-time check: seed defaults only if this is a totally fresh project
      let ps = await dbGetAll("profiles");
      let cats = await dbGetCategories();
      if (ps.length === 0) {
        for (const p of DEFAULT_PROFILES) await dbPut("profiles", p);
      }
      if (cats.length === 0) {
        const defaultCats = ["Featured", "Action", "Drama", "Comedy", "Family"];
        for (const cat of defaultCats) await dbAddCategory(cat);
      }
      setLoaded(true);
    })();

    // Live listeners — everyone viewing the link sees changes as they happen
    const unsubProfiles = onSnapshot(collection(db, "profiles"), (snap) => {
      const ps = snap.docs.map((d) => d.data());
      ps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setProfiles(ps);
    });
    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      setAllMedia(snap.docs.map((d) => d.data()));
    });
    const unsubMusic = onSnapshot(collection(db, "musicTracks"), (snap) => {
      const musicMap = {};
      snap.docs.forEach((d) => { musicMap[d.data().categoryId] = d.data(); });
      setCategoryMusicTracks(musicMap);
    });

    return () => { unsubProfiles(); unsubMedia(); unsubMusic(); };
  }, []);


  // ── Music Engine ─────────────────────────────────────────────────
  // The audio element persists. We manage when to play/pause based on:
  // - whether we're viewing a PHOTO (play) vs VIDEO (pause, save position)
  // - category changes (load new track, reset position)
  // - volume changes
  // - user-toggled mute

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  // Central music controller — runs whenever anything relevant changes
  useEffect(() => {
    if (!audioRef.current) return;
    const track = categoryMusicTracks[selectedCategory];

    if (track && track.base64 && !isAdminMode && screen === "browser" && !showMusicPrompt) {
      // Load a new track if category changed
      if (currentMusicCatRef.current !== selectedCategory) {
        currentMusicCatRef.current = selectedCategory;
        musicSavedTimeRef.current = 0;
        audioRef.current.src = track.base64;
        audioRef.current.currentTime = 0;
        setActiveMusicCategory(selectedCategory);
      }
      audioRef.current.volume = musicVolume;

      if (musicPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        musicSavedTimeRef.current = audioRef.current.currentTime;
        audioRef.current.pause();
      }
    } else {
      // No track, admin mode, prompt showing, or not on browser — pause
      audioRef.current.pause();
      if (!track || !track.base64) {
        currentMusicCatRef.current = null;
        setActiveMusicCategory(null);
      }
    }
  }, [selectedCategory, categoryMusicTracks, isAdminMode, screen, musicPlaying, showMusicPrompt]);

  // When switching between photo view and video view (pause on video fullscreen)
  useEffect(() => {
    if (!audioRef.current) return;
    const track = categoryMusicTracks[selectedCategory];
    if (!track || !track.base64 || isAdminMode) return;
    if (!isViewingPhoto && viewingPhoto !== null) {
      // fullscreen video — pause and save
      musicSavedTimeRef.current = audioRef.current.currentTime;
      audioRef.current.pause();
    }
  }, [isViewingPhoto, viewingPhoto]);



  // ── Idle Detection ───────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "browser" || isAdminMode) return;

    const resetIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (isIdle) setIsIdle(false);
      idleTimer.current = setTimeout(() => {
        // Pick random category with photos
        const photos = allMedia.filter((m) => m.fileType === "photo");
        if (photos.length === 0) return;
        const cats = [...new Set(photos.map((m) => m.category))];
        const randomCat = cats[Math.floor(Math.random() * cats.length)];
        const slides = photos.filter((m) => m.category === randomCat);
        setIdleSlides(slides);
        setIdleSlideshowIdx(0);
        setIsIdle(true);
      }, 30000);
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("click", resetIdle);
    window.addEventListener("touchstart", resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("click", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [screen, isAdminMode, allMedia, isIdle]);

  // Idle slideshow advance every 4 seconds
  useEffect(() => {
    if (!isIdle || idleSlides.length === 0) return;
    idleSlideshowTimer.current = setTimeout(() => {
      setIdleSlideshowIdx((i) => (i + 1) % idleSlides.length);
    }, 4000);
    return () => clearTimeout(idleSlideshowTimer.current);
  }, [isIdle, idleSlideshowIdx, idleSlides.length]);

  // ── Profile helpers ──────────────────────────────────────────────
  const profileMedia = (profileId, q = "", cat = "All") => {
    let ms = allMedia.filter((m) => m.profileId === profileId);
    if (cat !== "All") ms = ms.filter((m) => m.category === cat);
    if (!q) return ms;
    return ms.filter(
      (m) =>
        m.title.toLowerCase().includes(q.toLowerCase()) ||
        m.summary.toLowerCase().includes(q.toLowerCase())
    );
  };

  const getProfileCategories = (profileId) => {
    const cats = new Set(allMedia.filter((m) => m.profileId === profileId).map((m) => m.category || "Uncategorized"));
    return ["All", ...Array.from(cats).filter((c) => c !== "All").sort()];
  };

  const openProfile = (p) => setModeSelectionProfile(p);

  const confirmMode = (mode) => {
    if (mode === "admin") {
      setShowAdminPassword(true);
    } else {
      setActiveProfile(modeSelectionProfile);
      setIsAdminMode(false);
      setSearch("");
      setSelectedCategory("All");
      currentMusicCatRef.current = null;
      musicSavedTimeRef.current = 0;
      const first = allMedia.filter((m) => m.profileId === modeSelectionProfile.id)[0] || null;
      setHeroItem(first);
      // Determine initial state
      setIsViewingPhoto(false);
      setViewingPhoto(null);
      setScreen("browser");
      setModeSelectionProfile(null);
      setShowMusicPrompt(true);
    }
  };

  const submitAdminPassword = () => {
    if (adminPassword === "KeM_JNo0u2") {
      setActiveProfile(modeSelectionProfile);
      setIsAdminMode(true);
      setSearch("");
      setSelectedCategory("All");
      const first = allMedia.filter((m) => m.profileId === modeSelectionProfile.id)[0] || null;
      setHeroItem(first);
      setScreen("browser");
      setModeSelectionProfile(null);
      setAdminPassword("");
      setShowAdminPassword(false);
    } else {
      alert("Invalid password!");
      setAdminPassword("");
    }
  };

  const goBack = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    currentMusicCatRef.current = null;
    musicSavedTimeRef.current = 0;
    setActiveMusicCategory(null);
    setScreen("intro");
    setActiveProfile(null);
    setHeroItem(null);
    setIsAdminMode(false);
    setAdminTargetProfile(null);
    setModeSelectionProfile(null);
    setIsViewingPhoto(false);
    setViewingPhoto(null);
    setViewerCategory(null);
    setIsIdle(false);
  };

  // ── Photo viewer ─────────────────────────────────────────────────
  const getViewerPhotos = useCallback(() => {
    if (!activeProfile) return [];
    const cat = viewerCategory || selectedCategory;
    return profileMedia(activeProfile.id, search, cat).filter((m) => m.fileType === "photo");
  }, [activeProfile, allMedia, search, selectedCategory, viewerCategory]);

  const openPhotoViewer = (mediaItem) => {
    // Lock navigation to this item's category
    const cat = mediaItem.category || "Uncategorized";
    setViewerCategory(cat);
    const catPhotos = profileMedia(activeProfile.id, search, cat).filter((m) => m.fileType === "photo");
    const idx = catPhotos.findIndex((p) => p.id === mediaItem.id);
    setViewingPhoto({ id: mediaItem.id, idx: idx >= 0 ? idx : 0 });
    setIsViewingPhoto(true);
  };

  const closePhotoViewer = () => {
    setIsViewingPhoto(false);
    setViewingPhoto(null);
    setViewerCategory(null);
    // If we're in "All" view, switch back to banner song
    if (selectedCategory === "All" && audioRef.current && !isAdminMode) {
      const bannerTrack = categoryMusicTracks["banner"] || categoryMusicTracks["Banner"];
      if (bannerTrack && bannerTrack.base64) {
        if (currentMusicCatRef.current !== "banner") {
          currentMusicCatRef.current = "banner";
          musicSavedTimeRef.current = 0;
          audioRef.current.src = bannerTrack.base64;
          audioRef.current.volume = musicVolume;
          audioRef.current.currentTime = 0;
          setActiveMusicCategory("banner");
        }
        if (musicPlaying) audioRef.current.play().catch(() => {});
      } else {
        // No banner track — stop music
        audioRef.current.pause();
        currentMusicCatRef.current = null;
        setActiveMusicCategory(null);
      }
    }
  };

  const navigatePhoto = (dir) => {
    const photos = getViewerPhotos();
    if (photos.length === 0) return;
    setViewingPhoto((prev) => {
      const newIdx = (prev.idx + dir + photos.length) % photos.length;
      return { id: photos[newIdx].id, idx: newIdx };
    });
  };

  // Handle keyboard arrow navigation in photo viewer
  useEffect(() => {
    if (!isViewingPhoto) return;
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") navigatePhoto(-1);
      if (e.key === "ArrowRight") navigatePhoto(1);
      if (e.key === "Escape") closePhotoViewer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isViewingPhoto, getViewerPhotos]);

  // ── Add / Edit ───────────────────────────────────────────────────
  const openAdd = (item = null) => {
    if (item) {
      setEditItem(item);
      setModalState({ title: item.title, summary: item.summary, category: item.category || "", fileURL: item.fileURL, fileType: item.fileType, fileName: item.fileName || "" });
      setBulkFiles([]);
    } else {
      setEditItem(null);
      setModalState({ title: "", summary: "", category: "", fileURL: null, fileType: null, fileName: "" });
      setBulkFiles([]);
      setBulkCategory("");
      setBulkSummary("");
    }
    setShowAddModal(true);
  };

  // Build a lightweight local preview entry for a picked file.
  // The actual upload to Storage happens later, in saveMedia.
  const readFileAsEntry = (file) => ({
    id: `bf_${Date.now()}_${Math.random()}`,
    fileName: file.name,
    fileType: file.type.startsWith("video") ? "video" : "photo",
    fileURL: URL.createObjectURL(file), // local preview only
    file, // raw File — uploaded to Storage on save
    title: file.name.replace(/\.[^.]+$/, ""),
  });

  // Multi-file pick (bulk mode)
  const handleBulkFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const entries = files.map(readFileAsEntry);
    setBulkFiles((prev) => [...prev, ...entries]);
    e.target.value = "";
  };

  // Single-file pick (edit mode)
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setModalState((s) => ({
      ...s,
      fileURL: URL.createObjectURL(file), // local preview only
      fileObj: file, // raw File — uploaded to Storage on save
      fileType: file.type.startsWith("video") ? "video" : "photo",
      fileName: file.name,
      title: s.title || file.name.replace(/\.[^.]+$/, ""),
    }));
    e.target.value = "";
  };

  // Save edited single item
  const saveEditedMedia = async () => {
    const { title, summary, category, fileObj, fileType, fileName } = modalState;
    if (!title.trim()) return;
    let fileURL = editItem.fileURL;
    if (fileObj) {
      const path = `media/${editItem.profileId}/${Date.now()}_${fileName}`;
      fileURL = await uploadToStorage(fileObj, path);
    }
    const updated = {
      ...editItem,
      title: title.trim(),
      summary: summary.trim() || "A cherished memory.",
      category: category.trim() || "Uncategorized",
      ...(fileObj ? { fileURL, fileType, fileName } : {}),
    };
    await dbPut("media", updated);
    setAllMedia((prev) => prev.map((m) => (m.id === editItem.id ? updated : m)));
    if (heroItem?.id === editItem.id) setHeroItem(updated);
    setShowAddModal(false);
    setEditItem(null);
    setAdminTargetProfile(null);
  };

  // Save all bulk files at once — uploads each file to Storage, then writes metadata to Firestore
  const saveBulkMedia = async () => {
    if (bulkFiles.length === 0) return;
    setBulkUploading(true);
    const targetProfile = adminTargetProfile || activeProfile;
    const cat = bulkCategory.trim() || "Uncategorized";
    const sum = bulkSummary.trim() || "A cherished memory.";
    const newEntries = [];
    for (let i = 0; i < bulkFiles.length; i++) {
      const bf = bulkFiles[i];
      const path = `media/${targetProfile.id}/${Date.now()}_${i}_${bf.fileName}`;
      const fileURL = await uploadToStorage(bf.file, path);
      const entry = {
        id: `m_${Date.now()}_${i}`,
        profileId: targetProfile.id,
        title: (bf.title || bf.fileName).trim(),
        summary: sum,
        category: cat,
        fileURL,
        fileType: bf.fileType,
        fileName: bf.fileName,
        createdAt: Date.now() + i,
      };
      await dbPut("media", entry);
      newEntries.push(entry);
    }
    setAllMedia((prev) => [...prev, ...newEntries]);
    if (targetProfile.id === activeProfile?.id) setHeroItem(newEntries[newEntries.length - 1]);
    setBulkUploading(false);
    setBulkFiles([]);
    setBulkCategory("");
    setBulkSummary("");
    setShowAddModal(false);
    setAdminTargetProfile(null);
  };

  const saveMedia = editItem ? saveEditedMedia : saveBulkMedia;

  // ── Delete ───────────────────────────────────────────────────────
  const deleteMedia = async (id) => {
    await dbDelete("media", id);
    const updated = allMedia.filter((m) => m.id !== id);
    setAllMedia(updated);
    if (heroItem?.id === id) {
      const remaining = updated.filter((m) => m.profileId === activeProfile.id);
      setHeroItem(remaining[0] || null);
    }
    setConfirm(null);
  };

  const deleteProfile = async (id) => {
    await dbDelete("profiles", id);
    const mediaToDelete = allMedia.filter((m) => m.profileId === id);
    for (const m of mediaToDelete) await dbDelete("media", m.id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setAllMedia((prev) => prev.filter((m) => m.profileId !== id));
    setConfirm(null);
    if (screen === "browser" && activeProfile?.id === id) goBack();
  };

  // ── Add year ─────────────────────────────────────────────────────
  const [addingYear, setAddingYear] = useState(false);
  const addYear = async () => {
    if (addingYear) return; // prevent double-submit (Enter + click, double-click, etc.)
    const y = newYear.trim();
    if (!y) return;
    setAddingYear(true);
    try {
      const idx = profiles.length % PALETTE.length;
      const p = { id: `p_${Date.now()}`, year: y, colorIdx: idx, order: profiles.length };
      await dbPut("profiles", p);
      setProfiles((prev) => [...prev, p]);
      setShowAddYear(false);
      setNewYear("");
    } finally {
      setAddingYear(false);
    }
  };

  // ── Music upload ─────────────────────────────────────────────────
  const handleMusicUpload = async (categoryId, file) => {
    if (!file) return;
    try {
      const track = await dbSaveMusic(categoryId, file, file.name);
      setCategoryMusicTracks((prev) => ({ ...prev, [categoryId]: track }));
    } catch (err) {
      console.error("Failed to save music:", err);
    }
  };

  // ── Slideshow (manual) ───────────────────────────────────────────
  const currentMedia = activeProfile ? profileMedia(activeProfile.id, search, selectedCategory) : [];
  const startSlideshow = () => {
    if (currentMedia.length === 0) return;
    setSlideshowIdx(0);
    setSlideshowPlay(true);
    setShowSlideshow(true);
  };

  useEffect(() => {
    if (!showSlideshow || !slideshowPlay || currentMedia.length === 0) return;
    slideshowTimer.current = setTimeout(() => {
      setSlideshowIdx((i) => (i + 1) % currentMedia.length);
    }, 4000);
    return () => clearTimeout(slideshowTimer.current);
  }, [showSlideshow, slideshowPlay, slideshowIdx, currentMedia.length]);

  const ssItem = currentMedia[slideshowIdx];
  const pal = (p) => PALETTE[p?.colorIdx ?? 0];

  const viewerPhotos = getViewerPhotos();
  const currentViewerPhoto = viewingPhoto ? viewerPhotos[viewingPhoto.idx] : null;

  if (!loaded) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ color: "#e50914", fontSize: "14px", letterSpacing: "3px" }}>LOADING…</div>
    </div>
  );

  return (
    <div style={S.app}>
      {/* Persistent Audio */}
      <audio
        ref={audioRef}
        loop
        onEnded={() => { if (audioRef.current) audioRef.current.play().catch(() => {}); }}
      />

      {/* ── INTRO ANIMATION ──────────────────────── */}
      {showIntro && <IntroAnimation onDone={() => setShowIntro(false)} />}

      {/* ── STICKY MUTE BUTTON (fixed to viewport, stays put on scroll) ──── */}
      {screen === "browser" && !isAdminMode && categoryMusicTracks[selectedCategory] && (
        <button
          style={{
            position: "fixed", top: "14px", right: "14px", zIndex: 9999,
            width: "44px", height: "44px", borderRadius: "50%",
            border: "1px solid rgba(229,9,20,0.5)",
            background: "rgba(10,10,10,0.85)", backdropFilter: "blur(6px)",
            color: musicPlaying ? "#e50914" : "#666",
            fontSize: "18px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
            transition: "transform 0.15s, color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onClick={() => setMusicPlaying((p) => !p)}
          title={musicPlaying ? "Mute music" : "Unmute music"}
        >
          {musicPlaying ? "🔊" : "🔇"}
        </button>
      )}

      {/* ── IDLE SLIDESHOW ───────────────────────── */}
      {isIdle && idleSlides.length > 0 && (
        <div
          style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, cursor: "pointer" }}
          onClick={() => setIsIdle(false)}
        >
          {idleSlides[idleSlideshowIdx % idleSlides.length]?.fileURL && (
            <img
              src={idleSlides[idleSlideshowIdx % idleSlides.length].fileURL}
              alt="idle"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
            />
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)",
          }} />
          <div style={{ position: "absolute", top: "24px", left: "50%", transform: "translateX(-50%)", color: "#e50914", fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase" }}>
            MEMFLIX
          </div>
          <div style={{ position: "absolute", bottom: "60px", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
            <div style={{ fontSize: "clamp(14px, 2.5vw, 22px)", fontWeight: "600", marginBottom: "6px", color: "#fff" }}>
              {idleSlides[idleSlideshowIdx % idleSlides.length]?.title}
            </div>
            <div style={{ fontSize: "12px", color: "#aaa" }}>
              {idleSlides[idleSlideshowIdx % idleSlides.length]?.category}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", color: "#555", fontSize: "11px", letterSpacing: "2px" }}>
            TAP ANYWHERE TO CONTINUE
          </div>
          {/* Progress dots */}
          <div style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" }}>
            {idleSlides.map((_, i) => (
              <div key={i} style={{
                width: i === idleSlideshowIdx % idleSlides.length ? "20px" : "6px",
                height: "4px", borderRadius: "2px",
                background: i === idleSlideshowIdx % idleSlides.length ? "#e50914" : "rgba(255,255,255,0.3)",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── PHOTO VIEWER ─────────────────────────── */}
      {isViewingPhoto && currentViewerPhoto && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.97)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", zIndex: 800,
          }}
          onClick={closePhotoViewer}
        >
          {/* Close button */}
          <button
            style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(229,9,20,0.8)", border: "none", color: "#fff",
              width: "42px", height: "42px", borderRadius: "50%", cursor: "pointer",
              fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 802,
            }}
            onClick={(e) => { e.stopPropagation(); closePhotoViewer(); }}
          >×</button>

          {/* Music indicator */}
          {(categoryMusicTracks[activeMusicCategory] || categoryMusicTracks[selectedCategory]) && (
            <div style={{
              position: "absolute", top: "20px", left: "20px",
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(229,9,20,0.2)", border: "1px solid rgba(229,9,20,0.4)",
              borderRadius: "20px", padding: "6px 14px", fontSize: "11px", color: "#e50914",
              letterSpacing: "1px",
            }}>
              <span style={{ animation: musicPlaying ? "none" : "none" }}>
                {musicPlaying ? "♫" : "♪"}
              </span>
              {(categoryMusicTracks[activeMusicCategory] || categoryMusicTracks[selectedCategory])?.fileName || "Music playing"}
            </div>
          )}

          {/* Image */}
          <div
            style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, width: "100%", maxWidth: "90vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={currentViewerPhoto.id}
              src={currentViewerPhoto.fileURL}
              alt={currentViewerPhoto.title}
              style={{
                maxWidth: "calc(100% - 140px)", maxHeight: "75vh",
                objectFit: "contain", borderRadius: "4px",
                transition: "opacity 0.2s",
              }}
            />

            {/* Left Arrow */}
            {viewerPhotos.length > 1 && (
              <button
                style={{
                  position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
                  background: "rgba(229,9,20,0.7)", border: "none", color: "#fff",
                  width: "52px", height: "52px", borderRadius: "50%", cursor: "pointer",
                  fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", zIndex: 801,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e50914"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(229,9,20,0.7)"}
                onClick={(e) => { e.stopPropagation(); navigatePhoto(-1); }}
              >‹</button>
            )}

            {/* Right Arrow */}
            {viewerPhotos.length > 1 && (
              <button
                style={{
                  position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                  background: "rgba(229,9,20,0.7)", border: "none", color: "#fff",
                  width: "52px", height: "52px", borderRadius: "50%", cursor: "pointer",
                  fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", zIndex: 801,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e50914"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(229,9,20,0.7)"}
                onClick={(e) => { e.stopPropagation(); navigatePhoto(1); }}
              >›</button>
            )}
          </div>

          {/* Photo info + counter — clicking here also closes viewer */}
          <div
            style={{ width: "100%", padding: "16px 20px", textAlign: "center" }}
          >
            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>{currentViewerPhoto.title}</div>
            <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "10px", maxWidth: "500px", margin: "0 auto 10px" }}>{currentViewerPhoto.summary}</div>
            <div style={{ fontSize: "11px", color: "#555" }}>
              {viewingPhoto.idx + 1} / {viewerPhotos.length} · {currentViewerPhoto.category || "Uncategorized"}
            </div>
          </div>
        </div>
      )}

      {/* ── INTRO SCREEN ─────────────────────────── */}
      {screen === "intro" && (
        <div style={S.intro}>
          <div style={S.logo}>MEMFLIX</div>
          <div style={S.sub}>Your personal memory archive</div>
          <div style={S.profilesGrid}>
            {profiles.map((p) => {
              const c = pal(p);
              return (
                <div key={p.id} style={S.profileCard}
                  onMouseEnter={(e) => { e.currentTarget.querySelector(".pa").style.borderColor = "#fff"; e.currentTarget.querySelector(".pl").style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.querySelector(".pa").style.borderColor = "transparent"; e.currentTarget.querySelector(".pl").style.color = "#888"; }}>
                  <div className="pa" style={{ ...S.profileAvatar, background: c.bg, color: c.text }}
                    onClick={() => openProfile(p)}>
                    {p.year}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="pl" style={S.profileLabel}>{p.year}</span>
                    <button style={{ background: "none", border: "none", color: "#e50914", cursor: "pointer", fontSize: "12px", padding: "0 2px" }}
                      title="Delete year"
                      onClick={() => setConfirm({ type: "profile", id: p.id, label: p.year })}>×</button>
                  </div>
                </div>
              );
            })}
            <div style={S.profileCard}
              onMouseEnter={(e) => { e.currentTarget.querySelector(".pa2").style.borderColor = "#e50914"; }}
              onMouseLeave={(e) => { e.currentTarget.querySelector(".pa2").style.borderColor = "rgba(255,255,255,0.1)"; }}
              onClick={() => setShowAddYear(true)}>
              <div className="pa2" style={{ ...S.profileAvatar, background: "#111", color: "#555", border: "2px dashed rgba(255,255,255,0.1)", fontSize: "32px", transition: "border-color 0.2s" }}>+</div>
              <span style={S.profileLabel}>Add account</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN PASSWORD MODAL ──────────────────── */}
      {showAdminPassword && (
        <div style={S.modalOverlay} onClick={() => { setShowAdminPassword(false); setAdminPassword(""); }}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Admin Password</div>
            <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "1rem", lineHeight: 1.6 }}>
              Enter password to access admin mode:
            </div>
            <input
              type="password" style={S.input} value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdminPassword()}
              placeholder="Enter password…" autoFocus
            />
            <div style={{ ...S.modalActions, marginTop: "1.2rem" }}>
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#2a2a2a", color: "#aaa", fontFamily: "'Georgia', serif" }}
                onClick={() => { setShowAdminPassword(false); setAdminPassword(""); setModeSelectionProfile(null); }}>Cancel</button>
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                onClick={submitAdminPassword}>Enter</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE SELECTION MODAL ──────────────────── */}
      {modeSelectionProfile && !showAdminPassword && (
        <div style={S.modalOverlay} onClick={() => setModeSelectionProfile(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Select Mode</div>
            <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Choose how you want to access <strong>{modeSelectionProfile.year}</strong>:
            </div>
            <div style={S.modalActions}>
              <button style={{ flex: 1, padding: "10px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#2a2a2a", color: "#aaa", fontFamily: "'Georgia', serif" }}
                onClick={() => confirmMode("viewer")}>📺 Viewer Mode</button>
              <button style={{ flex: 1, padding: "10px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                onClick={() => confirmMode("admin")}>👤 Admin Mode</button>
            </div>
            <button style={{ width: "100%", marginTop: "10px", padding: "9px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "none", background: "#1a1a1a", color: "#666", fontFamily: "'Georgia', serif" }}
              onClick={() => setModeSelectionProfile(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── MUSIC UNLOCK PROMPT ────────────────── */}
      {showMusicPrompt && screen === "browser" && (
        <div
          onClick={() => {
            setShowMusicPrompt(false);
            // Directly play inside a user gesture — this is the browser unlock
            const track = categoryMusicTracks[selectedCategory] ||
              Object.values(categoryMusicTracks)[0];
            if (track && track.base64 && audioRef.current && !isAdminMode) {
              audioRef.current.src = track.base64;
              audioRef.current.volume = musicVolume;
              audioRef.current.currentTime = 0;
              const cat = Object.keys(categoryMusicTracks).find(k => categoryMusicTracks[k] === track) || selectedCategory;
              currentMusicCatRef.current = cat;
              audioRef.current.play().catch(() => {});
              setActiveMusicCategory(cat);
            }
          }}
          style={{
            position: "fixed", inset: 0, zIndex: 900,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "rgba(229,9,20,0.15)", border: "2px solid #e50914",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", marginBottom: "20px",
            animation: "mPulse 1.4s ease-in-out infinite",
          }}>♫</div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#fff", letterSpacing: "2px", marginBottom: "10px" }}>
            Tap to enter
          </div>
          <div style={{ fontSize: "13px", color: "#888", letterSpacing: "1px" }}>
            Music will play automatically
          </div>
          <style>{`
            @keyframes mPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229,9,20,0.4); }
              50% { transform: scale(1.08); box-shadow: 0 0 0 16px rgba(229,9,20,0); }
            }
          `}</style>
        </div>
      )}

      {/* ── BROWSER ───────────────────────────────── */}
      {screen === "browser" && activeProfile && (() => {
        const c = pal(activeProfile);
        const filtered = profileMedia(activeProfile.id, search, selectedCategory);
        const categories = getProfileCategories(activeProfile.id);
        return (
          <div>
            {/* Nav */}
            <div style={S.nav}>
              <div style={S.navLeft}>
                <div style={S.navLogo}>MEMFLIX</div>
                <button style={S.backBtn} onClick={goBack}>← Profiles</button>
              </div>
              <div style={S.searchWrap}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input style={S.searchInput} placeholder="Search memories…" value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "16px", lineHeight: 1 }} onClick={() => setSearch("")}>×</button>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ ...S.navAvatar, background: c.bg, color: c.text }}>{activeProfile.year}</div>
                <span style={{ fontSize: "12px", color: "#666" }}>{isAdminMode ? "👤 ADMIN" : "📺 VIEWER"}</span>
              </div>
            </div>

            {/* Admin Panel */}
            {isAdminMode && (
              <div style={{ padding: "clamp(1rem, 4vw, 2rem)", background: "rgba(229,9,20,0.08)", borderBottom: "1px solid rgba(229,9,20,0.2)" }}>
                <div style={{ fontSize: "12px", color: "#e50914", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px", fontWeight: "600" }}>📤 Upload to:</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {profiles.map((p) => {
                    const pc = pal(p);
                    const isTarget = adminTargetProfile?.id === p.id;
                    return (
                      <button key={p.id}
                        style={{
                          padding: "8px 14px", borderRadius: "6px",
                          border: isTarget ? "2px solid #e50914" : "1px solid rgba(255,255,255,0.1)",
                          background: isTarget ? "rgba(229,9,20,0.2)" : "rgba(255,255,255,0.05)",
                          color: isTarget ? "#fff" : "#aaa", fontSize: "12px", cursor: "pointer",
                          fontFamily: "'Georgia', serif", transition: "all 0.2s",
                        }}
                        onClick={() => setAdminTargetProfile(isTarget ? null : p)}>
                        {p.year}
                      </button>
                    );
                  })}
                </div>

                {/* Category Music Management */}
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: "11px", color: "#e50914", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px", fontWeight: "600" }}>♫ Category Music</div>
                  <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px" }}>Click a category to assign background music for photos in that category.</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {categories.filter((c) => c !== "All").map((cat) => (
                      <button key={cat}
                        style={{
                          padding: "6px 10px", borderRadius: "4px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: categoryMusicTracks[cat] ? "rgba(229,9,20,0.3)" : "rgba(255,255,255,0.05)",
                          color: categoryMusicTracks[cat] ? "#fff" : "#aaa",
                          fontSize: "10px", cursor: "pointer", fontFamily: "'Georgia', serif",
                          transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px",
                        }}
                        onClick={() => {
                          const input = musicUploadRef.current;
                          if (input) {
                            input.setAttribute("data-category", cat);
                            input.click();
                          }
                        }}
                        title={categoryMusicTracks[cat] ? `${categoryMusicTracks[cat].fileName} — click to change` : "Click to add music"}>
                        {cat}
                        {categoryMusicTracks[cat] && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                  <input ref={musicUploadRef} type="file" accept="audio/*" style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const cat = musicUploadRef.current?.getAttribute("data-category");
                        if (cat) handleMusicUpload(cat, file);
                      }
                      e.target.value = "";
                    }} />
                </div>
              </div>
            )}

            {/* Category Filter + Volume */}
            {!isAdminMode && categories.length > 1 && (
              <div>
                <div style={{ padding: "12px clamp(1rem, 4vw, 2rem)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px", overflowX: "auto", scrollBehavior: "smooth", alignItems: "center" }}>
                  {categories.map((cat) => (
                    <button key={cat}
                      style={{
                        padding: "6px 12px", borderRadius: "20px",
                        border: selectedCategory === cat ? "1px solid #e50914" : "1px solid rgba(255,255,255,0.2)",
                        background: selectedCategory === cat ? "rgba(229,9,20,0.3)" : "transparent",
                        color: selectedCategory === cat ? "#fff" : "#888",
                        fontSize: "11px", cursor: "pointer", fontFamily: "'Georgia', serif",
                        transition: "all 0.2s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px",
                      }}
                      onClick={() => {
                        setSelectedCategory(cat);
                        // Reset photo viewer when switching categories
                        setIsViewingPhoto(false);
                        setViewingPhoto(null);
                        // Music engine picks up via useEffect on selectedCategory
                      }}>
                      {cat}
                      {cat !== "All" && categoryMusicTracks[cat] && <span style={{ color: "#e50914" }}>♫</span>}
                    </button>
                  ))}
                </div>

                {/* Music Volume Bar — shown whenever there's a track for the current category */}
                {categoryMusicTracks[selectedCategory] && (
                  <div style={{
                    padding: "8px clamp(1rem, 4vw, 2rem)",
                    display: "flex", alignItems: "center", gap: "12px",
                    background: "rgba(229,9,20,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <button
                      style={{ background: "none", border: "none", color: "#e50914", cursor: "pointer", fontSize: "16px", padding: "4px 6px", lineHeight: 1 }}
                      onClick={() => setMusicPlaying((p) => !p)}
                      title={musicPlaying ? "Pause music" : "Play music"}>
                      {musicPlaying ? "🔊" : "🔇"}
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "2px" }}>
                      <span style={{ fontSize: "10px", color: "#666", letterSpacing: "1px" }}>
                        ♫ {categoryMusicTracks[selectedCategory].fileName || "Background music"}
                        {!isViewingPhoto && <span style={{ color: "#555", marginLeft: "8px" }}>— paused while viewing video</span>}
                      </span>
                      <input
                        type="range" min="0" max="100" value={Math.round(musicVolume * 100)}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value) / 100)}
                        style={{ cursor: "pointer", accentColor: "#e50914" }}
                      />
                    </div>
                    <span style={{ color: "#888", fontSize: "11px", minWidth: "30px", textAlign: "right" }}>{Math.round(musicVolume * 100)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* ── NETFLIX-STYLE LAYOUT ── */}
            {(() => {
              // Separate banner items from rest
              const bannerItems = filtered.filter((m) => (m.category || "").toLowerCase() === "banner");
              const nonBannerItems = filtered.filter((m) => (m.category || "").toLowerCase() !== "banner");

              // Pick hero: banner category first, then heroItem, then first item
              const bannerHero = bannerItems[0] || heroItem || filtered[0] || null;

              // Group non-banner items by category
              const catOrder = [];
              const catMap = {};
              nonBannerItems.forEach((m) => {
                const cat = m.category || "Uncategorized";
                if (!catMap[cat]) { catMap[cat] = []; catOrder.push(cat); }
                catMap[cat].push(m);
              });

              // Render a single media card
              // Switch music to the category of the clicked item (works inside user gesture)
              const playTrackForCategory = (cat) => {
                if (!audioRef.current || isAdminMode) return;
                const track = categoryMusicTracks[cat];
                if (!track || !track.base64) {
                  // No track for this category — stop music
                  audioRef.current.pause();
                  currentMusicCatRef.current = null;
                  setActiveMusicCategory(null);
                  return;
                }
                if (currentMusicCatRef.current !== cat) {
                  currentMusicCatRef.current = cat;
                  musicSavedTimeRef.current = 0;
                  audioRef.current.src = track.base64;
                  audioRef.current.volume = musicVolume;
                  audioRef.current.currentTime = 0;
                  setActiveMusicCategory(cat);
                }
                if (musicPlaying) audioRef.current.play().catch(() => {});
              };

              const renderCard = (m) => (
                <div key={m.id} style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      ...S.mediaCard,
                      width: "clamp(130px, 18vw, 200px)",
                      borderColor: heroItem?.id === m.id ? (c.accent || "#e50914") : "transparent",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.zIndex = "10"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.zIndex = "1"; }}
                    onClick={() => {
                      const cat = m.category || "Uncategorized";
                      playTrackForCategory(cat);
                      if (!isAdminMode && m.fileType === "photo") {
                        openPhotoViewer(m);
                      } else {
                        setHeroItem(m);
                        if (m.fileType === "video") setIsViewingPhoto(false);
                      }
                    }}>
                    <div style={S.mediaThumb}>
                      {m.fileURL ? (
                        m.fileType === "video"
                          ? <video src={m.fileURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                          : <img src={m.fileURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={m.title} />
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      )}
                      {m.fileType === "video" && (
                        <div style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", borderRadius: "3px", padding: "2px 5px", fontSize: "9px", color: "#ccc", letterSpacing: "1px" }}>VID</div>
                      )}
                      {m.fileType === "photo" && !isAdminMode && (
                        <div style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", borderRadius: "3px", padding: "2px 5px", fontSize: "9px", color: "#aaa", letterSpacing: "1px" }}>🖼</div>
                      )}
                    </div>
                    <div style={{ ...S.mediaLabel }}>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{m.title}</span>
                    </div>
                  </div>
                  {isAdminMode && (
                    <div style={{ position: "absolute", top: 4, left: 4, display: "flex", gap: "4px", zIndex: 5 }}>
                      <button style={{ background: "rgba(0,0,0,0.75)", border: "none", color: "#ccc", borderRadius: "4px", width: "22px", height: "22px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={(e) => { e.stopPropagation(); openAdd(m); }} title="Edit">✎</button>
                      <button style={{ background: "rgba(229,9,20,0.8)", border: "none", color: "#fff", borderRadius: "4px", width: "22px", height: "22px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={(e) => { e.stopPropagation(); setConfirm({ type: "media", id: m.id, label: m.title }); }} title="Delete">×</button>
                    </div>
                  )}
                </div>
              );

              return (
                <>
                  {/* Hero Banner */}
                  <div style={S.hero}>
                    {bannerHero?.fileURL ? (
                      bannerHero.fileType === "video"
                        ? <video key={bannerHero.id} style={S.heroMedia} src={bannerHero.fileURL} autoPlay muted loop playsInline />
                        : <img key={bannerHero.id} style={S.heroMedia} src={bannerHero.fileURL} alt={bannerHero.title} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      </div>
                    )}
                    <div style={S.heroGradient} />
                    <div style={S.heroInfo}>
                      <div style={{ ...S.heroBadge, background: c.accent || "#e50914" }}>{bannerHero?.category || activeProfile.year}</div>
                      <div style={S.heroTitle}>{bannerHero?.title || "Select a memory"}</div>
                      <div style={S.heroSummary}>{bannerHero?.summary || "Click any card below to feature it here."}</div>
                      {bannerHero && (
                        <div style={S.heroActions}>
                          {bannerHero.fileType === "photo" && !isAdminMode ? (
                            <button style={{ ...S.heroBtn, background: "#fff", color: "#000" }}
                              onClick={() => openPhotoViewer(bannerHero)}>
                              🖼 View Photo
                            </button>
                          ) : (
                            <button style={{ ...S.heroBtn, background: "#fff", color: "#000" }}
                              onClick={() => bannerHero.fileURL && window.open(bannerHero.fileURL, "_blank")}>
                              ▶ Open
                            </button>
                          )}
                          <button style={{ ...S.heroBtn, background: "rgba(100,100,100,0.5)", color: "#fff" }}
                            onClick={startSlideshow}>
                            ⧉ Slideshow
                          </button>
                          {isAdminMode && (
                            <button style={{ ...S.heroBtn, background: "rgba(100,100,100,0.3)", color: "#fff" }}
                              onClick={() => openAdd(bannerHero)}>
                              ✎ Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Rows */}
                  {filtered.length === 0 && (
                    <div style={{ ...S.section }}>
                      <div style={S.empty}>{search ? "No memories match your search." : "No memories yet — add your first!"}</div>
                    </div>
                  )}

                  {catOrder.map((cat) => (
                    <div key={cat} style={{ padding: "1rem 0 0.5rem" }}>
                      {/* Row title */}
                      <div style={{ ...S.sectionTitle, padding: "0 clamp(1rem, 4vw, 2rem)", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        {cat}
                        {categoryMusicTracks[cat] && <span style={{ color: "#e50914", fontSize: "12px" }}>♫</span>}
                        <span style={{ fontSize: "11px", color: "#444", fontWeight: "400", letterSpacing: "0" }}>({catMap[cat].length})</span>
                      </div>
                      {/* Horizontal scroll row */}
                      <div style={{
                        display: "flex", gap: "10px", overflowX: "auto", overflowY: "visible",
                        padding: "6px clamp(1rem, 4vw, 2rem) 16px",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }} className="netflix-row">
                        {catMap[cat].map(renderCard)}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}

            {/* Add button */}
            {isAdminMode && (
              <div style={{ padding: "0 clamp(1rem, 4vw, 2rem) 2rem" }}>
                <button style={S.addBtn}
                  onMouseEnter={(e) => { e.target.style.borderColor = "#e50914"; e.target.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.color = "#666"; }}
                  onClick={() => openAdd()}>
                  + Add memory
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── MANUAL SLIDESHOW ──────────────────────── */}
      {showSlideshow && ssItem && (
        <div style={S.slideshowOverlay} onClick={() => { if (!slideshowPlay) setShowSlideshow(false); }}>
          {ssItem.fileURL ? (
            ssItem.fileType === "video"
              ? <video key={ssItem.id} src={ssItem.fileURL} autoPlay muted loop style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
              : <img key={ssItem.id} src={ssItem.fileURL} alt={ssItem.title} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
          ) : (
            <div style={{ color: "#333", fontSize: "14px" }}>No media</div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem", background: "linear-gradient(transparent, rgba(0,0,0,0.9))", textAlign: "center" }}>
            <div style={{ fontSize: "clamp(14px, 2.5vw, 20px)", fontWeight: "600", marginBottom: "6px" }}>{ssItem.title}</div>
            <div style={{ fontSize: "12px", color: "#aaa", maxWidth: "500px", margin: "0 auto 1.2rem", lineHeight: 1.6 }}>{ssItem.summary}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
              <button style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "16px" }}
                onClick={(e) => { e.stopPropagation(); setSlideshowIdx((i) => (i - 1 + currentMedia.length) % currentMedia.length); }}>‹</button>
              <button style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "16px" }}
                onClick={(e) => { e.stopPropagation(); setSlideshowPlay((p) => !p); }}>
                {slideshowPlay ? "⏸" : "▶"}
              </button>
              <button style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "16px" }}
                onClick={(e) => { e.stopPropagation(); setSlideshowIdx((i) => (i + 1) % currentMedia.length); }}>›</button>
              <button style={{ background: "rgba(229,9,20,0.7)", border: "none", color: "#fff", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "18px" }}
                onClick={(e) => { e.stopPropagation(); setShowSlideshow(false); }}>×</button>
            </div>
            <div style={{ fontSize: "11px", color: "#555", marginTop: "10px" }}>{slideshowIdx + 1} / {currentMedia.length}</div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ──────────────────────── */}
      {showAddModal && (
        <div style={S.modalOverlay} onClick={() => { if (!bulkUploading) setShowAddModal(false); }}>
          <div style={{
            ...S.modal,
            maxWidth: editItem ? "380px" : "520px",
            maxHeight: "90vh",
            overflowY: "auto",
            display: "flex", flexDirection: "column",
          }} onClick={(e) => e.stopPropagation()}>

            {/* ── EDIT MODE ── */}
            {editItem ? (
              <>
                <div style={S.modalTitle}>Edit memory</div>
                <input style={S.input} value={modalState.title} onChange={(e) => setModalState((s) => ({ ...s, title: e.target.value }))} placeholder="My birthday trip…" />
                <label style={S.label}>Your summary</label>
                <textarea style={S.textarea} value={modalState.summary} onChange={(e) => setModalState((s) => ({ ...s, summary: e.target.value }))} placeholder="Write a personal note…" />
                <label style={S.label}>Category (optional)</label>
                <input style={S.input} value={modalState.category} onChange={(e) => setModalState((s) => ({ ...s, category: e.target.value }))} placeholder="e.g., Family, Travel…" />
                <label style={S.label}>Replace photo / video (optional)</label>
                <button style={S.fileBtn}
                  onMouseEnter={(e) => { e.target.style.borderColor = "#e50914"; e.target.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.color = "#888"; }}
                  onClick={() => fileInputRef.current?.click()}>
                  ↑ Choose file
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />
                {modalState.fileName && <div style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>✓ {modalState.fileName}</div>}
                {modalState.fileURL && modalState.fileType === "photo" && (
                  <img src={modalState.fileURL} style={{ width: "100%", marginTop: "8px", borderRadius: "6px", maxHeight: "120px", objectFit: "cover" }} alt="preview" />
                )}
                <div style={S.modalActions}>
                  <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#2a2a2a", color: "#aaa", fontFamily: "'Georgia', serif" }}
                    onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                    onClick={saveMedia}>Save changes</button>
                </div>
              </>
            ) : (
              /* ── BULK UPLOAD MODE ── */
              <>
                <div style={S.modalTitle}>
                  Add memories{adminTargetProfile ? ` to ${adminTargetProfile.year}` : ""}
                </div>

                {/* Shared category + summary */}
                <label style={S.label}>Category</label>
                <input style={S.input} value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} placeholder="e.g., Family, Travel, Birthday…" />
                <label style={S.label}>Shared note (applies to all)</label>
                <textarea style={{ ...S.textarea, minHeight: "60px" }} value={bulkSummary} onChange={(e) => setBulkSummary(e.target.value)} placeholder="A note for all these memories…" />

                {/* Drop zone / pick button */}
                <label style={S.label}>Photos & videos</label>
                <button style={{ ...S.fileBtn, padding: "18px", fontSize: "13px", flexDirection: "column", gap: "6px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e50914"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#888"; }}
                  onClick={() => fileInputRef.current?.click()}>
                  <span style={{ fontSize: "22px" }}>↑</span>
                  <span>Select photos & videos</span>
                  <span style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>You can pick multiple files at once</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleBulkFiles} />

                {/* Preview grid */}
                {bulkFiles.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", letterSpacing: "1px" }}>
                      {bulkFiles.length} file{bulkFiles.length !== 1 ? "s" : ""} selected — you can edit each title below
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                      {bulkFiles.map((bf, idx) => (
                        <div key={bf.id} style={{ position: "relative", borderRadius: "6px", overflow: "hidden", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {/* Thumbnail */}
                          <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", position: "relative" }}>
                            {bf.fileType === "video"
                              ? <video src={bf.fileURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                              : <img src={bf.fileURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={bf.title} />
                            }
                            {bf.fileType === "video" && (
                              <div style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.7)", borderRadius: "3px", padding: "1px 4px", fontSize: "8px", color: "#ccc" }}>VID</div>
                            )}
                          </div>
                          {/* Editable title */}
                          <input
                            style={{ ...S.input, fontSize: "10px", padding: "4px 6px", borderRadius: "0", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#111" }}
                            value={bf.title}
                            onChange={(e) => setBulkFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, title: e.target.value } : f))}
                            placeholder="Title…"
                          />
                          {/* Remove button */}
                          <button
                            style={{ position: "absolute", top: 3, left: 3, background: "rgba(229,9,20,0.85)", border: "none", color: "#fff", width: "18px", height: "18px", borderRadius: "50%", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                            onClick={() => setBulkFiles((prev) => prev.filter((f) => f.id !== bf.id))}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={S.modalActions}>
                  <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#2a2a2a", color: "#aaa", fontFamily: "'Georgia', serif" }}
                    onClick={() => setShowAddModal(false)} disabled={bulkUploading}>Cancel</button>
                  <button
                    style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: bulkFiles.length === 0 ? "#555" : "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                    onClick={saveMedia}
                    disabled={bulkFiles.length === 0 || bulkUploading}>
                    {bulkUploading ? `Saving… (${bulkFiles.length})` : `Add ${bulkFiles.length > 0 ? bulkFiles.length + " " : ""}memor${bulkFiles.length === 1 ? "y" : "ies"}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADD YEAR MODAL ────────────────────────── */}
      {showAddYear && (
        <div style={S.modalOverlay} onClick={() => setShowAddYear(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Add a year</div>
            <label style={S.label}>Year or label</label>
            <input style={S.input} value={newYear} onChange={(e) => setNewYear(e.target.value)}
              placeholder="2026, College Years, Road Trip…"
              onKeyDown={(e) => e.key === "Enter" && addYear()} autoFocus />
            <div style={S.modalActions}>
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#2a2a2a", color: "#aaa", fontFamily: "'Georgia', serif" }}
                onClick={() => setShowAddYear(false)}>Cancel</button>
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: addingYear ? "default" : "pointer", border: "none", background: addingYear ? "#555" : "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                onClick={addYear} disabled={addingYear}>{addingYear ? "Adding…" : "Add"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ────────────────────────── */}
      {confirm && (
        <div style={S.modalOverlay} onClick={() => setConfirm(null)}>
          <div style={{ ...S.modal, maxWidth: "320px" }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Delete "{confirm.label}"?</div>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "1.2rem", lineHeight: 1.6 }}>
              {confirm.type === "profile" ? "This will permanently delete all memories in this year." : "This memory will be permanently removed."}
            </div>
            <div style={S.modalActions}>
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#2a2a2a", color: "#aaa", fontFamily: "'Georgia', serif" }}
                onClick={() => setConfirm(null)}>Cancel</button>
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                onClick={() => confirm.type === "profile" ? deleteProfile(confirm.id) : deleteMedia(confirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}