const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const storageKey = "theme";
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle ? themeToggle.querySelector(".theme-icon") : null;
const metaTheme = document.querySelector('meta[name="theme-color"]');
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

const themes = ["auto", "light", "dark"];
const themeIcons = {
  auto: "🌓",
  light: "☀️",
  dark: "🌙",
};
const themeLabels = {
  auto: "Tema: automático",
  light: "Tema: claro",
  dark: "Tema: oscuro",
};

let currentTheme = localStorage.getItem(storageKey) || "auto";

const updateThemeColor = () => {
  if (!metaTheme) return;
  const isDark = currentTheme === "dark" || (currentTheme === "auto" && systemPrefersDark.matches);
  metaTheme.setAttribute("content", isDark ? "#0b1a12" : "#007A33");
};

const updateToggleUI = () => {
  if (!themeToggle || !themeIcon) return;
  themeIcon.textContent = themeIcons[currentTheme] || themeIcons.auto;
  const label = themeLabels[currentTheme] || themeLabels.auto;
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("title", label);
  const srText = themeToggle.querySelector(".sr-only");
  if (srText) srText.textContent = label;
};

const applyTheme = (theme) => {
  currentTheme = theme;
  if (theme === "light" || theme === "dark") {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
  updateThemeColor();
  updateToggleUI();
};

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const index = themes.indexOf(currentTheme);
    const nextTheme = themes[(index + 1) % themes.length];
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });
}

systemPrefersDark.addEventListener("change", () => {
  if (currentTheme === "auto") {
    updateThemeColor();
  }
});

applyTheme(currentTheme);

const navToggle = document.getElementById("nav-toggle");
const primaryNav = document.getElementById("primary-nav");

if (navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    const label = isOpen ? "Cerrar menú" : "Abrir menú";
    navToggle.setAttribute("aria-label", label);
    const srText = navToggle.querySelector(".sr-only");
    if (srText) srText.textContent = label;
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menú");
      const srText = navToggle.querySelector(".sr-only");
      if (srText) srText.textContent = "Abrir menú";
    });
  });
}

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  },
};

const consentKey = "cookie-consent";
const consentDateKey = "cookie-consent-date";
const consentMaxAge = 1000 * 60 * 60 * 24 * 730;

const cookieBanner = document.getElementById("cookie-banner");
const consentButtons = document.querySelectorAll("[data-consent]");
const cookiePreferencesButtons = document.querySelectorAll(
  "#cookie-preferences-link, #cookie-details"
);
const cookieModal = document.getElementById("cookie-modal");
const cookieModalClose = document.getElementById("cookie-modal-close");
const analyticsScripts = document.querySelectorAll('script[data-consent="analytics"]');
const widgetContainer = document.getElementById("discord-widget");
const widgetTemplate = document.getElementById("discord-widget-template");
const widgetPlaceholder = document.getElementById("discord-widget-placeholder");
const widgetEnableButton = document.getElementById("cookie-enable-third-party");

const showBanner = () => {
  if (cookieBanner) cookieBanner.hidden = false;
};

const hideBanner = () => {
  if (cookieBanner) cookieBanner.hidden = true;
};

const loadWidget = () => {
  if (!widgetContainer || !widgetTemplate) return;
  if (!widgetContainer.querySelector("iframe")) {
    widgetContainer.appendChild(widgetTemplate.content.cloneNode(true));
  }
  if (widgetPlaceholder) widgetPlaceholder.hidden = true;
  if (widgetEnableButton) widgetEnableButton.hidden = true;
};

const unloadWidget = () => {
  if (!widgetContainer) return;
  const iframe = widgetContainer.querySelector("iframe");
  if (iframe) iframe.remove();
  if (widgetPlaceholder) widgetPlaceholder.hidden = false;
  if (widgetEnableButton) widgetEnableButton.hidden = false;
};

const isConsentExpired = () => {
  const dateValue = storage.get(consentDateKey);
  if (!dateValue) return true;
  const saved = Number(dateValue);
  if (!Number.isFinite(saved)) return true;
  return Date.now() - saved > consentMaxAge;
};

const applyConsent = (value) => {
  if (value === "accepted") {
    loadWidget();
    enableAnalytics();
    if (widgetEnableButton) widgetEnableButton.hidden = true;
  } else {
    unloadWidget();
    if (widgetEnableButton) widgetEnableButton.hidden = false;
  }
};

const initConsent = () => {
  const saved = storage.get(consentKey);
  if (!saved || isConsentExpired()) {
    storage.remove(consentKey);
    storage.remove(consentDateKey);
    showBanner();
    unloadWidget();
    return;
  }
  applyConsent(saved);
};

consentButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.consent === "accept" ? "accepted" : "rejected";
    setConsent(value);
  });
});

cookiePreferencesButtons.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });
});

if (widgetEnableButton) {
  widgetEnableButton.addEventListener("click", (event) => {
    event.preventDefault();
    setConsent("accepted");
  });
}

initConsent();

function setConsent(value) {
  storage.set(consentKey, value);
  storage.set(consentDateKey, Date.now().toString());
  hideBanner();
  closeModal();
  applyConsent(value);
}

function openModal() {
  if (!cookieModal) return;
  cookieModal.hidden = false;
}

function closeModal() {
  if (!cookieModal) return;
  cookieModal.hidden = true;
}

if (cookieModal) {
  cookieModal.addEventListener("click", (event) => {
    if (event.target === cookieModal) {
      closeModal();
    }
  });
}

if (cookieModalClose) {
  cookieModalClose.addEventListener("click", closeModal);
}

function enableAnalytics() {
  if (!analyticsScripts.length) return;
  analyticsScripts.forEach((script) => {
    if (script.dataset.loaded === "true") return;
    if (script.src) {
      const external = document.createElement("script");
      external.src = script.src;
      external.async = true;
      document.head.appendChild(external);
    } else {
      const inline = document.createElement("script");
      inline.textContent = script.textContent;
      document.head.appendChild(inline);
    }
    script.dataset.loaded = "true";
  });
}

const copyButtons = document.querySelectorAll("[data-copy]");
copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    if (!value) return;
    const status = button.parentElement ? button.parentElement.querySelector(".copy-status") : null;
    try {
      await navigator.clipboard.writeText(value);
      button.classList.add("copied");
      if (status) status.textContent = "IP copiada";
      setTimeout(() => {
        button.classList.remove("copied");
        if (status) status.textContent = "";
      }, 1200);
    } catch {
      if (status) status.textContent = "Copia manual";
      setTimeout(() => {
        if (status) status.textContent = "";
      }, 1200);
      return;
    }
  });
});
