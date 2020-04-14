$(document).ready(function() {
    blogHelper.init();
});

const blogHelper = {
    TEXT_CLASS_NAME: 'language-plaintext',
    PLAIN_TEXT_SELECTOR: '.language-plaintext',
    OTHER_POST_BOX_SELECTOR: '.other_posts',
    OTHER_POST_CLASS_SELECTOR: '.other_posts_title',

    init: function(config) {
        this._initVar();
        this._runHelper();
    },

    _initVar: function() {
        this.welTextList = $(this.PLAIN_TEXT_SELECTOR);
        this.welOtherPostBox = $(this.OTHER_POST_BOX_SELECTOR);
        this.welOtherPostList = $(this.OTHER_POST_CLASS_SELECTOR);
    },

    _runHelper: function() {
        this._removeTextClass();
        this._checkOtherPost();
    },

    _removeTextClass: function() {
        let self = this;
        $.each(this.welTextList, function(index, item) {
            $(item).removeClass(self.TEXT_CLASS_NAME);
        });
    },

    _checkOtherPost: function() {
        if (this.welOtherPostList.length == 0) {
            this._hideOtherPostBox();
        }
    },

    _hideOtherPostBox: function() {
        this.welOtherPostBox.hide();
    }
};