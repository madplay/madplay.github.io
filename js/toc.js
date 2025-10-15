document.addEventListener("DOMContentLoaded", function () {
    var postContent = document.querySelector(".post-content");
    var tocNav = document.getElementById("post-toc-nav");
    var tocAside = document.querySelector(".post-toc");
    var TOC_TOP_GAP = 68;

    if (!postContent || !tocNav || !tocAside) {
        return;
    }

    var headings = Array.prototype.slice.call(postContent.querySelectorAll("h1, h2, h3"));
    if (!headings.length) {
        tocAside.classList.add("is-empty");
        return;
    }

    var idCount = {};
    var tocList = document.createElement("ul");
    var links = [];

    function slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-가-힣]/g, "")
            .replace(/\s+/g, "-");
    }

    var currentH2Id = null;

    headings.forEach(function (heading) {
        var text = heading.textContent ? heading.textContent.trim() : "";
        if (!text) {
            return;
        }

        if (!heading.id) {
            var baseId = slugify(text) || "section";
            var count = idCount[baseId] || 0;
            count += 1;
            idCount[baseId] = count;
            heading.id = count === 1 ? baseId : baseId + "-" + count;
        }

        var level = 1;
        var levelClass = "toc-level-1";
        if (heading.tagName === "H3") {
            level = 3;
            levelClass = "toc-level-3";
        } else if (heading.tagName === "H2") {
            level = 2;
            levelClass = "toc-level-2";
        }

        if (level === 2) {
            currentH2Id = heading.id;
        }

        var parentH2Id = level === 3 ? currentH2Id : null;

        var listItem = document.createElement("li");
        listItem.className = levelClass;

        var link = document.createElement("a");
        link.href = "#" + heading.id;
        link.textContent = text;

        listItem.appendChild(link);
        tocList.appendChild(listItem);

        links.push({
            heading: heading,
            link: link,
            listItem: listItem,
            level: level,
            parentH2Id: parentH2Id
        });
    });

    if (!links.length) {
        tocAside.classList.add("is-empty");
        return;
    }

    tocNav.appendChild(tocList);

    function setActive(targetId) {
        var activeItem = null;
        links.forEach(function (item) {
            if (item.heading.id === targetId) {
                activeItem = item;
            }
        });

        var expandedH2Id = null;
        if (activeItem) {
            if (activeItem.level === 2) {
                expandedH2Id = activeItem.heading.id;
            } else if (activeItem.level === 3) {
                expandedH2Id = activeItem.parentH2Id;
            } else {
                for (var i = links.indexOf(activeItem); i >= 0; i -= 1) {
                    if (links[i].level === 2) {
                        expandedH2Id = links[i].heading.id;
                        break;
                    }
                }
            }
        }

        links.forEach(function (item) {
            item.link.classList.toggle("is-active", item.heading.id === targetId);

            if (item.level === 2) {
                item.listItem.classList.toggle("is-expanded", item.heading.id === expandedH2Id);
            }

            if (item.level === 3) {
                var isVisible = item.parentH2Id === expandedH2Id || item.heading.id === targetId;
                item.listItem.classList.toggle("is-visible", isVisible);
            }
        });
    }

    function getScrollOffset() {
        var stickyHeader = document.querySelector("header.sticky");
        var headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;
        return Math.max(headerHeight + TOC_TOP_GAP, 120);
    }

    function applyStickyTop() {
        var stickyTop = getScrollOffset();
        document.documentElement.style.setProperty("--toc-sticky-top", stickyTop + "px");
    }

    function applyScrollMargin() {
        var marginTop = getScrollOffset() + 8;
        links.forEach(function (item) {
            item.heading.style.scrollMarginTop = marginTop + "px";
        });
    }

    var suppressUntil = 0;

    function updateActiveByScroll() {
        if (Date.now() < suppressUntil) {
            return;
        }

        var viewportAnchor = Math.max(140, Math.round(window.innerHeight * 0.28));
        var offset = window.scrollY + getScrollOffset() + viewportAnchor;
        var activeId = links[0].heading.id;

        links.forEach(function (item) {
            if (item.heading.offsetTop <= offset) {
                activeId = item.heading.id;
            }
        });

        setActive(activeId);
    }

    links.forEach(function (item) {
        item.link.addEventListener("click", function (event) {
            event.preventDefault();

            var targetTop = item.heading.getBoundingClientRect().top + window.scrollY - getScrollOffset();
            suppressUntil = Date.now() + 450;

            setActive(item.heading.id);
            window.scrollTo({
                top: Math.max(0, targetTop),
                behavior: "smooth"
            });

            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, "", "#" + item.heading.id);
            }

            setTimeout(function () {
                updateActiveByScroll();
            }, 500);
        });
    });

    var isTicking = false;
    function onScroll() {
        if (isTicking) {
            return;
        }
        isTicking = true;
        window.requestAnimationFrame(function () {
            updateActiveByScroll();
            isTicking = false;
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
        applyStickyTop();
        applyScrollMargin();
        updateActiveByScroll();
    });

    applyStickyTop();
    applyScrollMargin();
    updateActiveByScroll();
});
