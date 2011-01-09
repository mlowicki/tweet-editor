/**
 * Event utilities.
 * @module event
 */


/**
 * Module's main object.
 * @class Event
 * @static
 */
O.Event = {};


/** 
 * Observer class.
 * @class Observer
 * @constructor
 */
O.Event.Observer = function() {
    this._listeners = {};
}

O.Event.Observer.prototype = {
    // fix constructor property.
    constructor: O.Event.Observer,
    /**
     * Add new event listener.
     * @method addListner
     * @param {String} type
     * @param {Object} listener
     */
    addListener: function(type, listener){
        if(typeof this._listeners[type] == "undefined"){
            this._listeners[type] = [];
        }

        this._listeners[type].push(listener);
    },
    /**
     * Fire all callbacks for passed event.
     * @method fire
     * @param {String} type
     * @param {Array} params
     */
    fire: function(type, params){
        var event = {
            type: type,
            target: this
        };

        if (this._listeners[event.type] instanceof Array){
            var listeners = this._listeners[event.type];

            for (var i=0, len=listeners.length; i < len; i++){
                listeners[i].fn.apply(listeners[i].scope, [event].concat(params));
            }
        }
    },
    /**
     * Remove listener for the event.
     * @method removeListner
     * @param {String} type
     * @param {Object} listener
     */
    removeListener: function(type, listener){
        if(this._listeners[type] instanceof Array) {
            var listeners = this._listeners[type];

            for(var i=0, len=listeners.length; i < len; i++) {
                if(listeners[i] === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }
};
