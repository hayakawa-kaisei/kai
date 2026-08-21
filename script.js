(() => {
  "use strict";

  const player = document.getElementById("player");
  const startScreen = document.getElementById("start-screen");
  const startBtn = document.getElementById("start-btn");
  const stage = document.getElementById("stage");

  const bgArt = document.getElementById("bg-art");
  const coverImg = document.getElementById("cover-img");
  const trackTitle = document.getElementById("track-title");
  const trackPrompt = document.getElementById("track-prompt");
  const trackCount = document.getElementById("track-count");
  const playingIndicator = document.getElementById("playing-indicator");

  const seek = document.getElementById("seek");
  const timeCurrent = document.getElementById("time-current");
  const timeTotal = document.getElementById("time-total");

  const btnPlay = document.getElementById("btn-play");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnMute = document.getElementById("btn-mute");
  const iconVolOn = document.getElementById("icon-vol-on");
  const iconVolOff = document.getElementById("icon-vol-off");

  const btnChoose = document.getElementById("btn-choose");
  const picker = document.getElementById("picker");
  const pickerClose = document.getElementById("picker-close");
  const pickerGrid = document.getElementById("picker-grid");
  const trackStrip = document.getElementById("track-strip");

  let tracks = [];
  let currentIndex = 0;
  let isSeeking = false;

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function loadTrack(index, { autoplay = true } = {}) {
    currentIndex = (index + tracks.length) % tracks.length;
    const t = tracks[currentIndex];

    player.src = encodeURI(t.audio);
    coverImg.src = encodeURI(t.image);
    coverImg.alt = t.title;
    bgArt.style.backgroundImage = `url("${encodeURI(t.image)}")`;

    trackTitle.textContent = t.title;
    trackPrompt.textContent = t.prompt;
    trackCount.textContent = `${String(t.id).padStart(2, "0")} / ${tracks.length}`;

    seek.value = 0;
    timeCurrent.textContent = "0:00";
    timeTotal.textContent = "0:00";

    highlightCurrentInPicker();
    highlightCurrentInStrip();

    if (autoplay) {
      player.play().catch(() => {});
    }
  }

  function next() { loadTrack(currentIndex + 1); }
  function prev() { loadTrack(currentIndex - 1); }

  function setPlayingUI(playing) {
    iconPlay.hidden = playing;
    iconPause.hidden = !playing;
    playingIndicator.classList.toggle("active", playing);
  }

  btnPlay.addEventListener("click", () => {
    if (player.paused) player.play().catch(() => {});
    else player.pause();
  });
  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);

  btnMute.addEventListener("click", () => {
    player.muted = !player.muted;
    iconVolOn.hidden = player.muted;
    iconVolOff.hidden = !player.muted;
  });

  player.addEventListener("play", () => setPlayingUI(true));
  player.addEventListener("pause", () => setPlayingUI(false));
  player.addEventListener("ended", next);

  player.addEventListener("loadedmetadata", () => {
    timeTotal.textContent = formatTime(player.duration);
  });

  player.addEventListener("timeupdate", () => {
    if (isSeeking) return;
    timeCurrent.textContent = formatTime(player.currentTime);
    if (player.duration) {
      seek.value = String((player.currentTime / player.duration) * 1000);
    }
  });

  seek.addEventListener("input", () => {
    isSeeking = true;
    if (player.duration) {
      timeCurrent.textContent = formatTime((Number(seek.value) / 1000) * player.duration);
    }
  });
  seek.addEventListener("change", () => {
    if (player.duration) {
      player.currentTime = (Number(seek.value) / 1000) * player.duration;
    }
    isSeeking = false;
  });

  function buildPicker() {
    pickerGrid.innerHTML = "";
    tracks.forEach((t, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "pick-card";
      card.dataset.index = String(i);
      card.innerHTML = `
        <span class="pick-thumb">
          <img src="${encodeURI(t.image)}" alt="" loading="lazy">
          <span class="pick-num">${String(t.id).padStart(2, "0")}</span>
        </span>
        <span class="pick-title">${escapeHtml(t.title)}</span>
      `;
      card.addEventListener("click", () => {
        loadTrack(i);
        closePicker();
      });
      pickerGrid.appendChild(card);
    });
  }

  function highlightCurrentInPicker() {
    pickerGrid.querySelectorAll(".pick-card").forEach((el) => {
      el.classList.toggle("is-current", Number(el.dataset.index) === currentIndex);
    });
  }

  function buildTrackStrip() {
    trackStrip.innerHTML = "";
    tracks.forEach((t, i) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "strip-item";
      item.dataset.index = String(i);
      item.setAttribute("aria-label", t.title);
      item.innerHTML = `<img src="${encodeURI(t.image)}" alt="" loading="lazy">`;
      item.addEventListener("click", () => loadTrack(i));
      trackStrip.appendChild(item);
    });
  }

  function highlightCurrentInStrip() {
    let currentEl = null;
    trackStrip.querySelectorAll(".strip-item").forEach((el) => {
      const isCurrent = Number(el.dataset.index) === currentIndex;
      el.classList.toggle("is-current", isCurrent);
      if (isCurrent) currentEl = el;
    });
    if (currentEl) {
      currentEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function openPicker() {
    highlightCurrentInPicker();
    picker.hidden = false;
  }
  function closePicker() { picker.hidden = true; }

  btnChoose.addEventListener("click", openPicker);
  pickerClose.addEventListener("click", closePicker);

  startBtn.addEventListener("click", () => {
    startScreen.hidden = true;
    stage.hidden = false;
    loadTrack(0, { autoplay: true });
  });

  fetch("data.json")
    .then((res) => res.json())
    .then((data) => {
      tracks = data;
      buildPicker();
      buildTrackStrip();
    })
    .catch((err) => {
      console.error("data.json の読み込みに失敗しました", err);
      startBtn.textContent = "読み込みエラー";
      startBtn.disabled = true;
    });
})();
