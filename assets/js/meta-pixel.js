/* =========================================================
   Ostento - Meta Pixel
   Loads only with Marketing consent, read from the choice the
   cookie banner in script.js saves. Until then nothing is
   requested from Meta.
   ========================================================= */
(function () {
    "use strict";

    var PIXEL_ID = "956320665525611"; // the numeric ID from Meta Events Manager
    var STORAGE_KEY = "ostento_cookie_consent_v2"; // same key as script.js

    var loaded = false;
    var granted = false;

    function readConsent() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
        catch (e) { return null; }
    }

    /* Meta's base code, unminified: fbq queues calls until fbevents.js arrives. */
    function load() {
        var fbq = window.fbq = function () {
            if (fbq.callMethod) { fbq.callMethod.apply(fbq, arguments); }
            else { fbq.queue.push(arguments); }
        };
        if (!window._fbq) { window._fbq = fbq; }
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = "2.0";
        fbq.queue = [];
        var script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(script);
        // No automatic button-click or page-metadata events: only the events
        // below are sent, as the Privacy Policy lists. Must come before init.
        fbq("set", "autoConfig", false, PIXEL_ID);
        fbq("init", PIXEL_ID);
        fbq("track", "PageView");
        loaded = true;
    }

    function grant() {
        if (granted) { return; }
        if (!/^\d+$/.test(PIXEL_ID)) {
            if (window.console) { console.warn("Meta Pixel: set PIXEL_ID in assets/js/meta-pixel.js"); }
            return;
        }
        if (loaded) { window.fbq("consent", "grant"); } else { load(); }
        granted = true;
    }

    /* A loaded library cannot be removed, so this page is told to stop sending
       and the Pixel's first-party cookies are deleted. Later pages never load it. */
    function revoke() {
        if (granted) { window.fbq("consent", "revoke"); }
        granted = false;
        var host = location.hostname.split(".");
        ["_fbp", "_fbc"].forEach(function (name) {
            if (document.cookie.indexOf(name + "=") === -1) { return; }
            var expired = name + "=; Max-Age=0; path=/";
            document.cookie = expired;
            // Meta sets them on the parent domain, so try each level of the host.
            for (var i = 0; i < host.length - 1; i++) {
                document.cookie = expired + "; domain=" + host.slice(i).join(".");
            }
        });
    }

    function update(consent) {
        if (consent && consent.marketing) { grant(); } else { revoke(); }
    }

    function track(event, params) {
        if (granted) { window.fbq("track", event, params); }
    }

    var initial = readConsent();
    if (initial && initial.marketing) { grant(); }

    // Fired by script.js on Accept all, Reject all and Save preferences.
    document.addEventListener("ostento:consent", function (e) { update(e.detail); });
    // The choice changed in another tab.
    window.addEventListener("storage", function (e) {
        if (e.key === STORAGE_KEY) { update(readConsent()); }
    });

    // Fired by script.js once the quote form passes validation and opens a draft.
    document.addEventListener("ostento:lead", function (e) {
        track("Lead", { content_category: e.detail.service });
    });

    document.addEventListener("click", function (e) {
        var link = e.target.closest('a[href*="wa.me/260770381593"], a[href^="tel:"]');
        if (link) { track("Contact", { content_name: link.protocol === "tel:" ? "Phone" : "WhatsApp" }); }
    });
})();
