/**
 * Useful generic tools.
 * @module utils
 */


/**
 * Module's object.
 * @class Utils
 * @static
 */
O.Utils = {
    /**
     * Remove whitespaces from the begin and end of string.
     * @method trim
     * @param {String} str
     * @return {String}
     */
    trim: function(str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
};
