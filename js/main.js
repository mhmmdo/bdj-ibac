/* ==========================================================================
   PURUN PUAN — MAIN INTERACTION LOGIC
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize translation engine
  LanguageManager.init();

  // Initialize features
  initMobileMenu();
  initScrollEffects();
  initProductsGrid();
  initPassportDrawer();
  initInquiryForm();

  // Initialize Shopping Bag & Quiz Recommender
  window.CartManager = CartManager;
  CartManager.init();
  QuizManager.init();

  // Initialize premium extensions
  initWeaveSelector();
  initArtisanCards();

  // Initialize AI Eco-Assistant Chat
  AIManager.init();
});

/* ==========================================================================
   MOBILE MENU
   ========================================================================== */
function initMobileMenu() {
  const burger = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const links = document.querySelectorAll(".nav-links a");

  if (!burger || !navLinks) return;

  const toggleMenu = () => {
    burger.classList.toggle("open");
    navLinks.classList.toggle("open");
  };

  burger.addEventListener("click", toggleMenu);

  links.forEach(link => {
    link.addEventListener("click", () => {
      burger.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });
}

/* ==========================================================================
   SCROLL EFFECTS & TIMELINE
   ========================================================================== */
function initScrollEffects() {
  // 1. Intersection Observer for elements reveal
  const revealElements = document.querySelectorAll(".reveal, .weave-reveal");
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target); // Reveal only once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // 2. Active Section Navigation Highlighter
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  window.addEventListener("scroll", () => {
    let current = "";
    const scrollPosition = window.pageYOffset + 120; // offset header height

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });

  // 3. Journey Progress Line & Step Node Activation
  const journeySection = document.querySelector(".journey-section");
  const progressLine = document.querySelector(".journey-progress-line");
  const journeySteps = document.querySelectorAll(".journey-step");

  if (journeySection && progressLine) {
    window.addEventListener("scroll", () => {
      const sectionRect = journeySection.getBoundingClientRect();
      const sectionHeight = journeySection.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate progress percentage when section passes viewport center
      const triggerStart = sectionRect.top - viewportHeight + 200;
      const triggerEnd = sectionRect.bottom - viewportHeight + 100;
      
      let progress = 0;
      if (sectionRect.top < viewportHeight - 150) {
        const totalDist = sectionHeight - 200;
        const currentDist = (viewportHeight - 150) - sectionRect.top;
        progress = Math.min(100, Math.max(0, (currentDist / totalDist) * 100));
      }

      progressLine.style.height = `${progress}%`;

      // Activate steps based on progress
      journeySteps.forEach((step, idx) => {
        const stepThreshold = (idx / (journeySteps.length - 1)) * 90;
        if (progress >= stepThreshold) {
          step.classList.add("active");
        } else {
          step.classList.remove("active");
        }
      });
    });
  }
}

/* ==========================================================================
   PRODUCTS CATALOG GRID
   ========================================================================== */
let activeCategory = "all";

function initProductsGrid() {
  const categoriesContainer = document.querySelector(".collection-categories");
  const gridContainer = document.querySelector(".product-grid");

  if (!gridContainer || !categoriesContainer) return;

  // Render function that adapts to active language
  const renderGrid = (lang) => {
    gridContainer.innerHTML = "";
    
    // Filter products
    const filtered = products.filter(p => activeCategory === "all" || p.category === activeCategory);

    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card reveal";
      card.setAttribute("data-id", p.id);

      const name = p.name;
      const price = p.price;
      const desc = lang === "en" ? p.description_en : p.description_id;
      const btnText = lang === "en" ? content.en.collection.viewPassport : content.id.collection.viewPassport;
      const buyText = lang === "en" ? content.en.collection.addToBag : content.id.collection.addToBag;

      card.innerHTML = `
        <div class="product-image-container">
          <img src="${p.image}" alt="${name}" loading="lazy">
        </div>
        <div class="product-info">
          <h3 class="product-name">${name}</h3>
          <span class="product-price">${price}</span>
          <p class="product-desc">${desc}</p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto;">
            <button class="btn btn-primary view-passport-btn" aria-haspopup="dialog" aria-controls="passport-drawer">
              ${btnText}
            </button>
            <button class="btn btn-secondary add-to-bag-btn">
              ${buyText}
            </button>
          </div>
        </div>
      `;

      card.querySelector(".add-to-bag-btn").addEventListener("click", () => {
        if (window.CartManager) {
          window.CartManager.addItem(p.id);
        }
      });

      gridContainer.appendChild(card);
    });

    // Rebind drawer open listeners to new buttons
    bindPassportTriggers();

    // Trigger immediate animation recalculation for new cards
    const newCards = gridContainer.querySelectorAll(".reveal");
    const gridObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    }, { threshold: 0.1 });
    newCards.forEach(c => gridObserver.observe(c));
  };

  // Register categories filter click handlers
  categoriesContainer.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      categoriesContainer.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-category");
      renderGrid(LanguageManager.currentLang);
    });
  });

  // Connect to Language Manager to rerender on language change
  LanguageManager.registerListener((lang) => {
    renderGrid(lang);
  });
}

/* ==========================================================================
   CRAFT PASSPORT DRAWER
   ========================================================================== */
function initPassportDrawer() {
  const drawer = document.getElementById("passport-drawer");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.querySelector(".passport-close-btn");

  if (!drawer || !overlay || !closeBtn) return;

  const closeDrawer = () => {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    
    // Restore focus to the trigger element that opened it
    const lastActive = drawer.getAttribute("data-trigger-id");
    if (lastActive) {
      const triggerEl = document.getElementById(lastActive);
      if (triggerEl) triggerEl.focus();
    }
  };

  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  // Close on ESC key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      closeDrawer();
    }
  });

  // Focus trap inside drawer for accessibility
  drawer.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;

    const focusables = drawer.querySelectorAll("button, [tabindex='0']");
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
}

function bindPassportTriggers() {
  const drawer = document.getElementById("passport-drawer");
  const overlay = document.getElementById("overlay");
  
  document.querySelectorAll(".view-passport-btn").forEach((btn, idx) => {
    // Generate unique ID on buttons to trace active focus
    const btnId = `passport-trigger-${idx}`;
    btn.setAttribute("id", btnId);

    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const productId = card.getAttribute("data-id");
      const product = products.find(p => p.id === productId);

      if (product) {
        populatePassport(product, LanguageManager.currentLang);
        
        // Track the opening trigger
        drawer.setAttribute("data-trigger-id", btnId);
        
        // Open drawer
        drawer.classList.add("open");
        overlay.classList.add("open");
        document.body.style.overflow = "hidden"; // lock page scroll
        
        // Move focus inside drawer
        setTimeout(() => {
          drawer.querySelector(".passport-close-btn").focus();
        }, 100);
      }
    });
  });
}

function openPassport(productId) {
  const product = products.find(p => p.id === productId);
  if (product) {
    const drawer = document.getElementById("passport-drawer");
    const overlay = document.getElementById("overlay");
    if (drawer && overlay) {
      populatePassport(product, LanguageManager.currentLang);
      drawer.setAttribute("data-trigger-id", "quiz-view-passport-btn");
      drawer.classList.add("open");
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const closeBtn = drawer.querySelector(".passport-close-btn");
        if (closeBtn) closeBtn.focus();
      }, 100);
    }
  }
}

// Populate the Craft Passport details inside the drawer
function populatePassport(product, lang) {
  const title = document.getElementById("passport-prod-name");
  const price = document.getElementById("passport-prod-price");
  const image = document.getElementById("passport-prod-image");
  const detailGrid = document.getElementById("passport-details-grid");

  if (!title || !price || !image || !detailGrid) return;

  // Set header details
  title.textContent = product.name;
  price.textContent = product.price;
  image.setAttribute("src", product.image);
  image.setAttribute("alt", product.name);

  // Localization variables
  const labels = content[lang].passport;
  const pDetails = product.details;

  // Populate dynamic passport sections
  detailGrid.innerHTML = `
    <div class="passport-section">
      <h4 class="passport-section-title">${labels.material}</h4>
      <div class="passport-section-body">${lang === "en" ? pDetails.material_en : pDetails.material_id}</div>
    </div>
    <div class="passport-section">
      <h4 class="passport-section-title">${labels.origin}</h4>
      <div class="passport-section-body">${lang === "en" ? pDetails.origin_en : pDetails.origin_id}</div>
    </div>
    <div class="passport-section">
      <h4 class="passport-section-title">${labels.maker}</h4>
      <div class="passport-section-body">${lang === "en" ? pDetails.maker_en : pDetails.maker_id}</div>
    </div>
    <div class="passport-section">
      <h4 class="passport-section-title">${labels.process}</h4>
      <div class="passport-section-body">${lang === "en" ? pDetails.process_en : pDetails.process_id}</div>
    </div>
    <div class="passport-section">
      <h4 class="passport-section-title">${labels.care}</h4>
      <div class="passport-section-body">${lang === "en" ? pDetails.care_en : pDetails.care_id}</div>
    </div>
    <div class="passport-section">
      <h4 class="passport-section-title">${labels.impact}</h4>
      <div class="passport-section-body">${lang === "en" ? pDetails.impact_en : pDetails.impact_id}</div>
    </div>
  `;
}

/* ==========================================================================
   PARTNERSHIP INQUIRY FORM SIMULATION
   ========================================================================== */
function initInquiryForm() {
  const form = document.getElementById("inquiry-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("inquiry-name").value.trim();
    const email = document.getElementById("inquiry-email").value.trim();
    const company = document.getElementById("inquiry-company").value.trim();
    const type = document.getElementById("inquiry-type").value;
    const message = document.getElementById("inquiry-message").value.trim();
    const messageBox = document.getElementById("inquiry-form-message");
    const submitBtn = form.querySelector("button[type='submit']");

    const lang = LanguageManager.currentLang;
    const labels = content[lang].inquiry.form;

    // Simple validation
    if (!name || !email || !type || !message) {
      messageBox.textContent = labels.error;
      messageBox.className = "form-message error";
      return;
    }

    // Set submitting loading state
    submitBtn.disabled = true;
    submitBtn.textContent = labels.submitting;

    // Simulate API call
    setTimeout(() => {
      // Success response
      messageBox.textContent = labels.success;
      messageBox.className = "form-message success";
      form.reset();

      submitBtn.disabled = false;
      submitBtn.textContent = labels.submit;

      // Hide message after 5 seconds
      setTimeout(() => {
        messageBox.style.display = "none";
      }, 5000);

    }, 1500);
  });
}

/* ==========================================================================
   SHOPPING BAG & CART STATE MANAGEMENT
   ========================================================================== */
const CartManager = {
  items: [], // Array of { productId, quantity }

  init() {
    // Load from localStorage
    const stored = localStorage.getItem("purunpuan_cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.items = parsed;
        } else {
          this.items = [];
        }
      } catch (e) {
        this.items = [];
      }
    }
    this.updateBadge();
    this.bindEvents();
  },

  bindEvents() {
    const toggleBtn = document.getElementById("cart-toggle-btn");
    const closeBtn = document.getElementById("cart-close-btn");
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("overlay");
    const checkoutBtn = document.getElementById("checkout-btn");

    if (toggleBtn && drawer && overlay) {
      toggleBtn.addEventListener("click", () => {
        this.renderDrawerList();
        drawer.classList.add("open");
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
        if (closeBtn) closeBtn.focus();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        drawer.classList.remove("open");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        if (this.items.length === 0) return;
        this.checkoutViaWhatsApp();
      });
    }

    // Close drawer on overlay click
    overlay.addEventListener("click", () => {
      if (drawer.classList.contains("open")) {
        drawer.classList.remove("open");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      }
    });

    // Close on ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (drawer.classList.contains("open")) {
          drawer.classList.remove("open");
          overlay.classList.remove("open");
          document.body.style.overflow = "";
        }
      }
    });
  },

  addItem(productId) {
    const existing = this.items.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ productId, quantity: 1 });
    }
    this.save();
    this.updateBadge();
    
    // Auto-open drawer when adding an item to show interactive feedback
    const toggleBtn = document.getElementById("cart-toggle-btn");
    if (toggleBtn) toggleBtn.click();
  },

  updateQty(productId, delta) {
    const item = this.items.find(i => i.productId === productId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.items = this.items.filter(i => i.productId !== productId);
      }
      this.save();
      this.updateBadge();
      this.renderDrawerList();
    }
  },

  removeItem(productId) {
    this.items = this.items.filter(i => i.productId !== productId);
    this.save();
    this.updateBadge();
    this.renderDrawerList();
  },

  clearCart() {
    this.items = [];
    this.save();
    this.updateBadge();
  },

  save() {
    localStorage.setItem("purunpuan_cart", JSON.stringify(this.items));
  },

  updateBadge() {
    const badge = document.getElementById("cart-count-badge");
    if (!badge) return;
    const totalCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalCount;
  },

  renderDrawerList() {
    const listContainer = document.getElementById("cart-items-list");
    const subtotalContainer = document.getElementById("cart-subtotal-price");
    
    if (!listContainer || !subtotalContainer) return;

    listContainer.innerHTML = "";
    
    const lang = LanguageManager.currentLang;
    
    if (this.items.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; color: var(--color-graphite); margin-top: 40px; font-family: var(--font-roboto);">
          <p>${content[lang].cart.empty}</p>
        </div>
      `;
      subtotalContainer.textContent = lang === "en" ? "$0.00 USD" : "IDR 0";
      const impactBadge = document.getElementById("cart-impact-badge");
      if (impactBadge) impactBadge.style.display = "none";
      return;
    }

    let subtotalIDR = 0;
    let subtotalUSD = 0;

    this.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      // Extract prices: product.price is like "IDR 580,000 / $39.00"
      const idrMatch = product.price.match(/IDR\s*([\d,]+)/);
      const usdMatch = product.price.match(/\$\s*([\d.]+)/);

      const priceIDR = idrMatch ? parseInt(idrMatch[1].replace(/,/g, "")) : 0;
      const priceUSD = usdMatch ? parseFloat(usdMatch[1]) : 0;

      subtotalIDR += priceIDR * item.quantity;
      subtotalUSD += priceUSD * item.quantity;

      const itemRow = document.createElement("div");
      itemRow.className = "cart-item-row";
      
      const formattedItemPrice = lang === "en" ? `$${priceUSD.toFixed(2)} USD` : `IDR ${priceIDR.toLocaleString()}`;

      itemRow.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${product.name}</h4>
          <div class="cart-item-price">${formattedItemPrice}</div>
          <button class="remove-item-btn" onclick="window.CartManager.removeItem('${product.id}')">
            ${lang === "en" ? "Remove" : "Hapus"}
          </button>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="window.CartManager.updateQty('${product.id}', -1)">-</button>
          <span style="font-family: var(--font-houseplant); font-weight: 600;">${item.quantity}</span>
          <button class="qty-btn" onclick="window.CartManager.updateQty('${product.id}', 1)">+</button>
        </div>
      `;

      listContainer.appendChild(itemRow);
    });

    if (lang === "en") {
      subtotalContainer.textContent = `$${subtotalUSD.toFixed(2)} USD`;
    } else {
      subtotalContainer.textContent = `IDR ${subtotalIDR.toLocaleString()}`;
    }

    // Dynamic Carbon & Peatland Impact calculations
    const impactBadge = document.getElementById("cart-impact-badge");
    if (impactBadge) {
      const totalCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalCount > 0) {
        impactBadge.style.display = "block";
        const area = (totalCount * 1.5).toFixed(1);
        const carbon = (totalCount * 0.8).toFixed(1);
        let summaryText = content[lang].cart.impactSummary;
        summaryText = summaryText.replace("{area}", area).replace("{carbon}", carbon);
        impactBadge.innerHTML = summaryText;
      } else {
        impactBadge.style.display = "none";
      }
    }
  },

  checkoutViaWhatsApp() {
    const lang = LanguageManager.currentLang;
    const phone = "6282159619636";
    let text = "";

    if (lang === "en") {
      text += "Hello Purun Puan, I would like to place an order:\n\n";
    } else {
      text += "Halo Purun Puan, saya ingin memesan produk berikut:\n\n";
    }

    let totalIDR = 0;
    let totalUSD = 0;

    this.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      const idrMatch = product.price.match(/IDR\s*([\d,]+)/);
      const usdMatch = product.price.match(/\$\s*([\d.]+)/);

      const priceIDR = idrMatch ? parseInt(idrMatch[1].replace(/,/g, "")) : 0;
      const priceUSD = usdMatch ? parseFloat(usdMatch[1]) : 0;

      const itemTotalIDR = priceIDR * item.quantity;
      const itemTotalUSD = priceUSD * item.quantity;

      totalIDR += itemTotalIDR;
      totalUSD += itemTotalUSD;

      if (lang === "en") {
        text += `- ${item.quantity} x ${product.name} ($${priceUSD.toFixed(2)} USD each)\n`;
      } else {
        text += `- ${item.quantity} x ${product.name} (IDR ${priceIDR.toLocaleString()} per buah)\n`;
      }
    });

    text += "\n";
    if (lang === "en") {
      text += `Total Subtotal: $${totalUSD.toFixed(2)} USD\n\n`;
      text += "Please let me know the payment details and shipping costs. Thank you!";
    } else {
      text += `Total Subtotal: IDR ${totalIDR.toLocaleString()}\n\n`;
      text += "Mohon info detail pembayaran serta perkiraan ongkos kirim. Terima kasih!";
    }

    const url = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
    window.open(url, "_blank", "noopener");

    // Clear cart after redirect
    this.clearCart();
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("overlay");
    if (drawer) drawer.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
};

/* ==========================================================================
   STYLE RECOMMENDER QUIZ (FIND YOUR MATCH)
   ========================================================================== */
const QuizManager = {
  currentQuestion: 0,
  answers: [],
  scores: {},

  questions: [
    {
      key: "q1",
      titleKey: "quiz.q1Title",
      options: [
        { key: "A", textKey: "quiz.q1OptionA", scores: { "savara-bag": 2, "palam-tote": 2, "rawa-backpack": 3 } },
        { key: "B", textKey: "quiz.q1OptionB", scores: { "sasirangan-clutch": 3 } },
        { key: "C", textKey: "quiz.q1OptionC", scores: { "kencana-purse": 2, "sundance-hat": 3 } }
      ]
    },
    {
      key: "q2",
      titleKey: "quiz.q2Title",
      options: [
        { key: "A", textKey: "quiz.q2OptionA", scores: { "rawa-backpack": 2, "palam-tote": 1, "savara-bag": 1 } },
        { key: "B", textKey: "quiz.q2OptionB", scores: { "sasirangan-clutch": 2, "kencana-purse": 1 } },
        { key: "C", textKey: "quiz.q2OptionC", scores: { "sundance-hat": 2, "kencana-purse": 1, "savara-bag": 1 } }
      ]
    },
    {
      key: "q3",
      titleKey: "quiz.q3Title",
      options: [
        { key: "A", textKey: "quiz.q3OptionA", scores: { "savara-bag": 1, "palam-tote": 1, "rawa-backpack": 1 } },
        { key: "B", textKey: "quiz.q3OptionB", scores: { "sasirangan-clutch": 2 } },
        { key: "C", textKey: "quiz.q3OptionC", scores: { "kencana-purse": 2, "sundance-hat": 1 } }
      ]
    }
  ],

  init() {
    const startBtn = document.getElementById("quiz-start-btn");
    const restartBtn = document.getElementById("quiz-restart-btn");
    const addBtn = document.getElementById("quiz-add-to-cart-btn");
    const passportBtn = document.getElementById("quiz-view-passport-btn");

    if (startBtn) {
      startBtn.addEventListener("click", () => this.startQuiz());
    }
    if (restartBtn) {
      restartBtn.addEventListener("click", () => this.startQuiz());
    }
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const prodId = addBtn.getAttribute("data-product-id");
        if (prodId && window.CartManager) {
          window.CartManager.addItem(prodId);
        }
      });
    }
    if (passportBtn) {
      passportBtn.addEventListener("click", () => {
        const prodId = passportBtn.getAttribute("data-product-id");
        if (prodId) {
          openPassport(prodId);
        }
      });
    }

    // Rerender quiz texts if language switches
    LanguageManager.registerListener(() => {
      if (this.currentQuestion > 0 && this.currentQuestion <= this.questions.length) {
        this.renderQuestion();
      } else if (this.currentQuestion > this.questions.length) {
        this.showResult();
      }
    });
  },

  startQuiz() {
    this.currentQuestion = 1;
    this.answers = [];
    this.scores = {};
    products.forEach(p => {
      this.scores[p.id] = 0;
    });

    document.getElementById("quiz-start-screen").style.display = "none";
    document.getElementById("quiz-result-screen").style.display = "none";
    document.getElementById("quiz-question-screen").style.display = "block";

    this.renderQuestion();
  },

  renderQuestion() {
    const qIndex = this.currentQuestion - 1;
    const qData = this.questions[qIndex];
    if (!qData) return;

    const titleEl = document.getElementById("quiz-question-title");
    const listEl = document.getElementById("quiz-options-list");
    const cardEl = document.getElementById("quiz-card-container");

    if (titleEl && listEl) {
      // Add animation class
      cardEl.classList.remove("quiz-fade");
      void cardEl.offsetWidth; // Trigger reflow
      cardEl.classList.add("quiz-fade");

      titleEl.textContent = LanguageManager.t(qData.titleKey);
      listEl.innerHTML = "";

      qData.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "quiz-option-btn";
        btn.textContent = LanguageManager.t(opt.textKey);
        btn.addEventListener("click", () => this.handleAnswer(opt.scores));
        listEl.appendChild(btn);
      });
    }
  },

  handleAnswer(optScores) {
    // Add up scores
    for (const prodId in optScores) {
      if (this.scores[prodId] !== undefined) {
        this.scores[prodId] += optScores[prodId];
      }
    }

    this.currentQuestion++;
    if (this.currentQuestion <= this.questions.length) {
      this.renderQuestion();
    } else {
      this.showResult();
    }
  },

  showResult() {
    document.getElementById("quiz-question-screen").style.display = "none";
    document.getElementById("quiz-result-screen").style.display = "block";

    const cardEl = document.getElementById("quiz-card-container");
    cardEl.classList.remove("quiz-fade");
    void cardEl.offsetWidth; // Trigger reflow
    cardEl.classList.add("quiz-fade");

    // Find product with highest score
    let bestProduct = products[0];
    let maxScore = -1;

    for (const prodId in this.scores) {
      if (this.scores[prodId] > maxScore) {
        maxScore = this.scores[prodId];
        bestProduct = products.find(p => p.id === prodId);
      }
    }

    if (!bestProduct) bestProduct = products[0];

    const nameEl = document.getElementById("quiz-result-name");
    const imgEl = document.getElementById("quiz-result-img");
    const priceEl = document.getElementById("quiz-result-price");
    const descEl = document.getElementById("quiz-result-desc");
    const addBtn = document.getElementById("quiz-add-to-cart-btn");
    const passportBtn = document.getElementById("quiz-view-passport-btn");

    const lang = LanguageManager.currentLang;

    if (nameEl) nameEl.textContent = bestProduct.name;
    if (imgEl) {
      imgEl.src = bestProduct.image;
      imgEl.alt = bestProduct.name;
    }
    if (priceEl) priceEl.textContent = bestProduct.price;
    if (descEl) descEl.textContent = lang === "en" ? bestProduct.description_en : bestProduct.description_id;

    if (addBtn) addBtn.setAttribute("data-product-id", bestProduct.id);
    if (passportBtn) passportBtn.setAttribute("data-product-id", bestProduct.id);
  }
};

/* ==========================================================================
   INTERACTIVE WEAVE TEXTURE SELECTOR
   ========================================================================== */
function initWeaveSelector() {
  const rawBtn = document.getElementById("weave-btn-raw");
  const fineBtn = document.getElementById("weave-btn-fine");
  const sasiBtn = document.getElementById("weave-btn-sasirangan");
  const imgEl = document.getElementById("weave-texture-img");
  const titleEl = document.getElementById("weave-texture-title");
  const descEl = document.getElementById("weave-texture-desc");

  if (!rawBtn || !fineBtn || !sasiBtn || !imgEl || !titleEl || !descEl) return;

  const textures = {
    raw: {
      img: "assets/images/palam_tote.png",
      titleKey: "weaveSelector.rawTitle",
      descKey: "weaveSelector.rawDesc"
    },
    fine: {
      img: "assets/images/kencana_purse.png",
      titleKey: "weaveSelector.fineTitle",
      descKey: "weaveSelector.fineDesc"
    },
    sasirangan: {
      img: "assets/images/sasirangan_clutch.png",
      titleKey: "weaveSelector.sasiranganTitle",
      descKey: "weaveSelector.sasiranganDesc"
    }
  };

  let activeWeave = "raw";

  function updateDisplay(type) {
    activeWeave = type;
    const data = textures[type];
    imgEl.classList.add("quiz-fade");
    imgEl.src = data.img;
    
    // Trigger reflow
    void imgEl.offsetWidth;
    imgEl.classList.remove("quiz-fade");
    imgEl.classList.add("quiz-fade");

    const lang = LanguageManager.currentLang;
    titleEl.textContent = LanguageManager.t(data.titleKey);
    descEl.textContent = LanguageManager.t(data.descKey);

    // Toggle active classes on buttons
    [rawBtn, fineBtn, sasiBtn].forEach(btn => {
      if (btn.getAttribute("data-weave") === type) {
        btn.classList.add("active-selector");
        btn.style.borderLeftColor = "var(--color-walnut)";
      } else {
        btn.classList.remove("active-selector");
        btn.style.borderLeftColor = "transparent";
      }
    });
  }

  rawBtn.addEventListener("click", () => updateDisplay("raw"));
  fineBtn.addEventListener("click", () => updateDisplay("fine"));
  sasiBtn.addEventListener("click", () => updateDisplay("sasirangan"));

  // Register language switch update
  LanguageManager.registerListener(() => {
    updateDisplay(activeWeave);
  });
}

/* ==========================================================================
   ARTISAN CARD HOVER SOUNDS / TRANSITIONS
   ========================================================================== */
function initArtisanCards() {
  const cards = document.querySelectorAll(".artisan-card");
  cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
  });
}

/* ==========================================================================
   AI ECO-ASSISTANT CHAT ENGINE
   ========================================================================== */
const AIManager = {
  chatHistory: [],
  apiRoute: "./api-proxy.php",
  isInitialized: false,

  init() {
    const toggleBtn = document.getElementById("ai-toggle-btn");
    const closeBtn = document.getElementById("ai-close-btn");
    const sendBtn = document.getElementById("ai-send-btn");
    const chatBox = document.getElementById("ai-chat-box");
    const inputField = document.getElementById("ai-chat-input-field");

    if (!toggleBtn || !chatBox || !closeBtn || !sendBtn || !inputField) return;

    toggleBtn.addEventListener("click", () => {
      const isVisible = chatBox.style.display === "flex";
      chatBox.style.display = isVisible ? "none" : "flex";
      
      if (!isVisible && !this.isInitialized) {
        this.loadWelcomeMessage();
        this.isInitialized = true;
      }
    });

    closeBtn.addEventListener("click", () => {
      chatBox.style.display = "none";
    });

    sendBtn.addEventListener("click", () => this.handleSendMessage());
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleSendMessage();
      }
    });

    // Re-render chips and welcome on language change
    LanguageManager.registerListener(() => {
      if (this.isInitialized) {
        this.renderChips();
      }
    });
  },

  loadWelcomeMessage() {
    const listEl = document.getElementById("ai-messages-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    const lang = LanguageManager.currentLang;
    const welcomeText = content[lang].ai.welcome;

    this.addMessageToDOM("bot", welcomeText);
    this.renderChips();
  },

  renderChips() {
    const chipsEl = document.getElementById("ai-chips-list");
    if (!chipsEl) return;
    chipsEl.innerHTML = "";

    const lang = LanguageManager.currentLang;
    const prompts = [
      { text: content[lang].ai.promptStyle, query: lang === "en" ? "Recommend a bag for travel" : "Rekomendasi tas untuk bepergian" },
      { text: content[lang].ai.promptCarbon, query: lang === "en" ? "Explain carbon impact of bags" : "Jelaskan dampak lingkungan dari tas" },
      { text: content[lang].ai.promptMakers, query: lang === "en" ? "Who are the weavers?" : "Siapa saja perajinnya?" },
      { text: content[lang].ai.promptContact, query: "WhatsApp" }
    ];

    prompts.forEach(p => {
      const chip = document.createElement("button");
      chip.className = "ai-prompt-chip";
      chip.textContent = p.text;
      chip.addEventListener("click", () => {
        if (p.query === "WhatsApp") {
          window.open("https://api.whatsapp.com/send/?phone=6282159619636&text=Halo%20Purun%20Puan,%20saya%20tertarik%20untuk%20berkonsultasi.&type=phone_number&app_absent=0", "_blank", "noopener");
        } else {
          this.sendMessage(p.query);
        }
      });
      chipsEl.appendChild(chip);
    });
  },

  async handleSendMessage() {
    const inputField = document.getElementById("ai-chat-input-field");
    if (!inputField) return;
    const text = inputField.value.trim();
    if (!text) return;
    
    inputField.value = "";
    this.sendMessage(text);
  },

  async sendMessage(userMessage) {
    this.addMessageToDOM("user", userMessage);
    this.showTypingIndicator(true);

    const lang = LanguageManager.currentLang;
    
    // Prepare thread
    this.chatHistory.push({ role: "user", content: userMessage });

    const systemPrompt = `You are Puan Eco-Assistant, the official AI Brand Storyteller and Eco-Curator for Purun Puan. 
    Purun Puan is a premium sustainable fashion brand from South Kalimantan, Indonesia, using wild purun grass to weave contemporary bags and protect wet peatland swamps.
    Artisans are rural women ('Puan') organized into circles, led by Ibu Salamah (Palam Circle Leader), Ibu Hamdanah (Sasirangan Specialist), and Ibu Halimah (Fine diagonal expert).
    Our catalog:
    - savara-bag (Savara Woven Tote, IDR 580,000 / $39.00)
    - sasirangan-clutch (Sasirangan Weave Clutch, IDR 350,000 / $24.00)
    - palam-tote (Palam Classic Tote, IDR 420,000 / $29.00)
    - kencana-purse (Kencana Shell Purse, IDR 280,000 / $19.00)
    - rawa-backpack (Rawa Utility Backpack, IDR 680,000 / $46.00)
    - sundance-hat (Sundance Wide-Brim Hat, IDR 220,000 / $15.00)
    
    Rules:
    1. Always respond in the active language of the user: ${lang === 'id' ? 'Indonesian' : 'English'}.
    2. Keep responses brief, storytelling-focused, and highly professional (maximum 2 short paragraphs).
    3. When recommending a product, output the exact product ID enclosed in double square brackets like [[savara-bag]], [[sasirangan-clutch]], [[palam-tote]], [[kencana-purse]], [[rawa-backpack]], [[sundance-hat]] so the app can render the card inline. Avoid using brackets for other terms.
    4. Do not make up facts. Focus on conservation and empowering local women weavers.
    5. STRICT SCOPE CONSTRAINT: You must ONLY answer questions directly related to Purun Puan, our products, our weavers, Kalimantan peatlands, and eco-sustainability. If the user asks about anything else (e.g. general knowledge, math, programming, cooking, other brands), you must politely decline to answer and redirect them back to Purun Puan's heritage and products. Keep it friendly but firm.`;

    const messagesToSend = [
      { role: "system", content: systemPrompt },
      ...this.chatHistory
    ];

    try {
      const response = await fetch(this.apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mjl",
          messages: messagesToSend,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("API Error Response (HTTP " + response.status + "):", errBody);
        throw new Error("API call failed with status " + response.status);
      }

      // Read as text first to handle SSE/streaming format or extra characters
      const rawText = await response.text();
      console.log("Raw API response:", rawText.substring(0, 300));

      let data;
      try {
        // First attempt: direct parse (works if response is clean JSON)
        data = JSON.parse(rawText.trim());
      } catch (parseErr) {
        // Fallback: strip everything after the last closing brace
        // This handles SSE suffix like "\n\ndata: [DONE]" after the JSON object
        const lastBrace = rawText.lastIndexOf('}');
        if (lastBrace !== -1) {
          data = JSON.parse(rawText.substring(0, lastBrace + 1));
        } else {
          throw new Error("Cannot extract JSON from API response: " + rawText.substring(0, 200));
        }
      }
      const botResponse = data.choices[0].message.content;
      
      this.showTypingIndicator(false);
      this.addMessageToDOM("bot", botResponse);
      this.chatHistory.push({ role: "assistant", content: botResponse });

    } catch (e) {
      console.warn("AI API Error, falling back to local NLP matcher:", e);
      // Run local NLP matcher fallback
      setTimeout(() => {
        this.showTypingIndicator(false);
        const fallbackText = this.getLocalFallback(userMessage);
        this.addMessageToDOM("bot", fallbackText);
        this.chatHistory.push({ role: "assistant", content: fallbackText });
      }, 1000);
    }
  },

  getLocalFallback(msg) {
    const text = msg.toLowerCase();
    const lang = LanguageManager.currentLang;

    if (lang === "en") {
      if (text.includes("style") || text.includes("recommend") || text.includes("bag") || text.includes("travel")) {
        return "For active travel and daily utility, I recommend the **Rawa Utility Backpack** [[rawa-backpack]]. If you are looking for formal elegance, the **Sasirangan Weave Clutch** [[sasirangan-clutch]] featuring hand-dyed lining is perfect!";
      }
      if (text.includes("carbon") || text.includes("peatland") || text.includes("eco") || text.includes("impact")) {
        return "Every Purun Puan bag bought helps protect Kalimantan's peatlands. Healthy peatlands store 10x more carbon than forests. By keeping them wet, we prevent carbon emissions! On average, one bag preserves 1.5 m² of peatland and offsets 0.8 kg of CO₂.";
      }
      if (text.includes("maker") || text.includes("artisan") || text.includes("weav") || text.includes("who")) {
        return "Our bags are hand-woven by the Puan (women weavers) of South Kalimantan, led by Ibu Salamah, Ibu Hamdanah, and Ibu Halimah. They earn fair wages and keep their cultural weaving legacy alive.";
      }
      return "I can assist you with product recommendations, carbon conservation data, or artisan profiles. Try asking: 'Which bag is best for travel?' or 'Tell me about the makers'.";
    } else {
      if (text.includes("gaya") || text.includes("rekomendasi") || text.includes("tas") || text.includes("bepergian") || text.includes("travel")) {
        return "Untuk perjalanan aktif dan kebutuhan harian, saya merekomendasikan **Rawa Utility Backpack** [[rawa-backpack]]. Jika Anda mencari keanggunan formal, **Sasirangan Weave Clutch** [[sasirangan-clutch]] dengan lapisan Sasirangan buatan tangan sangat cocok!";
      }
      if (text.includes("karbon") || text.includes("gambut") || text.includes("lingkungan") || text.includes("dampak")) {
        return "Setiap tas Purun Puan yang dibeli membantu melindungi lahan gambut Kalimantan. Lahan gambut sehat menyimpan 10x lebih banyak karbon dibanding hutan biasa. Rata-rata satu tas melestarikan 1.5 m² lahan gambut dan mencegah pelepasan 0.8 kg CO₂.";
      }
      if (text.includes("perajin") || text.includes("pembuat") || text.includes("anyam") || text.includes("siapa")) {
        return "Tas kami dianyam langsung oleh para perajin perempuan (*Puan*) di Kalimantan Selatan, yang dipimpin oleh Ibu Salamah, Ibu Hamdanah, dan Ibu Halimah. Mereka menerima upah adil dan melestarikan warisan leluhur.";
      }
      return "Saya dapat membantu Anda memberikan rekomendasi produk, data pelestarian karbon, atau cerita perajin. Cobalah bertanya: 'Tas apa yang cocok untuk bepergian?' atau 'Ceritakan tentang perajin'.";
    }
  },

  showTypingIndicator(show) {
    const listEl = document.getElementById("ai-messages-list");
    if (!listEl) return;

    const existing = document.getElementById("ai-typing-indicator-node");
    if (existing) existing.remove();

    if (show) {
      const indicator = document.createElement("div");
      indicator.className = "typing-indicator";
      indicator.id = "ai-typing-indicator-node";
      indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      listEl.appendChild(indicator);
      listEl.scrollTop = listEl.scrollHeight;
    }
  },

  addMessageToDOM(sender, text) {
    const listEl = document.getElementById("ai-messages-list");
    if (!listEl) return;

    const msgNode = document.createElement("div");
    msgNode.className = `ai-message ${sender}`;
    
    // Parse formatting (bold markdown to HTML <strong>)
    let parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Parse [[product-id]] inline recommendations
    const productRegex = /\[\[([a-zA-Z0-9\-]+)\]\]/g;
    let match;
    let productsToRender = [];

    while ((match = productRegex.exec(parsedText)) !== null) {
      const prodId = match[1];
      const product = products.find(p => p.id === prodId);
      if (product) {
        productsToRender.push(product);
      }
    }

    // Strip brackets out of the text
    parsedText = parsedText.replace(productRegex, "");

    // Set message text
    msgNode.innerHTML = parsedText;

    // Render inline product cards if found
    productsToRender.forEach(p => {
      const lang = LanguageManager.currentLang;
      const card = document.createElement("div");
      card.className = "ai-product-card-inline";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <div style="flex: 1;">
          <h5>${p.name}</h5>
          <span>${p.price}</span>
          <button class="btn btn-primary" style="padding: 6px 12px; font-size: 11px;" onclick="window.CartManager.addItem('${p.id}')">
            ${lang === "en" ? "Add to Bag" : "Masukkan Keranjang"}
          </button>
        </div>
      `;
      msgNode.appendChild(card);
    });

    listEl.appendChild(msgNode);
    listEl.scrollTop = listEl.scrollHeight;
  }
};
