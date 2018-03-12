---
---
jQuery(function () {
    // Initialize lunr with the fields to be searched, plus the boost.
    window.idx = lunr(function () {
        this.field('title');
        this.field('content', {boost: 10});
        this.field('author');
        this.field('category');
        this.field('tags');
    });

    // Get the generated search_data.json file so lunr.js can search it locally.
    window.data = $.getJSON('{{ site.baseurl }}/js/search/search_data.json');

    // Wait for the data to load and add it to lunr
    window.data.then(function (loaded_data) {
        $.each(loaded_data, function (index, value) {
            window.idx.add(
                $.extend({"id": index}, value)
            );
        });
    });

    // Event when the form is submitted
    $("#site_search").submit(function (event) {
        event.preventDefault(); // RTH: per Google, preventDefault() might be the culprit in Firefox
        var query = $("#search_box").val(); // Get the value for the text field
        var results = window.idx.search(query); // Get lunr to perform a search
        display_search_results(results, query); // Hand the results off to be displayed
    });

    function display_search_results(results, query) {
        var $search_results = $("#search_results");

        // Wait for data to load
        window.data.then(function (loaded_data) {

            // Are there any results?
            if (results.length) {
                $search_results.empty(); // Clear any old results

                // Iterate over the results
                results.forEach(function (result) {
                    var item = loaded_data[result.ref];

                    // Build a snippet of HTML for this result
                    var appendString = '<li><a href="' + item.url + '">' + item.title + '</a></li>';

                    // Add the snippet to the collection of results.
                    $search_results.append(appendString);
                });
            } else {
                // If there are no results, let the user know.
                $search_results.html('<li>\'' + query + '\' 에 대한 결과를 찾을 수 없습니다. 다른 키워드로 검색해보세요.</li>');
            }
        });
    }
});