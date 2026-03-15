/* ============================================
   Modern Operator Movement — Main JS
   ============================================ */

(function () {
  'use strict';

  // --- Theme Toggle ---
  var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    // Update theme-color meta
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = theme === 'dark' ? '#0F0D0B' : '#FAF7F4';
    }

    // Update all toggle icons
    var sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    var moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    var toggles = document.querySelectorAll('[data-theme-toggle], [data-theme-toggle-mobile]');
    toggles.forEach(function (btn) {
      btn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
      btn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    });
  }

  // Attach toggle listeners
  document.querySelectorAll('[data-theme-toggle], [data-theme-toggle-mobile]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  });

  // Set initial icon state
  setTheme(currentTheme);


  // --- Navbar scroll behavior ---
  var navbar = document.querySelector('.navbar');
  var scrollThreshold = 50;

  function handleNavScroll() {
    if (window.scrollY > scrollThreshold) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();


  // --- Mobile Menu ---
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');

  function toggleMobileMenu() {
    var isOpen = mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }

  hamburger.addEventListener('click', toggleMobileMenu);

  // Close mobile menu on link tap
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (mobileMenu.classList.contains('open')) {
        toggleMobileMenu();
      }
    });
  });

  // Close on escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMobileMenu();
    }
  });


  // --- Smooth Scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // --- Scroll Reveal (IntersectionObserver) ---
  var reveals = document.querySelectorAll('.reveal');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(function (el) {
    observer.observe(el);
  });


  // --- Recommended Services ---
  var servicesGrid = document.getElementById('services-grid');
  var filtersContainer = document.getElementById('services-filters');
  var searchInput = document.getElementById('services-search');
  var emptyMsg = document.getElementById('services-empty');

  if (servicesGrid) {
    initServices();
  }

  function initServices() {
    fetch('./data/services.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var services = data.services || [];
        if (!services.length) return;

        // Sort: featured first, then alphabetical
        services.sort(function (a, b) {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        });

        // Build category list
        var categories = [];
        services.forEach(function (s) {
          if (s.category && categories.indexOf(s.category) === -1) {
            categories.push(s.category);
          }
        });
        categories.sort();

        // Render filter pills
        var allBtn = document.createElement('button');
        allBtn.className = 'filter-pill active';
        allBtn.textContent = 'All';
        allBtn.setAttribute('role', 'tab');
        allBtn.setAttribute('aria-selected', 'true');
        allBtn.dataset.category = '';
        filtersContainer.appendChild(allBtn);

        categories.forEach(function (cat) {
          var btn = document.createElement('button');
          btn.className = 'filter-pill';
          btn.textContent = cat;
          btn.setAttribute('role', 'tab');
          btn.setAttribute('aria-selected', 'false');
          btn.dataset.category = cat;
          filtersContainer.appendChild(btn);
        });

        // Render all cards
        renderCards(services);

        // State
        var activeCategory = '';
        var searchTerm = '';

        // Filter click handler
        filtersContainer.addEventListener('click', function (e) {
          var pill = e.target.closest('.filter-pill');
          if (!pill) return;

          filtersContainer.querySelectorAll('.filter-pill').forEach(function (p) {
            p.classList.remove('active');
            p.setAttribute('aria-selected', 'false');
          });
          pill.classList.add('active');
          pill.setAttribute('aria-selected', 'true');
          activeCategory = pill.dataset.category;
          applyFilters(services, activeCategory, searchTerm);
        });

        // Search handler (debounced)
        var debounceTimer;
        searchInput.addEventListener('input', function () {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function () {
            searchTerm = searchInput.value.trim().toLowerCase();
            applyFilters(services, activeCategory, searchTerm);
          }, 200);
        });
      })
      .catch(function (err) {
        console.warn('Could not load services:', err);
      });
  }

  function renderCards(list) {
    servicesGrid.innerHTML = '';
    list.forEach(function (service) {
      servicesGrid.appendChild(createCard(service));
    });
    // Re-trigger stagger animation
    servicesGrid.offsetHeight; // force reflow
  }

  function createCard(s) {
    var card = document.createElement('article');
    card.className = 'service-card' + (s.featured ? ' featured' : '');

    var headerHTML = '<div class="service-card-header">';
    headerHTML += '<h3>';
    if (s.url) {
      headerHTML += '<a href="' + escapeHTML(s.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(s.name) + '</a>';
    } else {
      headerHTML += escapeHTML(s.name);
    }
    headerHTML += '</h3>';
    if (s.featured) {
      headerHTML += '<span class="service-badge">Featured</span>';
    }
    headerHTML += '</div>';

    var descHTML = '<p class="service-desc">' + escapeHTML(s.description) + '</p>';

    var metaHTML = '<div class="service-card-meta">';

    // Tags
    if (s.tags && s.tags.length) {
      s.tags.forEach(function (tag) {
        metaHTML += '<span class="service-tag">' + escapeHTML(tag) + '</span>';
      });
    }
    metaHTML += '</div>';

    // Recommender
    var recHTML = '';
    if (s.recommended_by) {
      recHTML = '<p class="service-recommender">Recommended by ' + escapeHTML(s.recommended_by) + '</p>';
    }

    // Visit link
    var linkHTML = '';
    if (s.url) {
      linkHTML = '<a class="service-link" href="' + escapeHTML(s.url) + '" target="_blank" rel="noopener noreferrer">';
      linkHTML += 'Visit';
      linkHTML += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>';
      linkHTML += '</a>';
    }

    card.innerHTML = headerHTML + descHTML + metaHTML + recHTML + linkHTML;
    return card;
  }

  function applyFilters(services, category, term) {
    var filtered = services.filter(function (s) {
      var matchCategory = !category || s.category === category;
      if (!matchCategory) return false;
      if (!term) return true;

      // Search across name, description, category, tags, recommended_by
      var haystack = (
        s.name + ' ' +
        s.description + ' ' +
        s.category + ' ' +
        (s.tags ? s.tags.join(' ') : '') + ' ' +
        (s.recommended_by || '') + ' ' +
        (s.contact || '')
      ).toLowerCase();

      return haystack.indexOf(term) !== -1;
    });

    renderCards(filtered);

    if (filtered.length === 0) {
      emptyMsg.style.display = 'block';
    } else {
      emptyMsg.style.display = 'none';
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
