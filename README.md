# 🎬 Memflix — Your Personal Memory Archive

A Netflix-style photo & video memory browser built with React + Vite.
Organise memories by year, write personal summaries, search, slideshow, and more.
All data is saved locally in your browser (IndexedDB) — nothing is uploaded anywhere.

---

## ✅ Requirements

- **Node.js** v18 or newer
  - Check: `node --version`
  - Download: https://nodejs.org (choose the LTS version)

- **npm** (comes with Node.js automatically)
  - Check: `npm --version`

---

## 🚀 Getting Started

### 1. Extract the zip

Unzip `memflix.zip` anywhere you like, then open your terminal / command prompt.

### 2. Navigate into the folder

```bash
cd memflix
```

### 3. Install dependencies (one-time setup)

```bash
npm install
```

This downloads React, Vite, and other packages into a `node_modules` folder (~30 seconds).

### 4. Start the app

```bash
npm run dev
```

You'll see output like:

```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser and Memflix is live! 🎉

---

## 🛑 Stopping the App

Press `Ctrl + C` in the terminal to stop the dev server.

---

## 📦 Build for Production (optional)

If you want to host it on a server or open it as a static site:

```bash
npm run build
```

This creates a `dist/` folder with optimised files.
You can serve it with:

```bash
npm run preview
```

Or deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

---

## 🗂 Project Structure

```
memflix/
├── index.html          ← App entry point
├── package.json        ← Dependencies & scripts
├── vite.config.js      ← Vite configuration
├── README.md           ← This file
└── src/
    ├── main.jsx        ← React root
    └── App.jsx         ← Full Memflix application
```

---

## ✨ Features

| Feature | How to use |
|---|---|
| **Year profiles** | Click a year on the intro screen to enter that year's archive |
| **Add year** | Click "+" on the intro screen |
| **Delete year** | Click the red × next to a year label on the intro screen |
| **Add memory** | Inside a year, click "+ Add memory" at the bottom |
| **Edit memory** | Click ✎ on any card, or the "Edit" button in the hero section |
| **Delete memory** | Click × on any card (with confirmation) |
| **Search** | Use the search bar in the top-right while inside a year |
| **Hero preview** | Click any card to feature it full-width at the top |
| **Slideshow** | Click "⧉ Slideshow" in the hero section — auto-advances every 4s |
| **Persistent data** | Everything saves automatically to your browser's IndexedDB |

---

## ⚠️ Notes

- **Files stay on your device.** Media is loaded via `blob://` URLs — no uploads happen.
- **Browser storage.** Data persists in the browser you use. Clearing browser data / site data will erase memories.
- **Different browser = fresh start.** IndexedDB is per-browser-profile. Use the same browser each time.
- Tested on Chrome, Edge, and Firefox.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| `node: command not found` | Install Node.js from https://nodejs.org |
| `npm install` fails | Make sure you're inside the `memflix/` folder |
| Port 5173 already in use | Run `npm run dev -- --port 3000` to use a different port |
| Media not showing after browser restart | Re-add the files — blob URLs don't survive browser restarts; a future version can use file paths |

---

Made with ❤️ using React + Vite + IndexedDB
