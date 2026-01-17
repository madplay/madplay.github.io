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
    let postsLoaded = false;
    let loadingPromise = null;

    function loadPostsData() {
        if (postsLoaded) {
            return Promise.resolve(postsData);
        }

        if (loadingPromise) {
            return loadingPromise;
        }

        if (window.postsData && window.postsData.length) {
            postsData = window.postsData;
            postsLoaded = true;
            return Promise.resolve(postsData);
        }

        const searchIndexUrl = window.searchIndexUrl || '/search.json';
        loadingPromise = fetch(searchIndexUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('검색 인덱스를 불러올 수 없습니다');
                }
                return response.json();
            })
            .then(data => {
                postsData = Array.isArray(data) ? data : [];
                postsLoaded = true;
                return postsData;
            })
            .catch(() => {
                postsData = [];
                postsLoaded = true;
                return postsData;
            });

        return loadingPromise;
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
        if (!postsLoaded) {
            searchEmpty.textContent = '검색 데이터를 불러오는 중...';
            searchEmpty.classList.remove('hidden');
            searchList.classList.add('hidden');
            searchNoResults.classList.add('hidden');
            loadPostsData().then(() => {
                searchEmpty.textContent = '검색어를 입력하세요';
            });
        }
    }

    function closeSearch() {
        searchModal.classList.add('hidden');
        document.body.style.overflow = '';
        searchInput.value = '';
        performSearch('');
    }

    searchToggle.addEventListener('click', openSearch);
    
    // 모바일 검색 버튼
    const searchToggleMobile = document.getElementById('search-toggle-mobile');
    if (searchToggleMobile) {
        searchToggleMobile.addEventListener('click', openSearch);
    }
    
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
