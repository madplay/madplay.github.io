(function () {
    const searchModal = document.getElementById('search-modal');
    const searchToggle = document.getElementById('search-toggle');
    const searchClose = document.getElementById('search-close');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const searchList = document.getElementById('search-list');
    const searchEmpty = document.getElementById('search-empty');
    const searchNoResults = document.getElementById('search-no-results');

    if (!searchModal || !searchToggle || !searchInput) {
        return;
    }

    let postsData = [];

    function loadPostsData() {
        if (window.postsData) {
            postsData = window.postsData;
        }
    }

    function performSearch(query) {
        if (!query || query.trim().length === 0) {
            searchEmpty.classList.remove('hidden');
            searchList.classList.add('hidden');
            searchNoResults.classList.add('hidden');
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        const results = postsData.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(searchTerm);
            const excerptMatch = post.excerpt.toLowerCase().includes(searchTerm);
            return titleMatch || excerptMatch;
        });

        if (results.length === 0) {
            searchEmpty.classList.add('hidden');
            searchList.classList.add('hidden');
            searchNoResults.classList.remove('hidden');
        } else {
            searchEmpty.classList.add('hidden');
            searchNoResults.classList.add('hidden');
            searchList.classList.remove('hidden');

            searchList.innerHTML = results.map(post => `
                <a href="${post.url}" class="block p-4 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-200">
                    <h3 class="text-zinc-100 font-medium mb-1 text-base">${post.title}</h3>
                    <p class="text-zinc-400 text-sm mb-2 line-clamp-2">${post.excerpt}</p>
                    <time class="text-zinc-500 text-xs font-mono">${post.date}</time>
                </a>
            `).join('');
        }
    }

    function openSearch() {
        searchModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        searchInput.focus();
        loadPostsData();
    }

    function closeSearch() {
        searchModal.classList.add('hidden');
        document.body.style.overflow = '';
        searchInput.value = '';
        performSearch('');
    }

    searchToggle.addEventListener('click', openSearch);
    searchClose.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', closeSearch);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
            closeSearch();
        }
    });

    let searchTimeout;
    searchInput.addEventListener('input', function (e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const firstResult = searchList.querySelector('a');
            if (firstResult) {
                firstResult.click();
            }
        }
    });
})();
