# MEMFLIX - Features Guide

## 🎬 What's New

Your Netflix-like personal video & photo archive now has **admin mode** with category organization!

---

## 📺 VIEWER MODE (Default)

When you open a profile (e.g., "2022"), you're in **Viewer Mode**:

### Hero Banner
- Shows a featured video or photo at the top
- Displays the title, summary, and category badge
- **▶ Open** - Opens the full media file
- **⧉ Slideshow** - Starts an auto-playing slideshow of all content
- **✎ Edit** - Edit the memory details

### Category Filter
- Scroll through category tabs at the top (All, Featured, Action, Drama, Family, Travel, etc.)
- Filters the media grid below to show only that category
- Categories are automatically created from your uploads

### Media Grid
- Click any card to feature it in the hero banner
- Shows video badge if it's a video
- Category badge on each card
- **✎** button to edit
- **×** button to delete

### Slideshow
- Auto-rotates every 4 seconds
- Click to pause/resume, go to previous/next
- Shows title and summary at the bottom

---

## 👤 ADMIN MODE (Upload Management)

Click the **"📺 VIEWER"** button in the top-right to enter Admin Mode (button changes to **"👤 ADMIN"**)

### Admin Panel
- **"📤 Upload to:"** section appears
- Shows all available profiles (2022, 2023, 2024, 2025, or any custom years you add)
- Select a profile to choose where the next upload goes
- Selected profile has a red border

### Adding Memories (Admin)
1. Click **"+ Add memory"** button
2. Modal shows: **"Add a memory to [SELECTED_PROFILE]"**
3. Fill in:
   - **Title** - Name of the memory
   - **Summary** - Description
   - **Category** - Optional (e.g., "Action", "Drama", "Travel", "Family")
   - **Photo or Video** - Click to upload an image or video file
4. Click **"Add memory"** to save
5. Memory is instantly added to the selected profile

### Editing & Deleting (Admin)
- Each memory card has two buttons:
  - **✎** (Edit) - Modify title, summary, category, or file
  - **×** (Delete) - Remove the memory permanently

### Categories
Default categories created on first use:
- Featured
- Action
- Drama
- Comedy
- Family

You can add custom categories by typing them in the Category field when uploading. They'll automatically appear as filter tabs in Viewer Mode.

---

## 🗓️ Managing Years/Profiles

From the intro screen (click "← Profiles" to go back):

### View Profiles
- Shows all year cards (2022, 2023, 2024, 2025)
- Click any year to enter that profile's browser
- Hover over a year to see the delete button (×)

### Add New Year
- Click the **"+"** card at the end
- Enter a year name or custom label
- Gets a unique color automatically
- Can upload to this new profile in Admin Mode

### Delete a Year
- Click the **"×"** button on any year card
- Confirms deletion
- **Warning:** Deletes all memories in that year permanently

---

## 🎯 Typical Workflow

### For Admins (Content Creators)
1. Enter a profile (e.g., "2022")
2. Click **"📺 VIEWER"** → becomes **"👤 ADMIN"**
3. Select target profile from the "📤 Upload to:" panel
4. Click **"+ Add memory"**
5. Add title, summary, category, and upload file
6. Organize content across different profiles

### For Viewers
1. Click a profile year from intro screen
2. Browse memories in the grid
3. Click category tabs to filter by type
4. Click a card to feature it in the hero banner
5. Start slideshow with **⧉ Slideshow** button
6. Search with the search box to find specific memories

---

## 💾 Data Storage

All data is stored locally in your browser using **IndexedDB**:
- Videos and photos are stored as file references
- Data persists between sessions
- Clear browser cache to reset everything
- No server upload required (local-first)

---

## 🎨 Customization

### Add More Years
From intro screen, click the + card to add more years/labels

### Create Custom Categories
Just type a custom category name when uploading a memory in Admin Mode. It will automatically appear as a filter tab.

### Dark Theme
The app uses a dark Netflix-inspired theme with custom colors per year/profile

---

## ⌨️ Keyboard Shortcuts (in Slideshow)
- **Left arrow** / **Left button** - Previous media
- **Right arrow** / **Right button** - Next media  
- **Space or Play button** - Play/Pause
- **× button** - Exit slideshow

---

## 🔄 Switching Modes

- **To Admin Mode:** Click **"📺 VIEWER"** button
- **To Viewer Mode:** Click **"👤 ADMIN"** button
- **Back to Profiles:** Click **"← Profiles"** button in top-left

---

## 📝 Tips

- Use **Categories** to organize by genre, mood, or type (Action, Travel, Family moments, etc.)
- **Slideshow** auto-rotates every 4 seconds - perfect for idle display
- Upload to **any profile** from any profile in Admin Mode
- Search works across titles and summaries
- Edit existing memories anytime in Admin Mode (click ✎ on any card)

---

## 🚀 Future Enhancements

Potential additions:
- Backend server support for sharing between devices
- User authentication for multi-user access
- Cloud storage integration
- Advanced filters and sorting
- Video thumbnails and previews
- Rating/favorite marking

---

Enjoy your personal Netflix! 🎬
