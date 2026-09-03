/* =========================================================
   Ostento - interactions
   Header state, nav, reveal, meters, scroll-spy, FAQ,
   activity grid, WebGL hero, cookie consent, forms.
   ========================================================= */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var STORAGE_KEY = "ostento_cookie_consent_v1";

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
    if (toggle && menu) {
        toggle.addEventListener("click", function () {
            var open = menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
        menu.addEventListener("click", function (e) {
            if (e.target.closest("a")) {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            }
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && menu.classList.contains("is-open")) {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                toggle.focus();
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
