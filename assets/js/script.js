/* =========================================================
   Ostento - interactions
   Header state, nav, reveal, meters, scroll-spy, FAQ,
   activity grid, WebGL hero, cookie consent, forms.
   ========================================================= */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var STORAGE_KEY = "ostento_cookie_consent_v1";

    /* ---------- Shared helpers ---------- */

    /* Counted, so nested locks (nav under modal) do not unlock each other. */
    var scrollLocks = 0;
    function lockScroll() {
        if (scrollLocks++ > 0) { return; }
        var bar = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        if (bar > 0) { document.body.style.paddingRight = bar + "px"; }
    }
    function unlockScroll() {
        if (scrollLocks === 0 || --scrollLocks > 0) { return; }
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    }

    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),' +
        ' select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    /* Keeps Tab inside `container`. Returns the function that releases it. */
    function trapFocus(container) {
        function onKey(e) {
            if (e.key !== "Tab") { return; }
            var items = Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE))
                .filter(function (el) { return el.getClientRects().length > 0; });
            if (!items.length) { return; }
            var first = items[0], last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        document.addEventListener("keydown", onKey, true);
        return function release() { document.removeEventListener("keydown", onKey, true); };
    }

    /* The same 70ms stagger capped at 6 that the .reveal observer uses below,
       so anything revealed later by a filter or a tab moves identically to
       everything revealed on scroll. Cards are visible by default, so the
       starting state is applied here and then released, never left in CSS. */
    function staggerIn(els) {
        if (reduceMotion || !els.length) { return; }
        els.forEach(function (el) {
            el.style.transitionDelay = "0ms";
            el.classList.add("is-entering");
        });
        void els[0].offsetWidth; // flush the start state before transitioning from it
        els.forEach(function (el, i) {
            el.style.transitionDelay = (Math.min(i, 6) * 70) + "ms";
            el.classList.remove("is-entering");
        });
    }

    /* ---------- Footer year ---------- */
    var yearEl = document.getElementById("year");
    if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

    /* ---------- Sticky header state ---------- */
    var header = document.getElementById("site-header");
    if (header) {
        var onScroll = function () {
            if (window.scrollY > 12) { header.classList.add("is-scrolled"); }
            else { header.classList.remove("is-scrolled"); }
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---------- Mobile navigation ---------- */
    var toggle = document.querySelector(".nav__toggle");
    var menu = document.getElementById("nav-menu");
    var header = document.getElementById("site-header");
    if (toggle && menu) {
        var releaseNav = null;

        function openNav() {
            menu.classList.add("is-open");
            toggle.setAttribute("aria-expanded", "true");
            lockScroll();
            // Trap on the header, not the menu, so the toggle stays reachable.
            releaseNav = trapFocus(header || menu);
        }
        function closeNav(returnFocus) {
            if (!menu.classList.contains("is-open")) { return; }
            menu.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            if (releaseNav) { releaseNav(); releaseNav = null; }
            unlockScroll();
            if (returnFocus) { toggle.focus(); }
        }

        toggle.addEventListener("click", function () {
            if (menu.classList.contains("is-open")) { closeNav(false); } else { openNav(); }
        });
        menu.addEventListener("click", function (e) {
            if (e.target.closest("a")) { closeNav(false); }
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { closeNav(true); }
        });
        // Growing past the mobile breakpoint must not strand the scroll lock.
        window.addEventListener("resize", function () {
            if (menu.classList.contains("is-open") && toggle.getClientRects().length === 0) {
                closeNav(false);
            }
        });
    }

    /* ---------- Staggered reveal + capability meters ---------- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    function fillMeters(scope) {
        scope.querySelectorAll(".meter__fill").forEach(function (el) {
            el.style.width = (el.getAttribute("data-val") || 0) + "%";
        });
    }
    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealEls.forEach(function (el) { el.classList.add("is-in"); });
        fillMeters(document);
    } else {
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                var el = entry.target;
                var siblings = Array.prototype.slice.call(el.parentNode.querySelectorAll(":scope > .reveal"));
                var idx = siblings.indexOf(el);
                el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 70 : 0) + "ms";
                el.classList.add("is-in");
                if (el.querySelector(".meter__fill")) { fillMeters(el); }
                obs.unobserve(el);
            });
        }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
        revealEls.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Scroll-spy active nav ---------- */
    var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__menu a[href^="#"]'));
    if (spyLinks.length && "IntersectionObserver" in window) {
        var byId = {};
        spyLinks.forEach(function (l) { byId[l.getAttribute("href").slice(1)] = l; });
        var sections = Object.keys(byId)
            .map(function (id) { return document.getElementById(id); })
            .filter(Boolean);
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    spyLinks.forEach(function (l) { l.classList.remove("is-active"); });
                    var link = byId[entry.target.id];
                    if (link) { link.classList.add("is-active"); }
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---------- FAQ accordion ---------- */
    var faqList = document.getElementById("faq-list");
    if (faqList) {
        faqList.addEventListener("click", function (e) {
            var q = e.target.closest(".faq-q");
            if (!q) { return; }
            var open = q.getAttribute("aria-expanded") === "true";
            var answer = q.nextElementSibling;
            // Close others for a clean single-open accordion.
            faqList.querySelectorAll(".faq-q").forEach(function (other) {
                if (other !== q) {
                    other.setAttribute("aria-expanded", "false");
                    other.nextElementSibling.style.height = "0px";
                }
            });
            if (open) {
                q.setAttribute("aria-expanded", "false");
                answer.style.height = "0px";
            } else {
                q.setAttribute("aria-expanded", "true");
                answer.style.height = answer.firstElementChild.offsetHeight + "px";
            }
        });
        window.addEventListener("resize", function () {
            faqList.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(function (q) {
                q.nextElementSibling.style.height = q.nextElementSibling.firstElementChild.offsetHeight + "px";
            });
        });
    }

    /* ---------- Activity contribution grid ---------- */
    var actGrid = document.getElementById("activity-grid");
    if (actGrid) {
        var levels = ["var(--surface-2)", "rgba(255,106,26,0.35)", "rgba(255,106,26,0.65)", "var(--orange)"];
        var frag = document.createDocumentFragment();
        // 53 weeks x 7 days, deterministic pseudo-random so build phases cluster.
        for (var i = 0; i < 53 * 7; i++) {
            var week = Math.floor(i / 7);
            var wave = Math.sin(week / 4) * 0.5 + 0.5;          // build phases ebb and flow
            var noise = ((i * 2654435761) % 100) / 100;          // cheap deterministic noise
            var score = wave * 0.7 + noise * 0.4;
            var lvl = score > 0.85 ? 3 : score > 0.6 ? 2 : score > 0.38 ? 1 : 0;
            var cell = document.createElement("span");
            cell.className = "activity-cell";
            cell.style.background = levels[lvl];
            frag.appendChild(cell);
        }
        actGrid.appendChild(frag);
    }

    /* ---------- WebGL hero (three.js) ---------- */
    (function initHero() {
        var canvas = document.getElementById("hero-canvas");
        if (!canvas || typeof window.THREE === "undefined") { return; }

        var gl = null;
        try { gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"); } catch (e) { gl = null; }
        if (!gl) { return; } // fallback: CSS glow + text remain

        var THREE = window.THREE;
        var renderer, scene, camera, mesh, wire, frameId, running = true;
        var pointer = { x: 0, y: 0 };

        try {
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        } catch (e) { return; }

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 6);

        var geo = new THREE.IcosahedronGeometry(1.7, 1);
        var mat = new THREE.MeshStandardMaterial({
            color: 0x13224A, metalness: 0.55, roughness: 0.35,
            flatShading: true, emissive: 0x0E1B3A, emissiveIntensity: 0.4
        });
        mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        var wireMat = new THREE.MeshBasicMaterial({ color: 0xFF6A1A, wireframe: true, transparent: true, opacity: 0.16 });
        wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.73, 1), wireMat);
        scene.add(wire);

        var key = new THREE.PointLight(0xFF6A1A, 1.5, 30);
        key.position.set(4, 2, 5);
        scene.add(key);
        var fill = new THREE.PointLight(0xFFB547, 0.6, 30);
        fill.position.set(-5, -3, 3);
        scene.add(fill);
        scene.add(new THREE.AmbientLight(0x3A4A7A, 0.5));

        function resize() {
            var w = canvas.clientWidth || window.innerWidth;
            var h = canvas.clientHeight || window.innerHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            // Nudge the object toward the right so text on the left stays clear.
            var offset = w > 900 ? 1.9 : 0;
            mesh.position.x = wire.position.x = offset;
        }
        window.addEventListener("resize", resize);
        resize();

        window.addEventListener("pointermove", function (e) {
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });

        function render() {
            mesh.rotation.y = wire.rotation.y += 0.0016;
            mesh.rotation.x = wire.rotation.x += 0.0007;
            // Ease toward the cursor for a subtle parallax.
            var targetY = pointer.x * 0.35;
            var targetX = pointer.y * 0.2;
            mesh.rotation.y += (targetY - mesh.rotation.y) * 0.02;
            wire.rotation.y = mesh.rotation.y;
            mesh.rotation.x += (targetX - mesh.rotation.x) * 0.02;
            wire.rotation.x = mesh.rotation.x;
            renderer.render(scene, camera);
            if (running) { frameId = requestAnimationFrame(render); }
        }

        if (reduceMotion) {
            renderer.render(scene, camera); // one static frame
        } else {
            render();
        }

        // Pause when the hero is off-screen to save the frame budget.
        if ("IntersectionObserver" in window) {
            var heroObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting && !reduceMotion) {
                        if (!running) { running = true; render(); }
                    } else {
                        running = false;
                        if (frameId) { cancelAnimationFrame(frameId); }
                    }
                });
            }, { threshold: 0.05 });
            heroObs.observe(canvas);
        }
    })();

    /* ---------- Cookie consent ---------- */
    (function cookieConsent() {
        var banner = document.getElementById("cookie-banner");
        var modal = document.getElementById("cookie-modal");
        if (!banner || !modal) { return; }

        var analyticsToggle = document.getElementById("ck-analytics");
        var marketingToggle = document.getElementById("ck-marketing");

        function read() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
            catch (e) { return null; }
        }
        function save(consent) {
            consent.ts = Date.now();
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch (e) {}
            applyConsent(consent);
        }
        function applyConsent(consent) {
            // Gate real analytics/marketing scripts here, e.g.:
            // if (consent.analytics) { loadAnalytics(); }
            // if (consent.marketing) { loadMarketing(); }
            document.documentElement.setAttribute("data-consent",
                (consent.analytics ? "a" : "") + (consent.marketing ? "m" : "") || "necessary");
        }

        function openBanner() { banner.classList.add("is-open"); }
        function closeBanner() { banner.classList.remove("is-open"); }
        function openModal() {
            var c = read();
            if (analyticsToggle) { analyticsToggle.checked = !!(c && c.analytics); }
            if (marketingToggle) { marketingToggle.checked = !!(c && c.marketing); }
            modal.classList.add("is-open");
        }
        function closeModal() { modal.classList.remove("is-open"); }

        var existing = read();
        if (existing) { applyConsent(existing); }
        else { openBanner(); }

        function handle(action) {
            if (action === "accept") { save({ analytics: true, marketing: true }); closeModal(); closeBanner(); }
            else if (action === "reject") { save({ analytics: false, marketing: false }); closeModal(); closeBanner(); }
            else if (action === "manage") { openModal(); }
            else if (action === "save") {
                save({
                    analytics: !!(analyticsToggle && analyticsToggle.checked),
                    marketing: !!(marketingToggle && marketingToggle.checked)
                });
                closeModal(); closeBanner();
            }
        }

        document.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-cookie]");
            if (btn) { handle(btn.getAttribute("data-cookie")); return; }
            if (e.target.closest("[data-cookie-settings]")) { openModal(); return; }
            if (e.target === modal) { closeModal(); } // click backdrop to dismiss
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && modal.classList.contains("is-open")) { closeModal(); }
        });
    })();

    /* ---------- Portfolio: filter, search, paging ---------- */
    (function portfolio() {
        var grid = document.getElementById("pf-grid");
        if (!grid) { return; }

        var cards = Array.prototype.slice.call(grid.querySelectorAll(".pf-card"));
        var filters = Array.prototype.slice.call(document.querySelectorAll(".pf-filter"));
        var toolbar = document.querySelector(".pf-toolbar");
        var searchWrap = document.querySelector(".pf-search");
        var searchInput = document.getElementById("pf-q");
        var status = document.getElementById("pf-status");
        var empty = document.getElementById("pf-empty");
        var moreWrap = document.getElementById("pf-more-wrap");
        var moreBtn = document.getElementById("pf-more");

        var PAGE = 9;        // three full rows on the widest grid
        var SEARCH_MIN = 8;  // below this a search box is noise, not help

        var VALID = { all: true };
        filters.forEach(function (b) { VALID[b.getAttribute("data-filter")] = true; });

        var state = { category: "all", query: "", shown: PAGE };

        // Cache once. Searching reads this, not textContent on every keystroke.
        cards.forEach(function (c) {
            c._cat = c.getAttribute("data-category") || "";
            c._text = (c.textContent || "").toLowerCase().replace(/\s+/g, " ");
        });

        function matches(card) {
            if (state.category !== "all" && card._cat !== state.category) { return false; }
            if (state.query && card._text.indexOf(state.query) === -1) { return false; }
            return true;
        }

        function labelFor(cat) {
            for (var i = 0; i < filters.length; i++) {
                if (filters[i].getAttribute("data-filter") === cat) {
                    return (filters[i].childNodes[0].nodeValue || cat).trim();
                }
            }
            return cat;
        }

        function render(total) {
            // Counts are derived from the DOM, never authored twice, so they
            // stay correct the moment a project is added or removed.
            filters.forEach(function (b) {
                var cat = b.getAttribute("data-filter");
                var on = cat === state.category;
                b.setAttribute("aria-pressed", on ? "true" : "false");
                b.tabIndex = on ? 0 : -1;
                var n = 0;
                cards.forEach(function (c) { if (cat === "all" || c._cat === cat) { n++; } });
                var slot = b.querySelector(".pf-filter__count");
                if (slot) { slot.textContent = n; }
            });

            var shownNow = Math.min(total, state.shown);
            if (status) {
                var txt;
                if (total === 0) {
                    txt = "No projects match";
                } else {
                    txt = shownNow < total
                        ? "Showing " + shownNow + " of " + total
                        : total + (total === 1 ? " project" : " projects");
                    if (state.category !== "all") { txt += ". Filter: " + labelFor(state.category); }
                    if (state.query) { txt += ". Search: " + state.query; }
                }
                status.textContent = txt;
            }
            if (empty) { empty.hidden = total !== 0; }
            if (moreWrap) { moreWrap.hidden = shownNow >= total; }
        }

        function apply() {
            var matched = cards.filter(matches);
            cards.forEach(function (c) { c._show = false; });
            matched.slice(0, state.shown).forEach(function (c) { c._show = true; });

            var revealed = [];
            cards.forEach(function (card) {
                var wasHidden = card.classList.contains("is-hidden");
                card.classList.toggle("is-hidden", !card._show);
                if (card._show && wasHidden) { revealed.push(card); }
            });
            staggerIn(revealed);
            render(matched.length);
        }

        function writeHash() {
            if (!history.replaceState) { return; }
            // replaceState, not location.hash: assigning would push a history
            // entry per click and turn Back into a filter-undo trap.
            history.replaceState(null, "", state.category === "all"
                ? location.pathname + location.search
                : "#" + state.category);
        }

        function setCategory(cat) {
            if (!VALID[cat]) { return; }
            state.category = cat;
            state.shown = PAGE;
            apply();
            writeHash();
        }

        if (toolbar) {
            toolbar.addEventListener("click", function (e) {
                var b = e.target.closest(".pf-filter");
                if (b) { setCategory(b.getAttribute("data-filter")); }
            });
            // Toolbar pattern: arrows move focus, Enter or Space activates.
            toolbar.addEventListener("keydown", function (e) {
                var i = filters.indexOf(document.activeElement);
                if (i === -1) { return; }
                var next = -1;
                if (e.key === "ArrowRight") { next = (i + 1) % filters.length; }
                else if (e.key === "ArrowLeft") { next = (i - 1 + filters.length) % filters.length; }
                else if (e.key === "Home") { next = 0; }
                else if (e.key === "End") { next = filters.length - 1; }
                if (next === -1) { return; }
                e.preventDefault();
                filters[next].focus();
            });
            // Roving tabindex: the toolbar is one tab stop.
            toolbar.addEventListener("focusin", function (e) {
                var b = e.target.closest(".pf-filter");
                if (!b) { return; }
                filters.forEach(function (x) { x.tabIndex = x === b ? 0 : -1; });
            });
        }

        if (searchInput && searchWrap) {
            // Self-deactivating: a search box over seven cards is clutter.
            if (cards.length >= SEARCH_MIN) { searchWrap.hidden = false; }
            var debounce = null;
            searchInput.addEventListener("input", function () {
                window.clearTimeout(debounce);
                debounce = window.setTimeout(function () {
                    state.query = searchInput.value.trim().toLowerCase();
                    state.shown = PAGE;
                    apply();
                }, 150);
            });
        }

        if (moreBtn) {
            moreBtn.addEventListener("click", function () {
                var before = cards.filter(function (c) { return !c.classList.contains("is-hidden"); }).length;
                state.shown += PAGE;
                apply();
                // Land focus on the first newly shown card rather than losing
                // it when the button hides itself.
                var visible = cards.filter(function (c) { return !c.classList.contains("is-hidden"); });
                var target = visible[before];
                var link = target && target.querySelector(".work-card__link");
                if (link) { link.focus(); }
                else if (moreWrap && moreWrap.hidden) {
                    grid.setAttribute("tabindex", "-1");
                    grid.focus();
                }
            });
        }

        var fromHash = (location.hash || "").replace(/^#/, "");
        if (VALID[fromHash]) { state.category = fromHash; }
        apply();
    })();

    /* ---------- Forms: validation + submit ---------- */
    var forms = Array.prototype.slice.call(document.querySelectorAll("form[data-ajax]"));

    function setError(field, msg) {
        field.classList.add("has-error");
        var err = field.querySelector(".error-text");
        if (err) { err.textContent = msg; }
    }
    function clearError(field) {
        field.classList.remove("has-error");
        var err = field.querySelector(".error-text");
        if (err) { err.textContent = ""; }
    }
    function validateControl(control) {
        var field = control.closest(".field");
        if (!field) { return true; }
        var value = (control.value || "").trim();
        if (control.required && !value) { setError(field, "This field is required."); return false; }
        if (control.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setError(field, "Enter a valid email address."); return false;
        }
        clearError(field);
        return true;
    }

    forms.forEach(function (form) {
        var controls = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
        controls.forEach(function (control) {
            control.addEventListener("input", function () {
                var field = control.closest(".field");
                if (field && field.classList.contains("has-error")) { validateControl(control); }
            });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var valid = true;
            controls.forEach(function (c) { if (!validateControl(c)) { valid = false; } });
            if (!valid) {
                var firstBad = form.querySelector(".field.has-error input, .field.has-error select, .field.has-error textarea");
                if (firstBad) { firstBad.focus(); }
                return;
            }

            var button = form.querySelector("button[type='submit']");
            var status = form.querySelector(".form-status");
            var endpoint = form.getAttribute("action") || "";
            var isPlaceholder = !endpoint || endpoint.indexOf("your-form-id") !== -1;

            button.classList.add("is-loading");
            button.disabled = true;

            function done(ok, msg) {
                button.classList.remove("is-loading");
                button.disabled = false;
                if (ok && status) {
                    if (msg) { status.querySelector(".form-status__text").textContent = msg; }
                    status.classList.add("is-visible");
                    form.reset();
                } else if (!ok) {
                    alert(msg || "Something went wrong. Please try again or email us directly.");
                }
            }

            if (isPlaceholder) {
                // No endpoint connected yet: demonstrate the loading + success flow.
                window.setTimeout(function () {
                    done(true, "Thanks. Your details are ready to send once the form endpoint is connected.");
                }, 900);
                return;
            }

            fetch(endpoint, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
                .then(function (res) {
                    if (res.ok) { done(true); }
                    else {
                        res.json().then(function (data) {
                            var m = (data && data.errors && data.errors.length)
                                ? data.errors.map(function (x) { return x.message; }).join(", ")
                                : null;
                            done(false, m);
                        }).catch(function () { done(false); });
                    }
                })
                .catch(function () { done(false, "Network error. Please check your connection and try again."); });
        });
    });
})();
