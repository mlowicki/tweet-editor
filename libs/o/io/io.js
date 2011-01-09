/**
 * I/O utilities.
 * @module io
 */


/**
 * Module's main object.
 * @class IO
 * @static
 */
O.IO = {
    /**
     * Read and return content of the local widget's file.
     * @method readLocalFile
     * @param {String} path
     * @return {String}
     */
    readLocalFile: function(path) {
        var content;

        new O.IO.Req({
            url: path,
            onSuccess: {
                fn: function(xhr) {
                    content = xhr.responseText;
                }
            },
            sync: false
        });

        return content;
    }
};


/**
 * Ajax request class.
 * @class Req
 * @constructor
 */
O.IO.Req = function(o) {
    this._url = o.url;
    this._onSuccess = o.onSuccess;
    this._onFailure = o.onFailure;
    this._data = o.data;
    this._sync = typeof o.sync === "boolean" ? o.sync : true;
    this._headers = o.headers || [];
    this._method = o.method || "GET";

    this._req = new XMLHttpRequest();
    this._req.open(this._method, this._url, this._sync);
    //req.setRequestHeader("User-Agent", "XMLHTTP/1.0");

    if(this._method === "POST") {
        this._req.setRequestHeader("Content-type",
            "application/x-www-form-urlencoded");
    }

    var that = this;
    this._headers.forEach(function(header) {
        that._req.setRequestHeader(header.name, header.val);
    });

    this._req.onreadystatechange = function () {
        if (this.readyState != 4) { return };

        if (this.status != 200 && this.status != 304 && this.status != 0) {
            that._onFailure.fn.call(that._onFailure.scope, this);
            return;
        }

        that._onSuccess.fn.call(that._onSuccess.scope, this);
    };

    if(this._req.readyState == 4) { return; }

    this._req.send(this._data);
};

/**
 * @property GET
 * @type {String}
 * @static
 */
O.IO.Req.GET = "GET";

/**
 * @property POST
 * @type {String}
 * @static
 */
O.IO.Req.POST = "POST";

/**
 * O.IO.Req prototype
 */
O.IO.Req.prototype = {
    //fix constructor
    constructor: O.IO.Req,
    
    abort: function(){
        this._req.abort();
    }
}

/**
 * Storage manager.
 * @class Storage
 * @private
 */
O.IO.Storage = function() {

    return {
        /**
         * Get value for key.
         * @method get
         * @param {String} key
         * @return {String | undefined}
         */
        get: function(key) {
            var val = widget.preferenceForKey(key);

            if(val === "") {
                return undefined;
            }

            return val;
        },
        /**
         * Set value for key.
         * @method set
         * @param {String} key
         * @param {String} val
         */
        set: function(key, val) {
            widget.setPreferenceForKey(val, key);
        },
        /**
         * Delete value for key.
         * @method del
         * @param {String} key
         */
        del: function(key) {
            this.set(key, null);
        }
    };
}(); 
