const STORAGE_KEY = "dashboardLocation";
const TASKS_STORAGE_KEY = "dashboardTasks";
const DEFAULT_LOCATION = "Bengaluru";

const WORLD_CLOCKS = [
  { label: "Japan", timezone: "Asia/Tokyo" },
  { label: "Singapore", timezone: "Asia/Singapore" },
  { label: "India", timezone: "Asia/Kolkata" },
  { label: "London", timezone: "Europe/London" },
  { label: "New York", timezone: "America/New_York" }
];

let STOCK_SYMBOLS = JSON.parse(localStorage.getItem("dashboardStocks") || '["AAPL", "MSFT", "GOOGL"]');

const NEWS_FEEDS = {
  sports: "https://www.espn.com/espn/rss/news",
  local: "https://news.google.com/rss/search?q=India&hl=en-IN&gl=IN&ceid=IN:en",
  geo: "https://feeds.bbci.co.uk/news/world/rss.xml",
  tech: "https://techcrunch.com/feed/"
};

const el = {
  todayLabel: document.getElementById("todayLabel"),
  locationInput: document.getElementById("locationInput"),
  saveLocationBtn: document.getElementById("saveLocationBtn"),
  weatherStatus: document.getElementById("weatherStatus"),
  weatherVisual: document.getElementById("weatherVisual"),
  weatherDateLabel: document.getElementById("weatherDateLabel"),
  weatherLocationLabel: document.getElementById("weatherLocationLabel"),
  weatherSymbol: document.getElementById("weatherSymbol"),
  weatherCondition: document.getElementById("weatherCondition"),
  temperatureValue: document.getElementById("temperatureValue"),
  pressureValue: document.getElementById("pressureValue"),
  aqiValue: document.getElementById("aqiValue"),
  humidityValue: document.getElementById("humidityValue"),
  windValue: document.getElementById("windValue"),
  precipValue: document.getElementById("precipValue"),
  apparentTempValue: document.getElementById("apparentTempValue"),
  forecastList: document.getElementById("forecastList"),
  clockList: document.getElementById("clockList"),
  sportsNews: document.getElementById("sportsNews"),
  localNews: document.getElementById("localNews"),
  geoNews: document.getElementById("geoNews"),
  techNews: document.getElementById("techNews"),
  stockList: document.getElementById("stockList"),
  stockInput: document.getElementById("stockInput"),
  addStockBtn: document.getElementById("addStockBtn"),
  hnList: document.getElementById("hnList"),

  // Pomodoro
  pomodoroProgress: document.getElementById("pomodoroProgress"),
  pomodoroDisplay: document.getElementById("pomodoroDisplay"),
  pomodoroModeBtn: document.getElementById("pomodoroModeBtn"),
  pomodoroStartBtn: document.getElementById("pomodoroStartBtn"),
  pomodoroPauseBtn: document.getElementById("pomodoroPauseBtn"),
  pomodoroResetBtn: document.getElementById("pomodoroResetBtn"),

  // Tasks
  taskInput: document.getElementById("taskInput"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  taskList: document.getElementById("taskList"),

  // Chrome Monitor
  tabCountLabel: document.getElementById("tabCountLabel"),
  memoryLabel: document.getElementById("memoryLabel"),
  clearCacheBtn: document.getElementById("clearCacheBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  speedValue: document.getElementById("speedValue"),
  speedGaugePath: document.getElementById("speedGaugePath"),
  runSpeedTestBtn: document.getElementById("runSpeedTestBtn"),
  memoryGraphArea: document.getElementById("memoryGraphArea"),
  memoryGraphLine: document.getElementById("memoryGraphLine")
};

const WEATHER_CODE_MAP = {
  0: { label: "Clear", icon: "✨" },
  1: { label: "Mainly Clear", icon: "🌤️" },
  2: { label: "Partly Cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Rime Fog", icon: "🌫️" },
  51: { label: "Light Drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy Drizzle", icon: "🌧️" },
  56: { label: "Freezing Drizzle", icon: "🌧️" },
  57: { label: "Freezing Drizzle", icon: "🌧️" },
  61: { label: "Light Rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy Rain", icon: "🌧️" },
  66: { label: "Freezing Rain", icon: "🌧️" },
  67: { label: "Freezing Rain", icon: "🌧️" },
  71: { label: "Light Snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy Snow", icon: "❄️" },
  77: { label: "Snow Grains", icon: "❄️" },
  80: { label: "Rain Showers", icon: "🌦️" },
  81: { label: "Rain Showers", icon: "🌧️" },
  82: { label: "Violent Showers", icon: "⛈️" },
  85: { label: "Snow Showers", icon: "🌨️" },
  86: { label: "Heavy Snow Showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm Hail", icon: "⛈️" },
  99: { label: "Severe Thunderstorm", icon: "⛈️" }
};

// --- UTILS --- //

function setTodayLabel() {
  const now = new Date();
  el.todayLabel.textContent = now.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// --- WEATHER --- //

async function resolveLocation(locationName) {
  const q = encodeURIComponent(locationName);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`;
  const data = await fetchJson(url);
  if (!data.results || !data.results.length) throw new Error("Location not found");
  return data.results[0];
}

function mapAqiLevel(aqi) {
  if (aqi <= 50) return `${aqi} (Good)`;
  if (aqi <= 100) return `${aqi} (Moderate)`;
  if (aqi <= 150) return `${aqi} (Sensitive)`;
  if (aqi <= 200) return `${aqi} (Unhealthy)`;
  if (aqi <= 300) return `${aqi} (Very Unhealthy)`;
  return `${aqi} (Hazardous)`;
}

function weatherCodeInfo(code) {
  return WEATHER_CODE_MAP[code] || { label: "Unknown", icon: "🌡️" };
}

function renderForecast(days, minTemps, maxTemps, weatherCodes) {
  el.forecastList.innerHTML = "";
  days.slice(0, 7).forEach((day, i) => {
    const row = document.createElement("div");
    row.className = "forecast-day";
    const dayName = new Date(day).toLocaleDateString(undefined, { weekday: "short" });
    const info = weatherCodeInfo(weatherCodes[i]);
    row.innerHTML = `
      <span>${info.icon}</span>
      <span>${dayName}</span>
      <span>${info.label}</span>
      <strong>${Math.round(minTemps[i])}° / ${Math.round(maxTemps[i])}°</strong>
    `;
    el.forecastList.appendChild(row);
  });
}

const UNSPLASH_CITIES = {
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1920&h=1080&fit=crop",
  "london": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1920&h=1080&fit=crop",
  "tokyo": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1920&h=1080&fit=crop",
  "singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1920&h=1080&fit=crop",
  "bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1920&h=1080&fit=crop",
  "bangalore": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1920&h=1080&fit=crop",
  "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1920&h=1080&fit=crop",
  "dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1920&h=1080&fit=crop",
  "sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1920&h=1080&fit=crop",
  "san francisco": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1920&h=1080&fit=crop",
  "mumbai": "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?q=80&w=1920&h=1080&fit=crop",
  "toronto": "https://images.unsplash.com/photo-1507992781348-310259076fe0?q=80&w=1920&h=1080&fit=crop",
  "chicago": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1920&h=1080&fit=crop",
  "berlin": "https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=1920&h=1080&fit=crop",
  "rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1920&h=1080&fit=crop"
};

const UNSPLASH_DEFAULTS = [
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1920&h=1080&fit=crop"
];

let REDDIT_WALLPAPERS = [];

async function loadRedditWallpapers() {
  try {
    const CACHE_KEY = "dashboardRedditWallpapers";
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const now = Date.now();

    // Use cached list if it's less than 6 hours old
    if (cache.timestamp && (now - cache.timestamp < 6 * 60 * 60 * 1000) && cache.urls && cache.urls.length) {
      REDDIT_WALLPAPERS = cache.urls;
      return;
    }

    const res = await fetch("https://www.reddit.com/r/wallpapers/hot.json?limit=50");
    const json = await res.json();
    const urls = json.data.children
      .map(child => child.data.url)
      .filter(url => url && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg')));

    if (urls.length) {
      REDDIT_WALLPAPERS = urls;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: now,
        urls: REDDIT_WALLPAPERS
      }));
    }
  } catch (err) {
    console.error("Failed to load Reddit wallpapers", err);
  }
}

async function updateWeatherBackground(locationName) {
  const bgLayer = document.querySelector('.bg-layer');

  // Set Widget background from City names
  const safeName = locationName.trim().toLowerCase();
  let cityImgUrl = UNSPLASH_CITIES[safeName];
  if (!cityImgUrl) {
    const randIndex = Math.floor(Math.random() * UNSPLASH_DEFAULTS.length);
    cityImgUrl = UNSPLASH_DEFAULTS[randIndex];
  }
  const widgetImageUrl = cityImgUrl.replace("w=1920&h=1080", "w=900&h=700");
  const widgetImg = new Image();
  widgetImg.onload = () => el.weatherVisual.style.backgroundImage = `url("${widgetImageUrl}")`;
  widgetImg.src = widgetImageUrl;

  // Set Main Background to Reddit Wallpaper
  if (bgLayer) {
    if (!REDDIT_WALLPAPERS.length) {
      await loadRedditWallpapers();
    }
    let wallpaperUrl = UNSPLASH_DEFAULTS[0];
    if (REDDIT_WALLPAPERS.length) {
      const randIndex = Math.floor(Math.random() * REDDIT_WALLPAPERS.length);
      wallpaperUrl = REDDIT_WALLPAPERS[randIndex];
    }
    const bgImg = new Image();
    bgImg.onload = () => bgLayer.style.backgroundImage = `url("${wallpaperUrl}")`;
    bgImg.src = wallpaperUrl;
  }
}

async function loadWeather() {
  const locationName = localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCATION;
  el.locationInput.value = locationName;
  el.weatherStatus.textContent = "Live";

  try {
    const location = await resolveLocation(locationName);
    const { latitude, longitude } = location;
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      "&current=temperature_2m,apparent_temperature,surface_pressure,relative_humidity_2m,wind_speed_10m,precipitation,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7&timezone=auto";
    const aqiUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
      "&current=us_aqi";

    const [weatherData, aqiData] = await Promise.all([fetchJson(weatherUrl), fetchJson(aqiUrl)]);
    const weatherInfo = weatherCodeInfo(weatherData.current.weather_code);

    el.temperatureValue.textContent = `${Math.round(weatherData.current.temperature_2m)}°C`;
    el.weatherSymbol.textContent = weatherInfo.icon;
    el.weatherCondition.textContent = weatherInfo.label;
    el.weatherLocationLabel.textContent = locationName;
    el.weatherDateLabel.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric"
    });

    el.pressureValue.textContent = `${Math.round(weatherData.current.surface_pressure)} hPa`;
    el.aqiValue.textContent = mapAqiLevel(Math.round(aqiData.current.us_aqi));
    el.humidityValue.textContent = `${Math.round(weatherData.current.relative_humidity_2m)}%`;
    el.windValue.textContent = `${Math.round(weatherData.current.wind_speed_10m)} km/h`;
    el.precipValue.textContent = `${weatherData.current.precipitation.toFixed(1)} mm`;
    el.apparentTempValue.textContent = `${Math.round(weatherData.current.apparent_temperature)}°C`;

    updateWeatherBackground(locationName);
    renderForecast(
      weatherData.daily.time,
      weatherData.daily.temperature_2m_min,
      weatherData.daily.temperature_2m_max,
      weatherData.daily.weather_code
    );
  } catch (err) {
    el.weatherStatus.textContent = "Unavailable";
    console.error(err);
  }
}

// --- CLOCKS --- //

function renderClocks() {
  el.clockList.innerHTML = "";
  WORLD_CLOCKS.forEach((zone) => {
    const item = document.createElement("div");
    item.className = "clock-item";
    item.dataset.timezone = zone.timezone;
    item.innerHTML = `
      <div class="chronograph-wrapper">
        <div class="chronograph">
          <div class="dial-ring">
            <div class="dial-number num-12">12</div>
            <div class="dial-number num-3">3</div>
            <div class="dial-number num-6">6</div>
            <div class="dial-number num-9">9</div>
            <div class="hand hour-hand"></div>
            <div class="hand minute-hand"></div>
            <div class="hand second-hand"></div>
            <div class="dial-center"></div>
          </div>
        </div>
      </div>
      <div class="clock-meta">
        <strong>${zone.label}</strong>
      </div>
    `;
    el.clockList.appendChild(item);
  });
}

function getTimeParts(now, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const parts = formatter.formatToParts(now);
  const read = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return {
    hour: read("hour"),
    minute: read("minute"),
    second: read("second")
  };
}

function tickClocks() {
  const now = new Date();
  document.querySelectorAll(".clock-item").forEach((item) => {
    const tz = item.dataset.timezone;
    const { hour, minute, second } = getTimeParts(now, tz);

    const hourDeg = (hour % 12) * 30 + minute * 0.5 + second * (0.5 / 60);
    const minuteDeg = minute * 6 + second * 0.1;
    const secondDeg = second * 6;

    item.querySelector(".hour-hand").style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    item.querySelector(".minute-hand").style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    item.querySelector(".second-hand").style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
  });
}

// --- RSS & NEWS --- //

function parseRssItems(xmlText, max = 5) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const items = Array.from(doc.querySelectorAll("item")).slice(0, max);
  return items.map((item) => ({
    title: item.querySelector("title")?.textContent?.trim() || "Untitled",
    link: item.querySelector("link")?.textContent?.trim() || "#"
  }));
}

function renderNewsList(container, items) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = "<li>Unavailable</li>";
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a>`;
    container.appendChild(li);
  });
}

async function loadNewsCategory(url, container) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Feed unavailable");
    const xml = await res.text();
    const items = parseRssItems(xml);
    renderNewsList(container, items);
  } catch {
    renderNewsList(container, []);
  }
}

async function loadAllNews() {
  await Promise.all([
    loadNewsCategory(NEWS_FEEDS.sports, el.sportsNews),
    loadNewsCategory(NEWS_FEEDS.local, el.localNews),
    loadNewsCategory(NEWS_FEEDS.geo, el.geoNews),
    loadNewsCategory(NEWS_FEEDS.tech, el.techNews)
  ]);
}

async function loadHackerNews() {
  try {
    const data = await fetchJson("https://hn.algolia.com/api/v1/search?tags=front_page");
    const stories = (data.hits || []).slice(0, 15).map((hit) => ({
      title: hit.title || "Untitled",
      link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
    }));
    renderNewsList(el.hnList, stories);
  } catch {
    renderNewsList(el.hnList, []);
  }
}

// --- STOCKS --- //

const COMPANY_NAMES = {
  "AAPL": "Apple Inc.",
  "MSFT": "Microsoft",
  "GOOGL": "Alphabet Inc."
};

const COMPANY_DOMAINS = {
  "AAPL": "apple.com",
  "MSFT": "microsoft.com",
  "GOOGL": "google.com"
};

function renderStock(symbol, closes, prevClose) {
  const last = closes[closes.length - 1];
  const referencePrice = prevClose || closes[0];
  const changeAmt = last - referencePrice;
  const changePct = (changeAmt / referencePrice) * 100;
  const up = changeAmt >= 0;

  const themeColor = up ? "#10b981" : "#ef4444";
  const bgGradient = up ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)";
  const name = COMPANY_NAMES[symbol] || symbol;

  // High quality logo fallbacks in case of missing domains or blocked clearbit requests
  const domain = COMPANY_DOMAINS[symbol];
  const fallbackLogoUrl = `https://ui-avatars.com/api/?name=${symbol}&background=f8fafc&color=0f172a&rounded=true&font-size=0.35&bold=true`;
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : fallbackLogoUrl;

  const width = 300;
  const height = 90;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const spread = max - min || 1;
  const buffer = spread * 0.15;

  const pointsData = closes.map((v, i) => {
    const x = (i / (closes.length - 1)) * width;
    const y = height - ((v - (min - buffer)) / (spread + buffer * 2)) * height;
    return `${x},${y}`;
  });

  const linePoints = pointsData.join(" ");
  const areaPoints = `${linePoints} ${width},${height} 0,${height}`;

  const card = document.createElement("div");
  card.className = "stock-card-pro";
  card.style.background = `linear-gradient(180deg, rgba(255,255,255,0.7) 0%, ${bgGradient} 100%)`;

  card.innerHTML = `
    <div class="scp-header">
      <div class="scp-identity">
        <div class="scp-logo-frame">
           <img class="stock-logo-img" src="${logoUrl}" alt="${symbol}" />
           <div class="stock-logo-fallback" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem; color:#475569; background:#f1f5f9; border-radius:50%;">${symbol.charAt(0)}</div>
        </div>
        <div class="scp-title-group">
           <h3>${name}</h3>
           <div class="scp-meta">
              <span>$${referencePrice.toFixed(2)} Prev Close</span> • <span>${symbol} Symbol</span>
           </div>
        </div>
      </div>
      <div class="scp-price-actions" style="margin-top: 4px;">
        <div class="scp-price-group">
           <h2>$${last.toFixed(2)}</h2>
           <span class="scp-badge ${up ? 'up' : 'down'}">
             ${up ? '+' : ''}${changeAmt.toFixed(2)} (${up ? '+' : ''}${changePct.toFixed(2)}%)
           </span>
        </div>
        <button class="remove-stock-btn btn-ghost" data-symbol="${symbol}" title="Remove stock" style="padding:4px 8px; font-size:1.4rem; cursor:pointer;" aria-label="Remove ${symbol}">✕</button>
      </div>
    </div>
    <div class="scp-chart-wrapper">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad-${symbol}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${themeColor}" stop-opacity="0.3" />
            <stop offset="100%" stop-color="${themeColor}" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polygon points="${areaPoints}" fill="url(#grad-${symbol})" />
        <polyline points="${linePoints}" fill="none" stroke="${themeColor}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `;

  const logoImg = card.querySelector('.stock-logo-img');
  const logoFallback = card.querySelector('.stock-logo-fallback');
  if (logoImg && logoFallback) {
    logoImg.addEventListener('error', function () {
      this.style.display = 'none';
      logoFallback.style.display = 'flex';
    });
  }

  card.querySelector('.remove-stock-btn').addEventListener('click', () => {
    STOCK_SYMBOLS = STOCK_SYMBOLS.filter(s => s !== symbol);
    localStorage.setItem("dashboardStocks", JSON.stringify(STOCK_SYMBOLS));
    loadStocks();
  });

  el.stockList.appendChild(card);
}

async function loadStocks() {
  el.stockList.innerHTML = "";
  await Promise.all(
    STOCK_SYMBOLS.map(async (symbol) => {
      try {
        // Reduced interval to 5m to fetch rich data points for an accurate graph line
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
        const data = await fetchJson(url);
        const result = data.chart?.result?.[0];

        // Retrieve Official Yahoo Finance Previous Close Metadata
        const prevClose = result?.meta?.chartPreviousClose;
        const closes = result?.indicators?.quote?.[0]?.close?.filter((v) => typeof v === "number" && v > 0);

        if (!closes || closes.length < 2) return;
        renderStock(symbol, closes, prevClose);
      } catch {
        // Skip unavailable symbol
      }
    })
  );
  if (!el.stockList.children.length) {
    el.stockList.innerHTML = "<p style='color: var(--text-muted);'>Stocks unavailable</p>";
  }
}

// --- POMODORO --- //

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

let pomodoroTime = POMODORO_WORK;
let isPomodoroRunning = false;
let isPomodoroBreak = false;
let pomodoroInterval = null;
const pomodoroCircumference = 54 * 2 * Math.PI;

function updatePomodoroDisplay() {
  const minutes = Math.floor(pomodoroTime / 60);
  const seconds = pomodoroTime % 60;
  el.pomodoroDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const total = isPomodoroBreak ? POMODORO_BREAK : POMODORO_WORK;
  const progress = pomodoroTime / total;
  const offset = pomodoroCircumference - (progress * pomodoroCircumference);
  el.pomodoroProgress.style.strokeDashoffset = offset;

  el.pomodoroProgress.style.stroke = isPomodoroBreak ? "var(--accent-success)" : "var(--accent-primary)";
}

function startPomodoro() {
  if (isPomodoroRunning) return;
  isPomodoroRunning = true;
  el.pomodoroStartBtn.style.display = "none";
  el.pomodoroPauseBtn.style.display = "inline-block";

  pomodoroInterval = setInterval(() => {
    pomodoroTime--;
    if (pomodoroTime <= 0) {
      clearInterval(pomodoroInterval);
      isPomodoroRunning = false;
      isPomodoroBreak = !isPomodoroBreak;
      pomodoroTime = isPomodoroBreak ? POMODORO_BREAK : POMODORO_WORK;
      el.pomodoroStartBtn.style.display = "inline-block";
      el.pomodoroPauseBtn.style.display = "none";
      // Optional: Play a sound here.
      alert(isPomodoroBreak ? "Time for a break!" : "Back to work!");
    }
    updatePomodoroDisplay();
  }, 1000);
}

function pausePomodoro() {
  clearInterval(pomodoroInterval);
  isPomodoroRunning = false;
  el.pomodoroStartBtn.style.display = "inline-block";
  el.pomodoroPauseBtn.style.display = "none";
}

function resetPomodoro() {
  pausePomodoro();
  pomodoroTime = isPomodoroBreak ? POMODORO_BREAK : POMODORO_WORK;
  updatePomodoroDisplay();
}

function switchPomodoroMode() {
  pausePomodoro();
  isPomodoroBreak = !isPomodoroBreak;
  pomodoroTime = isPomodoroBreak ? POMODORO_BREAK : POMODORO_WORK;
  el.pomodoroModeBtn.textContent = isPomodoroBreak ? "Work" : "Break";
  updatePomodoroDisplay();
}

// --- TASKS --- //

let tasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || "[]");

function saveTasks() {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  el.taskList.innerHTML = "";
  if (tasks.length === 0) {
    el.taskList.innerHTML = '<li style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding: 10px;">No active tasks</li>';
    return;
  }
  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? 'completed' : ''}`;

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
      <span class="task-text">${task.text}</span>
      <button class="task-delete">✕</button>
    `;

    li.querySelector('.task-checkbox').addEventListener('change', (e) => {
      task.completed = e.target.checked;
      saveTasks();
      renderTasks();
    });

    li.querySelector('.task-delete').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    el.taskList.appendChild(li);
  });
}

function addTask() {
  const text = el.taskInput.value.trim();
  if (!text) return;

  tasks.push({
    id: Date.now().toString(),
    text,
    completed: false
  });
  el.taskInput.value = "";
  saveTasks();
  renderTasks();
}

// --- CHROME MONITOR --- //

let memoryHistory = Array(20).fill(0);

function updateMemoryGraph(value) {
  memoryHistory.push(value);
  memoryHistory.shift();

  const currentMax = Math.max(...memoryHistory) * 1.2 || 1;
  const width = 100;
  const height = 30;
  const dx = width / (memoryHistory.length - 1);

  const points = memoryHistory.map((val, i) => {
    const x = (i * dx).toFixed(1);
    const y = (height - (val / currentMax) * height).toFixed(1);
    return `${x},${y}`;
  });

  const pointsStr = points.join(" ");
  if (el.memoryGraphLine) el.memoryGraphLine.setAttribute("points", pointsStr);
  if (el.memoryGraphArea) el.memoryGraphArea.setAttribute("points", `${pointsStr} ${width},${height} 0,${height}`);
}

let isSpeedTestRunning = false;

async function runSpeedTest() {
  if (isSpeedTestRunning) return;
  isSpeedTestRunning = true;
  if (el.runSpeedTestBtn) el.runSpeedTestBtn.textContent = "Testing...";
  if (el.speedValue) el.speedValue.textContent = "0.0";

  // Download 10MB chunk from Cloudflare to accurately measure speed
  const targetBytes = 10000000;
  const url = `https://speed.cloudflare.com/__down?bytes=${targetBytes}`;

  try {
    const response = await fetch(url);
    if (!response.body) throw new Error("ReadableStream not supported");

    const reader = response.body.getReader();
    const startTime = Date.now();
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      loaded += value.length;
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      if (elapsed > 0.1) {
        const bytesPerSec = loaded / elapsed;
        const mbps = (bytesPerSec * 8) / (1000 * 1000);

        if (el.speedValue) el.speedValue.textContent = mbps.toFixed(1);

        // Scale against 100 Mbps max for the gauge
        const MAX_SPEED = 100;
        const progress = Math.min(mbps / MAX_SPEED, 1.0);
        const offset = 125.6 * (1 - progress);

        if (el.speedGaugePath) {
          el.speedGaugePath.style.strokeDashoffset = offset;
          if (mbps < 10) el.speedGaugePath.style.stroke = "var(--accent-danger)";
          else if (mbps < 40) el.speedGaugePath.style.stroke = "#eab308";
          else el.speedGaugePath.style.stroke = "var(--accent-success)";
        }
      }
    }

    const finalElapsed = (Date.now() - startTime) / 1000;
    const finalMbps = ((loaded / finalElapsed) * 8) / (1000 * 1000);
    if (el.speedValue) el.speedValue.textContent = finalMbps.toFixed(1);

  } catch (err) {
    console.error("Speed test failed:", err);
    if (el.speedValue) el.speedValue.textContent = "Err";
  } finally {
    isSpeedTestRunning = false;
    if (el.runSpeedTestBtn) el.runSpeedTestBtn.textContent = "Run Test";
  }
}

function updateChromeMonitor() {
  if (window.chrome && chrome.tabs) {
    chrome.tabs.query({}, (tabs) => {
      if (el.tabCountLabel) {
        el.tabCountLabel.textContent = tabs.length.toString();
      }
    });

    // To prevent adding multiple listeners, normally wouldn't do inside update loop,
    // but tabs API doesn't get called repeatedly in standard flows unless re-invoked
    if (!window.__tabsBound) {
      chrome.tabs.onCreated.addListener(updateChromeMonitor);
      chrome.tabs.onRemoved.addListener(updateChromeMonitor);
      window.__tabsBound = true;
    }
  }

  // Use system memory API (available on stable channel without 'processes' permission)
  if (window.chrome && chrome.system && chrome.system.memory) {
    chrome.system.memory.getInfo((info) => {
      const used = info.capacity - info.availableCapacity;
      const usedGB = used / (1024 * 1024 * 1024);
      if (el.memoryLabel) el.memoryLabel.textContent = "Sys: " + usedGB.toFixed(1) + " GB";
      updateMemoryGraph(usedGB * 1024); // store MB
    });

    if (!window.__memBound) {
      setInterval(() => {
        chrome.system.memory.getInfo((info) => {
          const used = info.capacity - info.availableCapacity;
          const usedGB = used / (1024 * 1024 * 1024);
          if (el.memoryLabel) el.memoryLabel.textContent = "Sys: " + usedGB.toFixed(1) + " GB";
          updateMemoryGraph(usedGB * 1024);
        });
      }, 2000);
      window.__memBound = true;
    }
  } else if (window.performance && performance.memory) {
    if (!window.__memBound) {
      setInterval(() => {
        const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        if (el.memoryLabel) el.memoryLabel.textContent = "Tab: " + usedMB.toFixed(0) + " MB";
        updateMemoryGraph(usedMB);
      }, 2000);
      window.__memBound = true;
    }
  }

  if (!window.__speedTestBound) {
    runSpeedTest(); // Run once on load
    window.__speedTestBound = true;
  }
}

function bindChromeActions() {
  if (el.runSpeedTestBtn) {
    el.runSpeedTestBtn.addEventListener('click', runSpeedTest);
  }
  if (el.clearCacheBtn) {
    el.clearCacheBtn.addEventListener('click', () => {
      if (window.chrome && chrome.browsingData) {
        chrome.browsingData.remove({ since: 0 }, { "cache": true }, () => {
          alert("Browser Cache cleared successfully!");
        });
      } else {
        alert("Chrome specific APIs are not available in this environment.");
      }
    });
  }

  if (el.clearHistoryBtn) {
    el.clearHistoryBtn.addEventListener('click', () => {
      if (window.chrome && chrome.browsingData) {
        chrome.browsingData.remove({ since: 0 }, { "history": true }, () => {
          alert("Browser History cleared successfully!");
        });
      } else {
        alert("Chrome specific APIs are not available in this environment.");
      }
    });
  }
}

// --- INITIALIZATION --- //

function bindActions() {
  bindChromeActions();
  el.saveLocationBtn.addEventListener("click", () => {
    const value = el.locationInput.value.trim();
    if (!value) return;
    localStorage.setItem(STORAGE_KEY, value);
    loadWeather();
    loadNewsCategory(
      `https://news.google.com/rss/search?q=${encodeURIComponent(value)}&hl=en&gl=US&ceid=US:en`,
      el.localNews
    );
  });

  el.pomodoroStartBtn.addEventListener('click', startPomodoro);
  el.pomodoroPauseBtn.addEventListener('click', pausePomodoro);
  el.pomodoroResetBtn.addEventListener('click', resetPomodoro);
  el.pomodoroModeBtn.addEventListener('click', switchPomodoroMode);

  el.addTaskBtn.addEventListener('click', addTask);
  el.taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  el.addStockBtn.addEventListener('click', () => {
    const sym = el.stockInput.value.trim().toUpperCase();
    if (!sym) return;
    if (!STOCK_SYMBOLS.includes(sym)) {
      STOCK_SYMBOLS.push(sym);
      localStorage.setItem("dashboardStocks", JSON.stringify(STOCK_SYMBOLS));
      el.stockList.innerHTML = "<p style='color: var(--text-muted);'>Loading...</p>";
      loadStocks();
    }
    el.stockInput.value = "";
  });
  el.stockInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') el.addStockBtn.click();
  });
}

async function init() {
  setTodayLabel();
  renderClocks();
  tickClocks();
  setInterval(tickClocks, 1000);

  updatePomodoroDisplay();
  renderTasks();
  updateChromeMonitor();

  bindActions();
  await Promise.all([loadWeather(), loadAllNews(), loadStocks(), loadHackerNews()]);
}

init();
