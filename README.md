# 🎥 YouTube Playlist Analyzer with AI

A web-based application for in-depth analysis of YouTube playlists. It provides detailed statistics, insightful visualizations, and AI-generated insights using the **Google Gemini API**, helping users understand and plan their viewing experience before watching.

🔗 **Live Demo:** *https://nikhilagarwal03.github.io/Youtube-playlist-Analyzer/*

---
<img width="1800" height="950" alt="image" src="https://github.com/user-attachments/assets/38592f21-6e59-46b9-b52e-432b750cdab9" />

---

## ⚙️ Core Functionalities

### 📊 Statistical Reporting
- **Total Playlist Duration:** Computes total time (HH:MM:SS) needed to watch all videos sequentially.
- **Aggregate Video Metrics:**
  - Total number of videos
  - Average duration per video
- **Video-Specific Insights:**
  - Longest video
  - Shortest video
  - Most viewed video
  - Most liked video

### 📈 Visualization & Planning Tools
- **Viewing Schedule Estimator:** Estimates completion time based on your daily watch time.
- **Duration Distribution Chart:** Visual bar chart showing how videos are distributed by duration ranges (0–5 min, 5–15 min, etc.).

### 🤖 AI-Powered Features (via Gemini)
- **Automated Playlist Summary:** Describes objectives, target audience, and themes.
- **Structured Learning Path:** Suggests a learning-friendly order and organizes videos into modules.
- **FAQ Synthesis:** Generates possible user questions with AI-generated concise answers.

---

## 🛠️ Setup and Usage

### 1. 📌 Prerequisite: Google Cloud API Key

You’ll need one API key with access to:

- **YouTube Data API v3**
- **Generative Language API (Gemini)**

**Steps:**
- Create or open a project in [Google Cloud Console](https://console.cloud.google.com/)
- Enable both required APIs
- Go to **APIs & Services → Credentials → Create API Key**
- Copy the generated key (you’ll use it in the app)

---

### 2. 🚀 Running the App

No server needed — it's a fully client-side app.

```bash
# Steps:
1. Clone or download this repository
2. Open `index.html` in a modern browser
3. Enter your YouTube playlist URL and Google API Key
4. Click "Analyze Playlist" to start
```
## ⚠️ Critical Security Advisory: API Key Management

Your API key is as sensitive as a password. If exposed, it can lead to **unauthorized access** and **unexpected charges** on your Google Cloud account.

### 🚫 DO NOT Hardcode Your API Key

- ❌ Never write your API key directly into `script.js`, `index.html`, or any source file.
- ❌ Avoid committing it to version control (e.g., GitHub).
- ✅ Always input the API key dynamically in the browser (runtime only).

---

## 📂 Project File Structure

```
📁 project-root/
├── index.html     # Main layout and markup
├── style.css      # Tailwind CSS and custom styles
└── script.js      # Logic, API calls, DOM manipulation
```

---

## 🧰 Tech Stack

- **HTML5** – Markup structure  
- **CSS3 / Tailwind CSS** – Styling and layout  
- **JavaScript (ES6+)** – Core logic and interaction  
- **Chart.js** – Visualization of video stats  
- **Google Cloud APIs**:
  - YouTube Data API v3  
  - Generative Language API (Gemini)

---

## 📄 License

This project is licensed under the **[MIT License](LICENSE)**.  
You are free to use, modify, and distribute with attribution.

---

## 🙋 Author

**Nikhil Agarwal**  
Feel free to fork, contribute, or raise an issue.  
📬 Contact: [Twitter/X](https://x.com/agarwal030) | [GitHub](https://github.com/nikhilagarwal03)


