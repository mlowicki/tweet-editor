/**
 * DOM utilities
 * @module dom
 * @requires utils
 */


/**
 * Module object.
 * @class Dom
 * @static
 */
O.Dom = {
    /**
     * Get DOM element by id.
     * @method get
     * @param {String} id
     * @return {Node | null}
     */
    get: function(id) {
        return document.getElementById(id);
    },
    /**
     * Remove all children of passed node
     * @method clearNode
     * @param {Node} node
     */
    clearNode: function(node) {
        while(node.firstChild) {
            node.removeChild(node.firstChild);
        }
    },
    /**
     * Add class to the node.
     * @method addClass
     * @param {Node} node
     * @param {String} cls
     */
    addClass: function(node, cls) {
        if(!this.hasClass(node, cls)) {
            node.className = node.className + " " + cls;
        }
    },
    /**
     * Remove class from the node.
     * @method removeClass
     * @param {Node} node
     * @param {String} cls
     */
    removeClass: function(node, cls) {
        var regexp = new RegExp("(?:^| )" + cls + "(?:$| )"),
            classes = node.className.replace(regexp, " ");

        node.className = O.Utils.trim(classes);
    },
    /**
     * Check if node has set passed class.
     * @method hasClass
     * @param {Node} node
     * @param {String} cls
     * @return {Boolean}
     */
    hasClass: function(node, cls) {
        var regexp = new RegExp("(?:^| )" + cls + "(?:$| )");

        if(regexp.exec(node.className)) {
            return true;
        }

        return false;
    },
    /**
     * Insert node after node passed as 2nd argument.
     * @method insertAfter
     * @param {Node} node
     * @param {Node} referenceNode
     */
    insertAfter: function(node, referenceNode) {
        referenceNode.parentNode.insertBefore(node, referenceNode.nextSibling);
    }
};
