(function () {
    function whenReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
            return;
        }
        callback();
    }

    function optimizePostImages() {
        var images = document.querySelectorAll(".post-content img");
        if (!images.length) {
            return;
        }

        images.forEach(function (image, index) {
            image.decoding = "async";
            if (index === 0) {
                image.loading = image.loading || "eager";
                image.fetchPriority = image.fetchPriority || "high";
                return;
            }
            image.loading = image.loading || "lazy";
        });
    }

    function initLazyComments() {
        var container = document.getElementById("utterances-container");
        if (!container) {
            return;
        }

        function mountUtterances() {
            if (container.dataset.loaded === "true") {
                return;
            }
            container.dataset.loaded = "true";

            var script = document.createElement("script");
            script.src = "https://utteranc.es/client.js";
            script.setAttribute("repo", container.dataset.repo || "");
            script.setAttribute("issue-term", container.dataset.issueTerm || "og:title");
            script.setAttribute("label", container.dataset.label || "comment");
            script.setAttribute("theme", container.dataset.theme || "github-dark");
            script.setAttribute("crossorigin", "anonymous");
            script.async = true;
            container.appendChild(script);
        }

        if (!("IntersectionObserver" in window)) {
            mountUtterances();
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }
                observer.disconnect();
                mountUtterances();
            });
        }, { rootMargin: "600px 0px" });

        observer.observe(container);
    }

    function initLazyAds() {
        var slots = Array.prototype.slice.call(document.querySelectorAll("ins.adsbygoogle[data-ads-lazy='true']"));
        if (!slots.length) {
            return;
        }

        function pushAd(slot) {
            if (slot.dataset.adsPushed === "true") {
                return;
            }
            slot.dataset.adsPushed = "true";
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (error) {
                slot.dataset.adsPushed = "false";
            }
        }

        function loadAdsScript() {
            if (window.__adsScriptReady) {
                return Promise.resolve();
            }
            if (window.__adsScriptLoading) {
                return window.__adsScriptLoading;
            }

            if (window.adsbygoogle && typeof window.adsbygoogle.push === "function") {
                window.__adsScriptReady = true;
                return Promise.resolve();
            }

            window.__adsScriptLoading = new Promise(function (resolve, reject) {
                var existing = document.querySelector("script[data-ad-client='ca-pub-8036596086585080']");
                if (existing) {
                    existing.addEventListener("load", function () {
                        window.__adsScriptReady = true;
                        resolve();
                    }, { once: true });
                    existing.addEventListener("error", reject, { once: true });

                    setTimeout(function () {
                        if (window.adsbygoogle && typeof window.adsbygoogle.push === "function") {
                            window.__adsScriptReady = true;
                            resolve();
                        }
                    }, 300);
                    return;
                }

                var script = document.createElement("script");
                script.async = true;
                script.dataset.adClient = "ca-pub-8036596086585080";
                script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8036596086585080";
                script.onload = function () {
                    window.__adsScriptReady = true;
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });

            return window.__adsScriptLoading;
        }

        function activate(slot) {
            loadAdsScript()
                .then(function () {
                    pushAd(slot);
                })
                .catch(function () {});
        }

        if (!("IntersectionObserver" in window)) {
            slots.forEach(activate);
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }
                observer.unobserve(entry.target);
                activate(entry.target);
            });
        }, { rootMargin: "400px 0px" });

        slots.forEach(function (slot) {
            observer.observe(slot);
        });
    }

    whenReady(function () {
        optimizePostImages();
        initLazyComments();
        initLazyAds();
    });
})();
