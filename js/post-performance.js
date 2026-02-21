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

    whenReady(function () {
        optimizePostImages();
        initLazyComments();
    });
})();
