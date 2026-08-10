const LanguageManager = {
  currentLang: "en",
  listeners: [],

  init() {
    // 1. Determine starting language (default: en)
    const storedLang = localStorage.getItem("purunpuan_language");
    if (storedLang === "id" || storedLang === "en") {
      this.currentLang = storedLang;
    } else {
      this.currentLang = "en";
    }

    // 2. Set document language attribute
    document.documentElement.lang = this.currentLang;

    // 3. Register click handler for language selectors
    document.querySelectorAll(".lang-toggle").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const nextLang = this.currentLang === "en" ? "id" : "en";
        this.setLanguage(nextLang);
      });
    });

    // 4. Perform initial DOM update
    this.updateDOM();
  },

  registerListener(callback) {
    this.listeners.push(callback);
    // Call immediately with current language to sync state
    callback(this.currentLang);
  },

  setLanguage(lang) {
    if (lang !== "en" && lang !== "id") return;
    this.currentLang = lang;
    localStorage.setItem("purunpuan_language", lang);
    document.documentElement.lang = lang;
    
    // Update DOM texts
    this.updateDOM();

    // Notify listeners (e.g. products renderer)
    this.listeners.forEach(cb => cb(lang));
  },

  // Helper to retrieve nested values (e.g., "hero.headline" -> content[lang].hero.headline)
  t(key) {
    try {
      const parts = key.split(".");
      let val = content[this.currentLang];
      for (const p of parts) {
        if (val && val[p] !== undefined) {
          val = val[p];
        } else {
          return "";
        }
      }
      return val || "";
    } catch (e) {
      console.warn(`Translation key not found: ${key}`);
      return "";
    }
  },

  updateDOM() {
    // Update document title and meta description
    document.title = this.t("meta.title");
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", this.t("meta.description"));
    }

    // Update regular elements with data-t
    document.querySelectorAll("[data-t]").forEach(el => {
      const key = el.getAttribute("data-t");
      const translation = this.t(key);
      if (translation) {
        // Use innerHTML for copy that has deliberate formatting like <br> or <em>
        if (el.tagName === "H1" || el.tagName === "P" || el.tagName === "SPAN" || el.tagName === "STRONG" || el.tagName === "EM") {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // Update input placeholders with data-t-placeholder
    document.querySelectorAll("[data-t-placeholder]").forEach(el => {
      const key = el.getAttribute("data-t-placeholder");
      const translation = this.t(key);
      if (translation) {
        el.setAttribute("placeholder", translation);
      }
    });

    // Update language toggle buttons text (shows what language the user will switch to, or active states)
    document.querySelectorAll(".lang-toggle").forEach(btn => {
      const activeText = this.currentLang === "en" ? "EN" : "ID";
      const altText = this.currentLang === "en" ? "ID" : "EN";
      btn.querySelector(".lang-active").textContent = activeText;
      btn.querySelector(".lang-inactive").textContent = altText;
    });
  }
};
