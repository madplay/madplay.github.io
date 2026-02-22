(function () {
    var loadedScripts = {};
    var baseUrl = window.siteBaseUrl || "";

    function whenReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
            return;
        }
        callback();
    }

    function loadScriptOnce(src) {
        if (loadedScripts[src]) {
            return loadedScripts[src];
        }

        loadedScripts[src] = new Promise(function (resolve, reject) {
            var script = document.createElement("script");
            script.src = src;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });

        return loadedScripts[src];
    }

    function runWhenIdle(callback, timeout) {
        if ("requestIdleCallback" in window) {
            requestIdleCallback(callback, { timeout: timeout || 2000 });
            return;
        }
        setTimeout(callback, Math.min(timeout || 2000, 1500));
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
            } else {
                image.loading = image.loading || "lazy";
            }

            function applyAspectRatio() {
                if (image.style.aspectRatio) {
                    return;
                }
                if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                    image.style.aspectRatio = image.naturalWidth + " / " + image.naturalHeight;
                }
            }

            applyAspectRatio();
            image.addEventListener("load", applyAspectRatio, { once: true });
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

    function initLazyToc() {
        var tocContainer = document.getElementById("post-toc-nav");
        var postContent = document.querySelector(".post-content");
        if (!tocContainer || !postContent) {
            return;
        }

        var headings = postContent.querySelectorAll("h1, h2, h3");
        if (!headings.length) {
            return;
        }

        var loadToc = function () {
            loadScriptOnce(baseUrl + "/js/toc.js");
        };
        runWhenIdle(loadToc, 1200);
    }

    function initLazyCopyButtons() {
        var codeBlocks = document.querySelectorAll(".post-content .highlight, .post-content pre");
        if (!codeBlocks.length) {
            return;
        }

        var loadCopyScript = function () {
            loadScriptOnce(baseUrl + "/js/copy-button.js");
        };

        if (!("IntersectionObserver" in window)) {
            runWhenIdle(loadCopyScript, 1800);
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }
                observer.disconnect();
                loadCopyScript();
            });
        }, { rootMargin: "220px 0px" });

        observer.observe(codeBlocks[0]);
        runWhenIdle(loadCopyScript, 2600);
    }

    whenReady(function () {
        optimizePostImages();
        initLazyComments();
        initLazyToc();
        initLazyCopyButtons();
    });
})();
