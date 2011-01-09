/**
 * The O module.
 * @module o
 */


/**
 * The Opera global namespace object.
 * @class O
 * @static
 */
var O = {
    /**
     * @property DESKTOP
     * @type {String}
     */
    DESKTOP: "desktop",
    /**
     * @property MOBILE
     * @type {String}
     */
    MOBILE: "mobile",
    /**
     * @property _BROWSER_VERSION_REGEXP
     * @type {RegExp}
     */
    _BROWSER_VERSION_REGEXP: /Version\/([\d.]*)/,
    /**
     * Returns Opera's version.
     * @method browserVersion
     * @return {Number}
     */
    browserVersion: function() {
        this._browserVersion = parseFloat(
                this._BROWSER_VERSION_REGEXP.exec(navigator.userAgent)[1]);

        this.browserVersion = function() {
            return this._browserVersion;
        };

        return this._browserVersion;
    },
    /**
     * Returns type of media. 
     * @method getMedia
     * @return {String}
     */
    getMedia: function() {
        var ua = navigator.userAgent;

        this._media = (screen.width + screen.height <= 1400 ||
            ua.indexOf("Symbian") != -1 || ua.indexOf("Smartphone") != -1) ?
                this.MOBILE : this.DESKTOP;

        this.getMedia = function() {
            return this._media;
        };

        return this._media;
    }
};
