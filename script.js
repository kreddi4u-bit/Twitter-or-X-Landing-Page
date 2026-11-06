/* ============================================================
   Chirp — Twitter timeline clone
   ------------------------------------------------------------
   1. SETTINGS (theme, text size, sound, media)
   2. SOUND (Web Audio API, no audio files needed)
   3. SEED DATA + STORAGE (12 starter chirps)
   4. IMAGES (generated in code, no image files needed)
   5. TIMELINE RENDERING
   6. COMPOSER + TABS
   7. COMPOSE POPUP MODAL
   8. EXPLORE / TRENDING HASHTAGS
   9. SETTINGS PAGE WIRING
   ============================================================ */

/* ============================================================
   1. SETTINGS
   ============================================================ */
const SETTINGS_KEY = "chirp_settings_v1";
const STORAGE_KEY = "chirp_tweets_v2";

const defaultSettings = {
  theme: "system",        // light | dark | system
  fontSize: "medium",     // small | medium | large
  reduceMotion: false,
  soundEnabled: true,
  muted: false,
  volume: 70,             // 0 - 100
  showImages: true,
  autoplayVideo: false,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Could not read settings.", e);
  }
  return { ...defaultSettings };
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Could not save settings.", e);
  }
}

const settings = loadSettings();
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function resolvedTheme() {
  if (settings.theme === "system") return darkQuery.matches ? "dark" : "light";
  return settings.theme;
}

function applySettings() {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedTheme());
  root.setAttribute("data-font", settings.fontSize);
  root.setAttribute("data-motion", settings.reduceMotion ? "reduce" : "full");
  applyMediaVolume();
}

darkQuery.addEventListener("change", () => {
  if (settings.theme === "system") applySettings();
});

/* ============================================================
   2. SOUND
   ============================================================ */
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function soundAllowed() {
  return settings.soundEnabled && !settings.muted && settings.volume > 0;
}

function tone(freq, start, duration, type = "sine") {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const peak = (settings.volume / 100) * 0.25;
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

function playSound(kind) {
  if (!soundAllowed()) return;
  if (kind === "post") {
    tone(660, 0, 0.12);
    tone(880, 0.1, 0.16);
  } else if (kind === "like") {
    tone(740, 0, 0.1, "triangle");
  } else if (kind === "retweet") {
    tone(520, 0, 0.09, "triangle");
    tone(620, 0.08, 0.09, "triangle");
  } else if (kind === "test") {
    tone(523, 0, 0.14);
    tone(659, 0.12, 0.14);
    tone(784, 0.24, 0.2);
  }
}

function applyMediaVolume() {
  document.querySelectorAll("video").forEach((v) => {
    v.volume = settings.volume / 100;
    v.muted = settings.muted;
  });
}

/* ============================================================
   3. SEED DATA + STORAGE
   ============================================================ */
const seedTweets = [
  { id: "t1", name: "Zaio Bootcamp", handle: "@zaio_io", avatarColor: "#1D9BF0", time: "2h",
    text: "Shipping your first full-stack project this week? A working ugly app beats a beautiful broken one. #buildinpublic #webdev",
    likes: 142, retweets: 38, replies: 9 },
  { id: "t2", name: "Thandiwe M.", handle: "@thandi_codes", avatarColor: "#8957E5", time: "3h",
    text: "Finally got my useReducer state management working without a single duplicated action. Small wins. #react #statemanagement",
    likes: 87, retweets: 12, replies: 4 },
  { id: "t3", name: "Sipho Dev", handle: "@siphobuilds", avatarColor: "#17A673", time: "4h",
    text: "Dark mode in plain CSS variables, no framework needed. Felt like a small superpower. #css #webdev",
    art: "midnight", artAlt: "Abstract dark blue and purple gradient with glowing circles",
    likes: 213, retweets: 54, replies: 11 },
  { id: "t4", name: "Firebase Tips", handle: "@firebase_daily", avatarColor: "#F59E0B", time: "5h",
    text: "Reminder: Firestore security rules are not optional. Lock your collections down before you deploy. #firebase #webdev",
    likes: 301, retweets: 96, replies: 22 },
  { id: "t5", name: "Aisha K.", handle: "@aisha_ships", avatarColor: "#E0245E", time: "6h",
    text: "Cursor suggested I name a function handleHandleClick. We are not the same. #buildinpublic #cursor",
    likes: 420, retweets: 118, replies: 31 },
  { id: "t6", name: "Netlify", handle: "@netlify", avatarColor: "#00C7B7", time: "8h",
    text: "First-try deploys deserve a screenshot. Drag, drop, done. #netlify #deployment",
    art: "mint", artAlt: "Abstract teal and green gradient with soft shapes",
    likes: 530, retweets: 201, replies: 18 },
  { id: "t7", name: "Priya N.", handle: "@priya_frontend", avatarColor: "#F97316", time: "10h",
    text: "Spent an hour debugging a layout bug that turned out to be a missing closing div. Classic. #webdev #css",
    likes: 95, retweets: 7, replies: 14 },
  { id: "t8", name: "Lerato B.", handle: "@lerato_builds", avatarColor: "#636E72", time: "12h",
    text: "Just wired up Firebase Auth for the first time. Google sign-in in four lines of code still feels like magic. #firebase #react",
    likes: 162, retweets: 29, replies: 6 },
  { id: "t9", name: "Dineo Codes", handle: "@dineo_js", avatarColor: "#0EA5E9", time: "14h",
    text: "Tip: build mobile layout first, then add breakpoints upward. Your desktop CSS gets so much smaller. #css #responsive",
    likes: 188, retweets: 41, replies: 8 },
  { id: "t10", name: "Kabelo S.", handle: "@kabelo_ui", avatarColor: "#D946EF", time: "18h",
    text: "Golden hour makes every deploy feel like a win. Pushed to production and went for a walk. #buildinpublic",
    art: "sunset", artAlt: "Abstract orange and pink sunset gradient with a large sun circle",
    likes: 274, retweets: 33, replies: 12 },
  { id: "t11", name: "Naledi T.", handle: "@naledi_tech", avatarColor: "#14B8A6", time: "1d",
    text: "Git tip of the day: commit small, commit often, write messages your future self can read. #git #webdev",
    likes: 119, retweets: 26, replies: 5 },
  { id: "t12", name: "Mpho R.", handle: "@mpho_react", avatarColor: "#EF4444", time: "1d",
    text: "Day 30 of learning React. Components finally clicked. Props down, events up. #react #100daysofcode",
    likes: 356, retweets: 62, replies: 19 },
];

function loadTweets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read saved chirps.", e);
  }
  return JSON.parse(JSON.stringify(seedTweets));
}

function saveTweets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tweets));
  } catch (e) {
    console.warn("Could not save chirps.", e);
  }
}

const state = {
  tweets: loadTweets(),
  activeTag: null,
};

/* ============================================================
   4. IMAGES (generated SVG, no files needed)
   ------------------------------------------------------------
   Want a real photo or video instead? Add a file to your project
   (e.g. images/photo.jpg or videos/clip.mp4) and give a chirp
   either  image: "images/photo.jpg"  or  video: "videos/clip.mp4"
   ============================================================ */
const artPalettes = {
  sunset:   ["#FF8A3D", "#E0245E", "#FFD27A"],
  midnight: ["#1E1B4B", "#6D28D9", "#38BDF8"],
  mint:     ["#0F766E", "#2DD4BF", "#BEF264"],
};

function artUri(name) {
  const [a, b, c] = artPalettes[name] || artPalettes.sunset;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient></defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <circle cx="610" cy="150" r="110" fill="${c}" opacity="0.85"/>
    <circle cx="150" cy="360" r="180" fill="${c}" opacity="0.18"/>
    <circle cx="400" cy="470" r="220" fill="#000" opacity="0.12"/>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function mediaHtml(t) {
  let html = "";
  if (t.video) {
    html += `<video class="chirp-media" src="${t.video}" controls preload="metadata" ${settings.autoplayVideo ? "autoplay muted loop" : ""}></video>`;
  }
  if (settings.showImages) {
    if (t.image) {
      html += `<img class="chirp-media" src="${t.image}" alt="${t.imageAlt || "Image attached to chirp"}" loading="lazy">`;
    } else if (t.art) {
      html += `<img class="chirp-media" src="${artUri(t.art)}" alt="${t.artAlt || "Abstract artwork"}" loading="lazy">`;
    }
  }
  return html;
}

/* ============================================================
   5. TIMELINE RENDERING
   ============================================================ */
const feedEl = document.getElementById("feed");
const filterBanner = document.getElementById("filterBanner");
const filterText = document.getElementById("filterText");
const clearFilterBtn = document.getElementById("clearFilter");

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function extractTags(text) {
  const matches = text.match(/#[a-z0-9_]+/gi) || [];
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

function renderTweetText(text) {
  return escapeHtml(text).replace(
    /#[a-z0-9_]+/gi,
    (tag) => `<span class="tag" data-tag="${tag.toLowerCase()}">${tag}</span>`
  );
}

function renderFeed() {
  const list = state.activeTag
    ? state.tweets.filter((t) => extractTags(t.text).includes(state.activeTag))
    : state.tweets;

  if (state.activeTag) {
    filterBanner.hidden = false;
    filterText.textContent = `Showing chirps tagged ${state.activeTag}`;
  } else {
    filterBanner.hidden = true;
  }

  if (list.length === 0) {
    feedEl.innerHTML = `
      <li class="empty-state">
        <i class="bi bi-wind"></i>
        No chirps here yet. Be the first to post.
      </li>`;
    return;
  }

  feedEl.innerHTML = list
    .map((t) => {
      const initials = t.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      return `
      <li class="chirp" data-id="${t.id}">
        <span class="avatar" style="--av:${t.avatarColor}">${initials}</span>
        <div class="chirp-body">
          <div class="chirp-head">
            <span class="chirp-name">${escapeHtml(t.name)}</span>
            <span class="chirp-handle">${t.handle}</span>
            <span class="chirp-time">${t.time}</span>
          </div>
          <p class="chirp-text">${renderTweetText(t.text)}</p>
          ${mediaHtml(t)}
          <div class="chirp-actions">
            <button class="chirp-action reply" data-action="reply" aria-label="Reply">
              <i class="bi bi-chat"></i><span>${t.replies}</span>
            </button>
            <button class="chirp-action retweet ${t.retweeted ? "is-active" : ""}" data-action="retweet" aria-pressed="${!!t.retweeted}" aria-label="Rechirp">
              <i class="bi bi-arrow-repeat"></i><span>${t.retweets}</span>
            </button>
            <button class="chirp-action like ${t.liked ? "is-active" : ""}" data-action="like" aria-pressed="${!!t.liked}" aria-label="Like">
              <i class="bi ${t.liked ? "bi-heart-fill" : "bi-heart"}"></i><span>${t.likes}</span>
            </button>
            <button class="chirp-action share" data-action="share" aria-label="Share">
              <i class="bi bi-upload"></i>
            </button>
          </div>
        </div>
      </li>`;
    })
    .join("");

  applyMediaVolume();
}

feedEl.addEventListener("click", (e) => {
  const tagEl = e.target.closest(".tag");
  if (tagEl) {
    applyTagFilter(tagEl.dataset.tag);
    return;
  }

  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.closest(".chirp").dataset.id;
  const tweet = state.tweets.find((t) => t.id === id);
  if (!tweet) return;

  if (btn.dataset.action === "like") {
    tweet.liked = !tweet.liked;
    tweet.likes += tweet.liked ? 1 : -1;
    if (tweet.liked) playSound("like");
    saveTweets();
    renderFeed();
  } else if (btn.dataset.action === "retweet") {
    tweet.retweeted = !tweet.retweeted;
    tweet.retweets += tweet.retweeted ? 1 : -1;
    if (tweet.retweeted) playSound("retweet");
    saveTweets();
    renderFeed();
  }
});

clearFilterBtn.addEventListener("click", () => {
  state.activeTag = null;
  renderFeed();
});

function applyTagFilter(tag) {
  state.activeTag = tag;
  switchTab("home");
  renderFeed();
}

function addTweet(text) {
  state.tweets.unshift({
    id: "t" + Date.now(),
    name: "Kaylan Reddi",
    handle: "@kaylanbuilds",
    avatarColor: "#E8590C",
    time: "now",
    text: text.trim(),
    likes: 0,
    retweets: 0,
    replies: 0,
  });
  saveTweets();
  playSound("post");
  renderFeed();
  renderTrends();
}

/* ============================================================
   6. COMPOSER + TABS
   ============================================================ */
const inlineComposer = document.getElementById("inlineComposer");
const inlineText = document.getElementById("inlineText");
const inlineCount = document.getElementById("inlineCount");
const inlineSubmit = inlineComposer.querySelector("button[type=submit]");

function updateCounter(textarea, counterEl, submitBtn) {
  const remaining = 280 - textarea.value.length;
  counterEl.textContent = remaining;
  counterEl.style.color = remaining < 20 ? "var(--like)" : "var(--muted)";
  submitBtn.disabled = textarea.value.trim().length === 0 || remaining < 0;
}

inlineText.addEventListener("input", () =>
  updateCounter(inlineText, inlineCount, inlineSubmit)
);

inlineComposer.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inlineText.value.trim()) return;
  addTweet(inlineText.value);
  inlineText.value = "";
  updateCounter(inlineText, inlineCount, inlineSubmit);
});

function switchTab(tab) {
  document.querySelectorAll(".tab-panel").forEach((p) =>
    p.classList.toggle("is-active", p.id === `tab-${tab}`)
  );
  document.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.classList.toggle("is-active", btn.dataset.tab === tab)
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

/* ============================================================
   7. COMPOSE POPUP MODAL
   ============================================================ */
const composeOverlay = document.getElementById("composeOverlay");
const composeText = document.getElementById("composeText");
const composeCount = document.getElementById("composeCount");
const composeSubmit = document.getElementById("composeSubmit");
const composeClose = document.getElementById("composeClose");

function openComposer() {
  composeOverlay.hidden = false;
  composeText.value = "";
  updateCounter(composeText, composeCount, composeSubmit);
  setTimeout(() => composeText.focus(), 50);
}
function closeComposer() { composeOverlay.hidden = true; }

document.querySelectorAll('[data-action="open-composer"]').forEach((btn) =>
  btn.addEventListener("click", openComposer)
);
composeClose.addEventListener("click", closeComposer);
composeOverlay.addEventListener("click", (e) => {
  if (e.target === composeOverlay) closeComposer();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeComposer(); closeStub(); }
});
composeText.addEventListener("input", () =>
  updateCounter(composeText, composeCount, composeSubmit)
);
composeSubmit.addEventListener("click", () => {
  if (!composeText.value.trim()) return;
  addTweet(composeText.value);
  closeComposer();
  switchTab("home");
});

/* Stub modal for Notifications / Profile */
const stubOverlay = document.getElementById("stubOverlay");
const stubTitle = document.getElementById("stubTitle");
const stubText = document.getElementById("stubText");
const stubClose = document.getElementById("stubClose");

function openStub(title, text) {
  stubTitle.textContent = title;
  stubText.textContent = text;
  stubOverlay.hidden = false;
}
function closeStub() { stubOverlay.hidden = true; }
stubClose.addEventListener("click", closeStub);
stubOverlay.addEventListener("click", (e) => {
  if (e.target === stubOverlay) closeStub();
});

document.querySelectorAll('[data-action="open-notifications"]').forEach((btn) =>
  btn.addEventListener("click", () =>
    openStub("Notifications", "Notifications aren't part of this project's scope, but the button is here so the nav feels complete.")
  )
);
document.querySelectorAll('[data-action="open-profile"]').forEach((btn) =>
  btn.addEventListener("click", () =>
    openStub("Profile", "A full profile page wasn't required for this clone. Home, Explore and Settings are where the features live.")
  )
);

/* ============================================================
   8. EXPLORE / TRENDING HASHTAGS
   ============================================================ */
const trendListEl = document.getElementById("trendList");
const railTrendListEl = document.getElementById("railTrendList");
const exploreSearch = document.getElementById("exploreSearch");

function computeTrends() {
  const counts = {};
  state.tweets.forEach((t) => {
    extractTags(t.text).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

function renderTrendListInto(el, trends) {
  if (trends.length === 0) {
    el.innerHTML = `<li class="trend-item" style="cursor:default">No hashtags found. Post a chirp with a #tag.</li>`;
    return;
  }
  el.innerHTML = trends
    .map((t, i) => `
      <li class="trend-item" data-tag="${t.tag}">
        <span class="trend-rank">${i + 1} · Trending</span>
        <span class="trend-tag">${t.tag}</span>
        <span class="trend-count">${t.count} chirp${t.count === 1 ? "" : "s"}</span>
      </li>`)
    .join("");
}

function renderTrends() {
  const trends = computeTrends();
  renderTrendListInto(trendListEl, trends);
  renderTrendListInto(railTrendListEl, trends.slice(0, 5));
}

document.body.addEventListener("click", (e) => {
  const item = e.target.closest(".trend-item[data-tag]");
  if (item) applyTagFilter(item.dataset.tag);
});

exploreSearch.addEventListener("input", () => {
  const q = exploreSearch.value.trim().toLowerCase().replace(/^#/, "");
  const trends = computeTrends().filter((t) => t.tag.includes(q));
  renderTrendListInto(trendListEl, trends);
});

/* ============================================================
   9. SETTINGS PAGE WIRING
   ============================================================ */
const themeButtons = document.querySelectorAll("[data-theme-choice]");
const fontButtons = document.querySelectorAll("[data-font-choice]");
const volumeInput = document.getElementById("volume");
const volumeOut = document.getElementById("volumeOut");
const soundEnabledInput = document.getElementById("soundEnabled");
const muteAllInput = document.getElementById("muteAll");
const reduceMotionInput = document.getElementById("reduceMotion");
const showImagesInput = document.getElementById("showImages");
const autoplayInput = document.getElementById("autoplayVideo");
const testSoundBtn = document.getElementById("testSound");
const resetDataBtn = document.getElementById("resetData");

function syncSettingsUI() {
  themeButtons.forEach((b) =>
    b.setAttribute("aria-checked", b.dataset.themeChoice === settings.theme)
  );
  fontButtons.forEach((b) =>
    b.setAttribute("aria-checked", b.dataset.fontChoice === settings.fontSize)
  );
  volumeInput.value = settings.volume;
  volumeOut.textContent = settings.volume + "%";
  soundEnabledInput.checked = settings.soundEnabled;
  muteAllInput.checked = settings.muted;
  reduceMotionInput.checked = settings.reduceMotion;
  showImagesInput.checked = settings.showImages;
  autoplayInput.checked = settings.autoplayVideo;
  volumeInput.disabled = !settings.soundEnabled;
}

function update(partial, rerender = false) {
  Object.assign(settings, partial);
  saveSettings();
  applySettings();
  syncSettingsUI();
  if (rerender) renderFeed();
}

themeButtons.forEach((b) =>
  b.addEventListener("click", () => update({ theme: b.dataset.themeChoice }))
);
fontButtons.forEach((b) =>
  b.addEventListener("click", () => update({ fontSize: b.dataset.fontChoice }))
);
volumeInput.addEventListener("input", () =>
  update({ volume: Number(volumeInput.value) })
);
volumeInput.addEventListener("change", () => playSound("test"));
soundEnabledInput.addEventListener("change", () =>
  update({ soundEnabled: soundEnabledInput.checked })
);
muteAllInput.addEventListener("change", () =>
  update({ muted: muteAllInput.checked })
);
reduceMotionInput.addEventListener("change", () =>
  update({ reduceMotion: reduceMotionInput.checked })
);
showImagesInput.addEventListener("change", () =>
  update({ showImages: showImagesInput.checked }, true)
);
autoplayInput.addEventListener("change", () =>
  update({ autoplayVideo: autoplayInput.checked }, true)
);
testSoundBtn.addEventListener("click", () => playSound("test"));

resetDataBtn.addEventListener("click", () => {
  if (!confirm("Reset the timeline to the starter chirps? Your own chirps and likes will be removed.")) return;
  state.tweets = JSON.parse(JSON.stringify(seedTweets));
  state.activeTag = null;
  saveTweets();
  renderFeed();
  renderTrends();
});

/* ============================================================
   INIT
   ============================================================ */
applySettings();
syncSettingsUI();
renderFeed();
renderTrends();