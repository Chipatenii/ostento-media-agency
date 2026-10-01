/* =========================================================
   Ostento - interactions
   Header state, nav, reveal, service navigation, scroll-spy,
   cookie consent, forms.
   ========================================================= */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var STORAGE_KEY = "ostento_cookie_consent_v1";
    /* Keep old homepage section URLs working after their move to standalone pages. */
    var pageName = location.pathname.split("/").pop();
    if (!pageName || pageName === "index.html") {
        var legacyPage = {
            "#numbers": "services.html",
            "#build": "services.html#services",
            "#develop": "services.html#software",
            "#work": "portfolio.html",
            "#inquiry": "contact.html",
            "#studio": "services.html",
            "#proof": "clients.html",
            "#process": "process.html",
            "#system": "process.html",
            "#activity": "portfolio.html"
        }[location.hash];
        if (legacyPage) { location.replace(legacyPage); return; }
    }


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

    /* Keep the floating contact shortcut clear of the footer's contact links. */
    var whatsappFloat = document.querySelector(".whatsapp-float");
    var footerContact = document.querySelector(".footer-contact");
    if (whatsappFloat && footerContact && "IntersectionObserver" in window) {
        var contactObserver = new IntersectionObserver(function (entries) {
            whatsappFloat.classList.toggle("is-hidden", entries[0].isIntersecting);
        });
        contactObserver.observe(footerContact);
    }

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
    if (toggle && menu) {
        var releaseNav = null;
        var backdrop = document.querySelector(".nav__backdrop");
        var toggleLabel = toggle.querySelector(".nav__toggle-label");
        if (header) { header.classList.add("nav-ready"); }

        function openNav() {
            if (menu.classList.contains("is-open")) { return; }
            menu.classList.add("is-open");
            if (header) { header.classList.add("nav-is-open"); }
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Close menu");
            if (toggleLabel) { toggleLabel.textContent = "Close"; }
            if (backdrop) { backdrop.hidden = false; }
            lockScroll();
            // Trap on the header, not the menu, so the toggle stays reachable.
            releaseNav = trapFocus(header || menu);
        }
        function closeNav(returnFocus) {
            if (!menu.classList.contains("is-open")) { return; }
            menu.classList.remove("is-open");
            if (header) { header.classList.remove("nav-is-open"); }
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open menu");
            if (toggleLabel) { toggleLabel.textContent = "Menu"; }
            if (backdrop) { backdrop.hidden = true; }
            if (releaseNav) { releaseNav(); releaseNav = null; }
            unlockScroll();
            if (returnFocus) { toggle.focus(); }
        }

        if (backdrop) { backdrop.addEventListener("click", function () { closeNav(true); }); }
        window.addEventListener("pageshow", function () { closeNav(false); });
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

    /* ---------- Staggered reveal ---------- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealEls.forEach(function (el) { el.classList.add("is-in"); });
    } else {
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                var el = entry.target;
                var siblings = Array.prototype.slice.call(el.parentNode.querySelectorAll(":scope > .reveal"));
                var idx = siblings.indexOf(el);
                el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 70 : 0) + "ms";
                el.classList.add("is-in");
                el.classList.remove("is-pending");
                obs.unobserve(el);
            });
        }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
        revealEls.forEach(function (el) {
            if (el.closest(".studio-main, .process-main")) { el.classList.add("is-pending"); }
            io.observe(el);
        });
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

    /* ---------- Service and process section navigation ---------- */
    (function sectionNavigation() {
        var navs = document.querySelectorAll(".studio-service-nav, .process-stage-nav");
        navs.forEach(function (nav) {
            var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
            var sections = links.map(function (link) {
                return document.getElementById(link.getAttribute("href").slice(1));
            }).filter(Boolean);
            function markCurrent(id) {
                links.forEach(function (link) {
                    if (link.getAttribute("href") === "#" + id) {
                        link.setAttribute("aria-current", "location");
                    } else {
                        link.removeAttribute("aria-current");
                    }
                });
            }
            function markHash() {
                if (sections.some(function (section) { return "#" + section.id === location.hash; })) {
                    markCurrent(location.hash.slice(1));
                }
            }
            nav.addEventListener("click", function (event) {
                var link = event.target.closest('a[href^="#"]');
                if (link && nav.contains(link)) { markCurrent(link.getAttribute("href").slice(1)); }
            });
            window.addEventListener("hashchange", markHash);
            markHash();
            if (!("IntersectionObserver" in window)) { return; }
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) { markCurrent(entry.target.id); }
                });
            }, { rootMargin: "-32% 0px -48% 0px", threshold: 0 });
            sections.forEach(function (section) { observer.observe(section); });
        });
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
        var categoryHeadings = Array.prototype.slice.call(grid.querySelectorAll(".pf-category"));
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

            var shownNow = state.category === "all" ? total : Math.min(total, state.shown);
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
            // The overview shows every category together; individual filters
            // retain their existing Show more behavior.
            var limit = state.category === "all" ? matched.length : state.shown;
            matched.slice(0, limit).forEach(function (c) { c._show = true; });

            var revealed = [];
            cards.forEach(function (card) {
                var wasHidden = card.classList.contains("is-hidden");
                card.classList.toggle("is-hidden", !card._show);
                if (card._show && wasHidden) { revealed.push(card); }
            });
            categoryHeadings.forEach(function (heading) {
                var category = heading.getAttribute("data-portfolio-category");
                heading.hidden = state.category !== "all" || !cards.some(function (card) {
                    return card._cat === category && card._show;
                });
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

    /* ---------- Proof: tabs ---------- */
    (function proofTabs() {
        var list = document.querySelector('.proof-tabs[role="tablist"]');
        if (!list) { return; }
        var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
        if (!tabs.length) { return; }

        function loadTrustmaryReviews() {
            var host = document.getElementById("trustmary-reviews");
            var status = document.getElementById("trustmary-status");
            if (!host || host.dataset.loaded === "true") { return; }
            host.dataset.loaded = "true";
            if (status) { status.textContent = "Loading reviews..."; status.hidden = false; }
            var embed = document.createElement("script");
            embed.src = "https://widget.trustmary.com/xLG8xMegZ";
            embed.async = true;
            embed.onload = function () {
                if (status) { status.hidden = true; }
            };
            embed.onerror = function () {
                if (status) {
                    status.textContent = "Reviews could not be loaded. Please try again later.";
                    status.hidden = false;
                }
            };
            host.appendChild(embed);
        }

        function select(tab, focus) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.setAttribute("aria-selected", on ? "true" : "false");
                t.tabIndex = on ? 0 : -1;
                var panel = document.getElementById(t.getAttribute("aria-controls"));
                if (panel) { panel.hidden = !on; }
            });
            if (tab.id === "tab-reviews") { loadTrustmaryReviews(); }
            if (focus) { tab.focus(); }
            /* Deliberately does not touch the URL: a sub-view on a long page
               should not push history entries. */
        }

        list.addEventListener("click", function (e) {
            var t = e.target.closest('[role="tab"]');
            if (t) { select(t, false); }
        });
        list.addEventListener("keydown", function (e) {
            var i = tabs.indexOf(document.activeElement);
            if (i === -1) { return; }
            var next = -1;
            if (e.key === "ArrowRight") { next = (i + 1) % tabs.length; }
            else if (e.key === "ArrowLeft") { next = (i - 1 + tabs.length) % tabs.length; }
            else if (e.key === "Home") { next = 0; }
            else if (e.key === "End") { next = tabs.length - 1; }
            if (next === -1) { return; }
            e.preventDefault();
            select(tabs[next], true); // automatic activation: panels are cheap
        });
    })();

    /* ---------- Proof: continuous client logo loop ---------- */
    (function clientSlider() {
        var track = document.getElementById("client-track");
        if (!track) { return; }
        var slider = track.closest(".client-slider");
        var group = track.querySelector(".client-group");
        if (!slider || !group || group.children.length < 2) { return; }

        // Equal groups include the trailing gap so the loop joins seamlessly.
        var copy = group.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll("img").forEach(function (img) {
            img.alt = "";
            img.loading = "eager";
        });
        track.appendChild(copy);
        slider.classList.add("is-animated");

        var inView = true;
        function updatePlayback() {
            slider.classList.toggle("is-paused", document.hidden || !inView);
        }
        document.addEventListener("visibilitychange", updatePlayback);
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                inView = entries[0].isIntersecting;
                updatePlayback();
            }, { threshold: 0 }).observe(slider);
        }
        updatePlayback();
    })();

    /* ---------- Project detail modal ---------- */
    (function projectModal() {
        var modal = document.getElementById("project-modal");
        if (!modal) { return; }
        var titleEl = document.getElementById("project-modal-title");
        var metaEl = document.getElementById("project-modal-meta");
        var bodyEl = document.getElementById("project-modal-body");
        var closeBtn = document.getElementById("project-modal-close");
        var opener = null;
        var release = null;

        function open(card, trigger) {
            var tpl = card.querySelector(".work-card__detail");
            if (!tpl) { return; }
            opener = trigger;

            var heading = card.querySelector(".work-card__link") || card.querySelector("h3");
            titleEl.textContent = heading ? heading.textContent.trim() : "";

            var bits = [];
            var tag = card.querySelector(".work-card__tag");
            var client = card.querySelector(".work-card__client");
            var year = card.getAttribute("data-year");
            if (tag) { bits.push(tag.textContent.trim()); }
            // An unfilled client is not surfaced here as though it were a name.
            if (client && !client.hasAttribute("data-todo")) { bits.push(client.textContent.trim()); }
            if (year) { bits.push(year); }
            metaEl.textContent = bits.join(" · ");

            bodyEl.innerHTML = "";
            bodyEl.appendChild(tpl.content.cloneNode(true));

            modal.classList.add("is-open");
            lockScroll();
            release = trapFocus(modal);
            closeBtn.focus();
        }

        function close() {
            if (!modal.classList.contains("is-open")) { return; }
            modal.classList.remove("is-open");
            if (release) { release(); release = null; }
            unlockScroll();
            // Focus returns to the exact card that opened it.
            if (opener) { opener.focus(); opener = null; }
        }

        document.addEventListener("click", function (e) {
            var trigger = e.target.closest("[data-open-project]");
            if (trigger) {
                var card = trigger.closest(".work-card");
                if (card) { e.preventDefault(); open(card, trigger); }
                return;
            }
            if (e.target.closest("#project-modal-close")) { close(); return; }
            if (e.target === modal) { close(); } // backdrop, matching the cookie modal
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { close(); }
        });
    })();

    /* ---------- Image loading state ---------- */
    (function mediaSkeletons() {
        var imgs = Array.prototype.slice.call(document.querySelectorAll(".work-card__media img"));
        imgs.forEach(function (img) {
            var media = img.closest(".work-card__media");
            if (!media) { return; }

            function loaded() { media.classList.remove("media-skel"); media.classList.add("is-loaded"); }
            function failed() {
                // Drop the broken frame and keep the gradient tile underneath,
                // which is a designed state rather than an error icon.
                img.remove();
                media.classList.remove("media-skel");
            }

            if (img.complete) {
                if (img.naturalWidth > 0) { loaded(); } else { failed(); }
                return;
            }
            media.classList.add("media-skel");
            img.addEventListener("load", loaded);
            img.addEventListener("error", failed);
        });
    })();

    /* ---------- Contact form: prepare a draft in the visitor's chosen app ---------- */
    (function contactDraft() {
        var form = document.querySelector("form[data-contact-draft]");
        if (!form) { return; }
        var status = document.getElementById("contact-status");
        var serviceSelect = form.querySelector('[name="project_type"]');
        var requestedService = new URLSearchParams(location.search).get("service");
        if (serviceSelect && requestedService) {
            var matches = Array.prototype.some.call(serviceSelect.options, function (option) {
                return option.value === requestedService && option.value !== "";
            });
            if (matches) { serviceSelect.value = requestedService; }
        }
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.reportValidity()) { return; }
            var data = new FormData(form);
            var lines = [
                "Hello Ostento,",
                "",
                "I would like to discuss a project.",
                "",
                "Name: " + data.get("name").trim(),
                "Email: " + data.get("email").trim(),
                "Phone / WhatsApp: " + (data.get("phone").trim() || "Not provided"),
                "Service: " + serviceSelect.options[serviceSelect.selectedIndex].textContent.trim(),
                "",
                "Project details:",
                data.get("message").trim()
            ];
            var message = lines.join("\n");
            var channel = e.submitter && e.submitter.value === "whatsapp" ? "whatsapp" : "email";
            if (status) {
                status.textContent = "Your draft is ready. Review it and press Send in " +
                    (channel === "whatsapp" ? "WhatsApp." : "your email app.");
            }
            if (channel === "whatsapp") {
                location.href = "https://wa.me/260770381593?text=" + encodeURIComponent(message);
            } else {
                location.href = "mailto:growth@ostentomedia-agency.com?subject=" +
                    encodeURIComponent("Project inquiry from " + data.get("name").trim()) +
                    "&body=" + encodeURIComponent(message);
            }
        });
    })();

})();
