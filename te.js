/**
 * Simple editor for tweets with syntax highlighting.
 * @author Michał Łowicki
 */


/**
 * @class TweetEditor
 * @constructor
 * @param {Element} statusEl
 * @param {Element} charsCounterEl
 */
function TweetEditor(statusEl, charsCounterEl) {
    this._statusEl = statusEl;
    this._charsCounterEl = charsCounterEl;

    this._init();
}

TweetEditor.MAX_CHARS = 140;

TweetEditor.prototype = {
    constructor: TweetEditor,
    getStatusEl: function() { return this._statusEl; },
    getCharsCounterEl: function() { return this._charsCounterEl; },
    copyArr: function(arr) {
        var newArr = [];

        for(var i=0, len=arr.length; i < len; i++) {
            newArr.push(arr[i]);
        };

        return newArr;
    },
    _init: function() {
        var that = this,
            statusEl = this.getStatusEl();

        statusEl.addEventListener('keyup', function(e) {
            setTimeout(function() {
                that._parse(e.target);

                that.getCharsCounterEl().innerHTML = TweetEditor.MAX_CHARS -
                        statusEl.textContent.length;
            }, 0);
        }, false);
    },
    /**
     * Run parser on specified element.
     * @method _parse
     * @private
     * @param {Element} el
     */
    _parse: function(el) {
        var childNodes = this.copyArr(el.childNodes),
            that = this;
        
        childNodes.forEach(function(node) {
            if(node.nodeType === Node.TEXT_NODE) {
                that._parseTextNode(node);
            }
            else {
                if(node.nodeName === 'P') { // Analyze each line separately.
                    that._parse(node);
                }
                else {
                    that._parseEl(node);
                }
            }
        }); 
    },
    /**
     * @property _TESTS
     * @private
     * @type {Array}
     */
    _TESTS: [
        { regexp: new RegExp(twttr.txt.regexen.validUrl), class: 'url' },
        {
            regexp: new RegExp(twttr.txt.regexen.extractMentions),
            class: 'mention'
        },
        {
            regexp: new RegExp(twttr.txt.regexen.autoLinkHashtags),
            class: 'hash'
        }
    ],
    /**
     * Check if element is link, mention or hash.
     * @method _checkIfSpecialEl
     * @param {Element} el
     */
    _checkIfSpecialEl: function(el) {
        var html = el.innerHTML;

        for(var i=0, len=this._TESTS.length; i < len; i++) {
            var test = this._TESTS[i];

            test.regexp.lastIndex = 0;

            if(test.regexp.exec(html)) {
                O.Dom.addClass(el, test.class);
            }
            else {
                O.Dom.removeClass(el, test.class);
            }
        }
    },
    /**
     * Regular expression for matching element's content.
     * @property _EL_VAL_REGEXP
     * @private
     * @type {RegExp}
     */
    _EL_VAL_REGEXP: /^(\S+)(\s+)(\S*)$/,
    /**
     * Parse single element.
     * @method _parseEl
     * @param {Element} el
     */
    _parseEl: function(el) {
        var content = el.textContent;

        if(content) {
            var match = this._EL_VAL_REGEXP.exec(content);

            if(match) {
                el.innerHTML = match[1];

                var spacesTokenEl = document.createTextNode(match[2]);
                O.Dom.insertAfter(spacesTokenEl, el);

                if(match[3]) {
                    var secondTokenEl = document.createElement('span');
                    secondTokenEl.innerHTML = match[3];
                    O.Dom.insertAfter(secondTokenEl, spacesTokenEl);

                    this._setCaretAtTheEnd(secondTokenEl);
                    this._checkIfSpecialEl(secondTokenEl);
                }
                else {
                    this._setCaretAtTheEnd(spacesTokenEl);
                }
            }
            else {
                this._checkIfSpecialEl(el);
            }
        }
        else {
            // <br> element is handled in a special way because it's used
            // for the empty elements like <span><br></span> for empty first
            // line  and <p><br></p> and empty non-first lines.
            if(el.nodeName == 'SPAN' && el.innerHTML != '<br>') {
                el.parentNode.removeChild(el);
            }
        }
    },
    /**
     * Checks if string has blanks at the end.
     * @method _hasBlankEnd
     * @private
     * @param {String} s
     * @return {Boolean}
     */
    _hasBlankEnd: function(s) { return s[s.length-1] === ' ';  },
    /**
     * Checks if string has blanks at the beginning.
     * @method _hasBlankEnd
     * @private
     * @param {String} s
     * @return {Boolean}
     */
    _hasBlankStart: function(s) { return s[0] === ' '; },
    /**
     * Regular expression for matching empty text nodes.
     * @property _BLANK_REGEXP
     * @private
     * @type {RegExp}
     */
    _BLANK_REGEXP: /^\s*$/,
    /**
     * Regular expression for matching non-empty text nodes with all
     * spaces at the beginning.
     * @property _NON_BLANK_REGEXP
     * @private
     * @type {RegExp}
     */
    _NON_BLANK_REGEXP: /^(\s*)(\S+)(\s*)$/,
    /**
     * Parse single text node.
     * @method _parseTextNode
     * @private
     * @param {Node} node
     */
    _parseTextNode: function(node) {
        if(!node.nodeValue.match(this._BLANK_REGEXP)) {
            var match = this._NON_BLANK_REGEXP.exec(node.nodeValue);

            if(!match) { return; }

            if(match[1].length) {
                node.nodeValue = match[1];
            }
            else { // try to merge with the previous node
                var prev = node.previousSibling;

                if(prev && prev.nodeName == 'SPAN' &&
                        !this._hasBlankEnd(prev.innerHTML)) {
                    prev.innerHTML += match[2];

                    if(match[3]) {
                        node.nodeValue = match[3];
                    }
                    else {
                        node.parentNode.removeChild(node);
                    }

                    this._setCaretAtTheEnd(prev);
                    this._checkIfSpecialEl(prev);
                    return;
                }
            }

            if(!match[3]) { // try to merge with the next node
                var next = node.nextSibling;

                if(next && next.nodeName == 'SPAN' &&
                        !this._hasBlankStart(next.innerHTML)) {

                    next.innerHTML = match[2] + next.innerHTML;

                    if(match[1]) {
                        node.nodeValue = match[1];
                    }
                    else {
                        node.parentNode.removeChild(node);
                    }

                    this._setCaretAt(next, match[2].length);
                    this._checkIfSpecialEl(next);
                    return;
                }
            }

            var newTokenEl = document.createElement('span');
            newTokenEl.innerHTML = match[2];

            O.Dom.insertAfter(newTokenEl, node);

            if(match[3]) {
                var spacesTokenEl = document.createTextNode(match[3]);
                O.Dom.insertAfter(spacesTokenEl, newTokenEl);
            }

            if(!match[1].length) {
                node.parentNode.removeChild(node);
            }

            this._setCaretAtTheEnd(newTokenEl);
            this._checkIfSpecialEl(newTokenEl);
        }
    },
    /**
     * Set cursor and the end of specified node.
     * @method _setCaretAtTheEnd
     * @param {Node} node
     */
    _setCaretAtTheEnd: function(node) {
        var selection = window.getSelection();

        if(selection.rangeCount > 0) { selection.removeAllRanges(); }

        if(node.nodeName === 'P') { node = node.lastChild; }

        if(node.nodeName === 'SPAN') { node = node.firstChild; }

        if(node.nodeType === Node.TEXT_NODE) { // text node
            var range = document.createRange();

            range.setStart(node, node.nodeValue.length);
            range.setEnd(node, node.nodeValue.length);

            selection.addRange(range);
        }
        else {
            throw new Error('Not implemented');
        }
    },
    /**
     * Set caret at the specified index in node.
     * @method _setCaretAt
     * @private
     * @param {Node} node
     * @param {Number} index
     */
    _setCaretAt: function(node, index) {
        var selection = window.getSelection();

        if(selection.rangeCount > 0) { selection.removeAllRanges(); }

        if(node.nodeName === 'P') { throw new Error('Not implemented'); }

        if(node.nodeName === 'SPAN') { node = node.firstChild; }

        if(node.nodeType === Node.TEXT_NODE) { // text node
            var range = document.createRange();

            range.setStart(node, index);
            range.setEnd(node, index);

            selection.addRange(range);
        }
        else { throw new Error('Not implemented'); }
    },
    /**
     * Set cursor at the beginning of the specified node.
     * @method _setCaretAtTheBeginning
     * @private
     * @param {Node} node
     */
    _setCaretAtTheBeginning: function(node) {
        var selection = window.getSelection();

        if(selection.rangeCount > 0) { selection.removeAllRanges(); }

        var range = document.createRange();

        range.setStart(node, 0);
        range.setEnd(node, 0);

        selection.addRange(range);
    }
};

