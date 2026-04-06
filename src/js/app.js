/* ═══════════════════════════════════════════════════════════
   ERNIE REPORTS — App Shell

   Client-side routing, scroll animations, league toggle.
   No framework — just vanilla JS for a static site.
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initScrollAnimations();
  initLeagueToggle();
});


/* ── ROUTING ──────────────────────────────────────────────
   Hash-based routing: #home, #managers, #matchups, etc.
   Each section is a <div id="page-{name}"> that gets
   shown/hidden. Simple, no build step needed.             */

function initRouter() {
  const navLinks = document.querySelectorAll('.masthead-nav a[data-page]');

  function navigate(pageName) {
    // Hide all pages
    document.querySelectorAll('[id^="page-"]').forEach(el => {
      el.style.display = 'none';
    });

    // Show target
    const target = document.getElementById('page-' + pageName);
    if (target) {
      target.style.display = 'block';
    }

    // Update nav
    navLinks.forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`.masthead-nav a[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Re-trigger scroll animations for newly visible content
    setTimeout(triggerVisibleAnimations, 50);
  }

  // Click handlers
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const page = a.dataset.page;
      window.location.hash = page;
      navigate(page);
    });
  });

  // Handle initial hash or default to home
  function onHashChange() {
    const hash = window.location.hash.slice(1) || 'home';
    navigate(hash);
  }

  window.addEventListener('hashchange', onHashChange);
  onHashChange();
}


/* ── SCROLL ANIMATIONS ────────────────────────────────────
   IntersectionObserver triggers .visible on elements
   with .animate-in or .stagger classes when they scroll
   into view.                                              */

let observer;

function initScrollAnimations() {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  });

  observeAll();
}

function observeAll() {
  document.querySelectorAll('.animate-in, .stagger').forEach(el => {
    observer.observe(el);
  });
}

function triggerVisibleAnimations() {
  document.querySelectorAll('.animate-in, .stagger').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    }
  });
}


/* ── LEAGUE TOGGLE ────────────────────────────────────────
   Switches between LPT and Statesman data views.
   For now, just toggles the visual state. Data loading
   will come when we wire up JSON exports.                 */

function initLeagueToggle() {
  document.querySelectorAll('.league-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.league-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      // Future: reload data for the selected league
    });
  });
}
