import { useState, useEffect, useRef, useCallback } from "react";

// ── IndexedDB helpers ──────────────────────────────────────────────
const DB_NAME = "memflix_db";
const DB_VER = 2;

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("profiles"))
        db.createObjectStore("profiles", { keyPath: "id" });
      if (!db.objectStoreNames.contains("media"))
        db.createObjectStore("media", { keyPath: "id" });
      if (!db.objectStoreNames.contains("categories"))
        db.createObjectStore("categories", { keyPath: "id" });
    };
    req.onsuccess = (e) => res(e.target.result);
    req.onerror = (e) => rej(e.target.error);
  });
}

async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function dbPut(store, item) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(item);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function dbDelete(store, id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// Get all unique categories
async function dbGetCategories() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("categories", "readonly");
    const req = tx.objectStore("categories").getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

// Add a category
async function dbAddCategory(name) {
  const id = `cat_${Date.now()}`;
  await dbPut("categories", { id, name });
  return id;
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
  // intro
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
  // nav
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
  // hero
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
  // media section
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
  // add btn
  addBtn: {
    width: "100%", padding: "14px",
    border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: "8px",
    background: "none", color: "#666", fontSize: "13px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    letterSpacing: "1px", transition: "border-color 0.2s, color 0.2s",
    fontFamily: "'Georgia', serif",
  },
  // modal overlay — normal flow faux-viewport so fixed doesn't collapse
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
  // slideshow
  slideshowOverlay: {
    position: "fixed", inset: 0, background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 300, flexDirection: "column",
  },
  // empty state
  empty: { color: "#444", fontSize: "13px", padding: "2rem 0", gridColumn: "1/-1", textAlign: "center" },
};

// ── Main App ───────────────────────────────────────────────────────
export default function Memflix() {
  const [profiles, setProfiles] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [screen, setScreen] = useState("intro"); // intro | browser
  const [activeProfile, setActiveProfile] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [heroItem, setHeroItem] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null); // for re-record/edit
  const [modalState, setModalState] = useState({ title: "", summary: "", category: "", fileURL: null, fileType: null, fileName: "" });
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const [slideshowPlay, setSlideshowPlay] = useState(true);
  const [confirm, setConfirm] = useState(null); // { id, label }
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [adminTargetProfile, setAdminTargetProfile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [modeSelectionProfile, setModeSelectionProfile] = useState(null);
  const slideshowTimer = useRef(null);
  const fileInputRef = useRef(null);

  // Load from IndexedDB
  useEffect(() => {
    (async () => {
      let ps = await dbGetAll("profiles");
      let ms = await dbGetAll("media");
      let cats = await dbGetCategories();
      if (ps.length === 0) {
        for (const p of DEFAULT_PROFILES) await dbPut("profiles", p);
        ps = DEFAULT_PROFILES;
      }
      if (cats.length === 0) {
        const defaultCats = ["Featured", "Action", "Drama", "Comedy", "Family"];
        for (const cat of defaultCats) await dbAddCategory(cat);
        cats = await dbGetCategories();
      }
      ps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setProfiles(ps);
      setAllMedia(ms);
      setLoaded(true);
    })();
  }, []);

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

  // Get unique categories for active profile
  const getProfileCategories = (profileId) => {
    const cats = new Set(allMedia.filter((m) => m.profileId === profileId).map((m) => m.category || "Uncategorized"));
    return ["All", ...Array.from(cats).filter((c) => c !== "All").sort()];
  };

  const openProfile = (p) => {
    setModeSelectionProfile(p);
  };

  const confirmMode = (mode) => {
    if (mode === "admin") {
      setShowAdminPassword(true);
    } else {
      // Viewer mode - direct access
      setActiveProfile(modeSelectionProfile);
      setIsAdminMode(false);
      setSearch("");
      setSelectedCategory("All");
      const first = allMedia.filter((m) => m.profileId === modeSelectionProfile.id)[0] || null;
      setHeroItem(first);
      setScreen("browser");
      setModeSelectionProfile(null);
    }
  };

  const submitAdminPassword = () => {
    if (adminPassword === "KeM_JNo0u2") {
      // Correct password
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

  const goBack = () => { setScreen("intro"); setActiveProfile(null); setHeroItem(null); setIsAdminMode(false); setAdminTargetProfile(null); setModeSelectionProfile(null); };

  // ── Add / Edit ──
  const openAdd = (item = null) => {
    if (item) {
      setEditItem(item);
      setModalState({ title: item.title, summary: item.summary, category: item.category || "", fileURL: item.fileURL, fileType: item.fileType, fileName: item.fileName || "" });
    } else {
      setEditItem(null);
      setModalState({ title: "", summary: "", category: "", fileURL: null, fileType: null, fileName: "" });
    }
    setShowAddModal(true);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "photo";
    setModalState((s) => ({
      ...s, fileURL: url, fileType: type, fileName: file.name,
      title: s.title || file.name.replace(/\.[^.]+$/, ""),
    }));
  };

  const saveMedia = async () => {
    const { title, summary, category, fileURL, fileType, fileName } = modalState;
    if (!title.trim()) return;
    const targetProfile = adminTargetProfile || activeProfile;
    if (editItem) {
      const updated = {
        ...editItem,
        title: title.trim(),
        summary: summary.trim() || "A cherished memory.",
        category: category.trim() || "Uncategorized",
        ...(fileURL && fileURL !== editItem.fileURL ? { fileURL, fileType, fileName } : {}),
      };
      await dbPut("media", updated);
      setAllMedia((prev) => prev.map((m) => (m.id === editItem.id ? updated : m)));
      if (heroItem?.id === editItem.id) setHeroItem(updated);
    } else {
      const entry = {
        id: `m_${Date.now()}`,
        profileId: targetProfile.id,
        title: title.trim(),
        summary: summary.trim() || "A cherished memory.",
        category: category.trim() || "Uncategorized",
        fileURL: fileURL || null,
        fileType: fileType || "photo",
        fileName: fileName || "",
        createdAt: Date.now(),
      };
      await dbPut("media", entry);
      const updated = [...allMedia, entry];
      setAllMedia(updated);
      if (targetProfile.id === activeProfile?.id) {
        setHeroItem(entry);
      }
    }
    setShowAddModal(false);
    setEditItem(null);
    setAdminTargetProfile(null);
  };

  // ── Delete ──
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

  // ── Add year ──
  const addYear = async () => {
    const y = newYear.trim();
    if (!y) return;
    const idx = profiles.length % PALETTE.length;
    const p = { id: `p_${Date.now()}`, year: y, colorIdx: idx, order: profiles.length };
    await dbPut("profiles", p);
    setProfiles((prev) => [...prev, p]);
    setShowAddYear(false);
    setNewYear("");
  };

  // ── Slideshow ──
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

  if (!loaded) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ color: "#e50914", fontSize: "14px", letterSpacing: "3px" }}>LOADING…</div>
    </div>
  );

  return (
    <div style={S.app}>
      {/* ── INTRO ─────────────────────────────────── */}
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
            {/* Add account card */}
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
              type="password"
              style={S.input} 
              value={adminPassword} 
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdminPassword()}
              placeholder="Enter password…" 
              autoFocus 
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
                <input style={S.searchInput} placeholder="Search memories…"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "16px", lineHeight: 1 }} onClick={() => setSearch("")}>×</button>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ ...S.navAvatar, background: c.bg, color: c.text }}>{activeProfile.year}</div>
                <span style={{ fontSize: "12px", color: "#666" }}>{isAdminMode ? "👤 ADMIN" : "📺 VIEWER"}</span>
              </div>
            </div>

            {/* Admin Panel - Only in Admin Mode */}
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
                          fontFamily: "'Georgia', serif", transition: "all 0.2s"
                        }}
                        onClick={() => setAdminTargetProfile(isTarget ? null : p)}>
                        {p.year}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category Filter - Only in Viewer or when no admin panel */}
            {!isAdminMode && categories.length > 1 && (
              <div style={{ padding: "12px clamp(1rem, 4vw, 2rem)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px", overflowX: "auto", scrollBehavior: "smooth" }}>
                {categories.map((cat) => (
                  <button key={cat}
                    style={{
                      padding: "6px 12px", borderRadius: "20px",
                      border: selectedCategory === cat ? "1px solid #e50914" : "1px solid rgba(255,255,255,0.2)",
                      background: selectedCategory === cat ? "rgba(229,9,20,0.3)" : "transparent",
                      color: selectedCategory === cat ? "#fff" : "#888", fontSize: "11px", cursor: "pointer",
                      fontFamily: "'Georgia', serif", transition: "all 0.2s", whiteSpace: "nowrap"
                    }}
                    onClick={() => setSelectedCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Hero */}
            <div style={S.hero}>
              {heroItem?.fileURL ? (
                heroItem.fileType === "video"
                  ? <video key={heroItem.id} style={S.heroMedia} src={heroItem.fileURL} autoPlay muted loop playsInline />
                  : <img key={heroItem.id} style={S.heroMedia} src={heroItem.fileURL} alt={heroItem.title} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>
              )}
              <div style={S.heroGradient} />
              <div style={S.heroInfo}>
                <div style={{ ...S.heroBadge, background: c.accent || "#e50914" }}>{heroItem?.category || activeProfile.year}</div>
                <div style={S.heroTitle}>{heroItem?.title || "Select a memory"}</div>
                <div style={S.heroSummary}>{heroItem?.summary || "Click any card below to feature it here."}</div>
                {heroItem && (
                  <div style={S.heroActions}>
                    <button style={{ ...S.heroBtn, background: "#fff", color: "#000" }}
                      onClick={() => heroItem.fileURL && window.open(heroItem.fileURL, "_blank")}>
                      ▶ Open
                    </button>
                    <button style={{ ...S.heroBtn, background: "rgba(100,100,100,0.5)", color: "#fff" }}
                      onClick={startSlideshow}>
                      ⧉ Slideshow
                    </button>
                    <button style={{ ...S.heroBtn, background: "rgba(100,100,100,0.3)", color: "#fff" }}
                      onClick={() => openAdd(heroItem)}>
                      ✎ Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Media grid */}
            <div style={S.section}>
              <div style={S.sectionTitle}>
                {selectedCategory !== "All" ? selectedCategory : activeProfile.year} memories {search && `· "${search}"`} ({filtered.length})
              </div>
              <div style={S.mediaGrid}>
                {filtered.length === 0 && (
                  <div style={S.empty}>
                    {search ? "No memories match your search." : "No memories yet — add your first!"}
                  </div>
                )}
                {filtered.map((m) => (
                  <div key={m.id} style={{ position: "relative" }}>
                    <div style={{
                      ...S.mediaCard,
                      borderColor: heroItem?.id === m.id ? (c.accent || "#e50914") : "transparent",
                    }}
                      onClick={() => setHeroItem(m)}>
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
                      </div>
                      <div style={{ ...S.mediaLabel, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px" }}>
                        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</span>
                        {m.category && m.category !== "Uncategorized" && (
                          <span style={{ fontSize: "9px", background: "rgba(229,9,20,0.3)", color: "#e50914", padding: "2px 6px", borderRadius: "3px", whiteSpace: "nowrap" }}>{m.category}</span>
                        )}
                      </div>
                    </div>
                    {/* delete & edit quick actions - Only in Admin Mode */}
                    {isAdminMode && (
                      <div style={{ position: "absolute", top: 4, left: 4, display: "flex", gap: "4px" }}>
                        <button style={{ background: "rgba(0,0,0,0.75)", border: "none", color: "#ccc", borderRadius: "4px", width: "22px", height: "22px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={(e) => { e.stopPropagation(); openAdd(m); }} title="Edit">✎</button>
                        <button style={{ background: "rgba(229,9,20,0.8)", border: "none", color: "#fff", borderRadius: "4px", width: "22px", height: "22px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={(e) => { e.stopPropagation(); setConfirm({ type: "media", id: m.id, label: m.title }); }} title="Delete">×</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add button - Only in Admin Mode */}
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

      {/* ── SLIDESHOW ─────────────────────────────── */}
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
        <div style={S.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>{editItem ? "Edit memory" : `Add a memory${adminTargetProfile ? ` to ${adminTargetProfile.year}` : ""}`}</div>
            <input style={S.input} value={modalState.title} onChange={(e) => setModalState((s) => ({ ...s, title: e.target.value }))} placeholder="My birthday trip…" />
            <label style={S.label}>Your summary</label>
            <textarea style={S.textarea} value={modalState.summary} onChange={(e) => setModalState((s) => ({ ...s, summary: e.target.value }))} placeholder="Write a personal note about this memory…" />
            <label style={S.label}>Category (optional)</label>
            <input style={S.input} value={modalState.category} onChange={(e) => setModalState((s) => ({ ...s, category: e.target.value }))} placeholder="e.g., Action, Drama, Family, Travel…" />
            <label style={S.label}>Photo or video {editItem ? "(leave empty to keep existing)" : ""}</label>
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
              <button style={{ ...S.modalActions[0], flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#2a2a2a", color: "#aaa", fontFamily: "'Georgia', serif" }}
                onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                onClick={saveMedia}>{editItem ? "Save changes" : "Add memory"}</button>
            </div>
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
              <button style={{ flex: 1, padding: "9px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", border: "none", background: "#e50914", color: "#fff", fontFamily: "'Georgia', serif", fontWeight: "600" }}
                onClick={addYear}>Add</button>
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
