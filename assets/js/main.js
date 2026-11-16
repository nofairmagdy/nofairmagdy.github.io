/* Site behaviour: navigation, scroll spy, project detail sheets, email copy.
   No dependencies. The hero demo lives in rectifier.js. */
(() => {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  document.documentElement.classList.add("js");
  $("#year").textContent = new Date().getFullYear();

  /* ---- Header: border once the page has scrolled ---- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile navigation ---- */
  const navToggle = $("#navToggle");
  const nav = $("#siteNav");
  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  };
  navToggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); navToggle.focus(); }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !e.target.closest(".site-header")) setNav(false);
  });

  /* ---- Scroll spy: mark the section in view in the navigation ---- */
  const navLinks = $$('.site-nav a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- Diagrams: draw the connecting lines once, when first seen ---- */
  const figures = $$(".project-figure");
  figures.forEach((fig) => {
    $$(".dg-wire path, .plot-trk", fig).forEach((path) => {
      path.style.setProperty("--len", Math.ceil(path.getTotalLength()) + 2);
    });
  });
  if ("IntersectionObserver" in window) {
    const seen = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-seen"); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.35 });
    figures.forEach((f) => seen.observe(f));
  } else {
    figures.forEach((f) => f.classList.add("is-seen"));
  }

  /* ---- Project detail sheets (<dialog>) ---- */
  let lastTrigger = null;
  const openSheet = (id, trigger) => {
    const sheet = document.getElementById(id);
    if (!sheet || typeof sheet.showModal !== "function" || sheet.open) return;
    lastTrigger = trigger || null;
    sheet.showModal();
    document.body.classList.add("sheet-open");
    $(".sheet-body", sheet).scrollTop = 0;
    history.replaceState(null, "", `#${id}`);
  };
  $$("[data-sheet]").forEach((btn) => btn.addEventListener("click", () => openSheet(btn.dataset.sheet, btn)));
  $$("dialog.sheet").forEach((sheet) => {
    $("[data-close]", sheet).addEventListener("click", () => sheet.close());
    sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener("close", () => {
      document.body.classList.remove("sheet-open");
      history.replaceState(null, "", "#projects");
      if (lastTrigger) lastTrigger.focus();
    });
  });
  // A link such as …/#sheet-wpod opens that project directly.
  const openFromHash = () => {
    const id = location.hash.slice(1);
    if (id.startsWith("sheet-") && document.getElementById(id)) {
      $("#projects").scrollIntoView();
      openSheet(id, $(`[data-sheet="${id}"]`));
    }
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* ---- Copy email address ---- */
  const copyBtn = $("#copyEmail");
  const copyLabel = $("#copyEmailLabel");
  const toast = $("#toast");
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };
  copyBtn.addEventListener("click", async () => {
    const email = copyBtn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      copyLabel.textContent = "Email address copied";
      showToast("Email address copied");
      setTimeout(() => { copyLabel.textContent = "Copy email address"; }, 2600);
    } catch {
      showToast(email);
    }
  });
})();
