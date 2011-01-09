/**
 * Twitter API utilities.
 * @module twitter
 * @requires io
 * @requires OAuth library
 * @requires sha1 library
 */


/**
 * Module's main object.
 * @class Twitter
 * @static
 */
O.Twitter = function() {
    /**
     * @property consumerKey
     * @type {String}
     * @private
     */
    var consumerKey,
        /**
         * @property consumerSecret
         * @type {String}
         * @private
         */
        consumerSecret,
        /**
         * @property accessToken
         * @type {String}
         * @private
         */
        accessToken,
        /**
         * @property accessTokenSecret
         * @type {String}
         * @private
         */
        accessTokenSecret,
        /**
         * User name of the authorized user.
         * @property username
         * @type {String}
         * @private
         */
        username,
        /**
         * Authorization method. Right now only xAuth is supported.
         * @property authMethod
         * @type {String}
         * @private
         */
        authMethod,
        /**
         * @property accessTokenURL
         * @type {String}
         * @private
         */
        accessTokenURL = 'https://api.twitter.com/oauth/access_token',
        /**
         * @property cache
         * @type {Object}
         * @private
         */
        cache = {},
        /**
         * @property API_VERSION
         * @type {Number}
         * @private
         */
        API_VERSION = 1;

    /**
     * Function for generic data request.
     * @method makeRequest
     * @private
     * @param {String} method       - O.IO.Req.GET or O.IO.Req.POST 
     * @param {String} action       - url of the resource
     * @param {Array} parameters    - list of parameters for request
     * @param {Object} onSuccess    - success callback
     * @param {Object} onFailure    - failure callback
     */
    function makeRequest(method, action, parameters, onSuccess, onFailure) {
        var message = {
            method: method,
            action: action,
            parameters: []
        };

        parameters.forEach(function(parameter) {
            message.parameters.push([parameter.name, parameter.value]);
        });

        var body = OAuth.formEncode(message.parameters);

        var o = {
            consumerKey: consumerKey,
            consumerSecret: consumerSecret,
            token: accessToken,
            tokenSecret: accessTokenSecret
        };

        OAuth.completeRequest(message, o);

        var authHeader = OAuth.getAuthorizationHeader('https://twitter.com/',
                                                        message.parameters);
        return new O.IO.Req({
            url: action + '?' + body,
            method: method,
            headers: [{
                name: 'Authorization',
                val: authHeader
            }],
            onSuccess: {
                fn: function(req) {
                    try{
                        var respJSON = JSON.parse(req.responseText);
                        onSuccess.fn.call(onSuccess.scope, req, respJSON);
                    } catch(e) {
                        onFailure.fn.call(onFailure.scope, req, e);
                    }
                }
            },
            onFailure: {
                fn: function(req) {
                    try{
                        var respJSON = JSON.parse(req.responseText);
                        onFailure.fn.call(onFailure.scope, req, respJSON);
                    } catch(e) {
                        onFailure.fn.call(onFailure.scope, req);
                    }
                }
            }});
    }

    /**
     * Get access token from the server
     * @method getAccessToken
     * @private
     * @param {String} username
     * @param {String} password
     * @param {Object} onSuccess    - success callback
     * @param {Object} onFailure    - failure callback
     */
    function getAccessToken(username, password, onSuccess, onFailure) {
        // Encode data.
        username = OAuth.percentEncode(username);
        password = OAuth.percentEncode(password);

        var timestamp = Math.round((new Date()).getTime() / 1000),
            nonce = Math.random();

        var accessToken = 'oauth_consumer_key=' + consumerKey +
            '&oauth_nonce=' + nonce +
            '&oauth_signature_method=HMAC-SHA1' +
            '&oauth_timestamp=' + timestamp +
            '&oauth_version=1.0' +
            '&x_auth_mode=client_auth' +
            '&x_auth_password=' + password +
            '&x_auth_username=' +username;

        var baseString = 'POST&' + OAuth.percentEncode(accessTokenURL) + '&' +
                            OAuth.percentEncode(accessToken);

        var signature = OAuth.percentEncode(b64_hmac_sha1(consumerSecret +
                            '&', baseString) + '=');

        var authHeader = 'OAuth oauth_nonce="' + nonce + '", ' +
            'oauth_signature_method="HMAC-SHA1", ' +
            'oauth_timestamp="' + timestamp + '", ' +
            'oauth_consumer_key="' + consumerKey + '", ' +
            'oauth_signature="' + signature + '", ' +
            'oauth_version="1.0"';

        new O.IO.Req({
            url: accessTokenURL,
            method: 'POST',
            data: 'x_auth_username=' + username + '&x_auth_password=' +
                                password + '&x_auth_mode=client_auth',
            headers: [{
                name: 'Authorization',
                val: authHeader
            }],
            onSuccess: {
                fn: function(req) {
                    var data = {};

                    req.responseText.split('&').forEach(function(item) {
                        var parts = item.split('=');

                        switch(parts[0]) {
                            case 'oauth_token':
                                data.token = parts[1];
                                break;
                            case 'oauth_token_secret':
                                data.secret = parts[1];
                                break;
                            case 'user_id':
                                data.userID = parts[1];
                                break;
                            case 'screen_name':
                                data.screenName = parts[1];
                                break;
                            default:
                                break;
                        }
                    });

                    onSuccess.fn.call(onSuccess.scope, data);
                }
            },
            onFailure: {
                fn: function(req) {
                    onFailure.fn.call(onFailure.scope, req);
                }
            }});
    }

    /**
     * Save user's credentials in widget's storage.
     * @method saiveCredentials
     * @private
     */
    function saveCredentials() {
        O.IO.Storage.set('oTwitterAccessToken', accessToken);
        O.IO.Storage.set('oTwitterAccessTokenSecret', accessTokenSecret);
        O.IO.Storage.set('oTwitterUsername', username);
    }

    /**
     * Load user's credentials from widget's storage.
     * @method loadCredentials
     * @private
     */
    function loadCredentials() {
        accessToken = O.IO.Storage.get('oTwitterAccessToken');
        accessTokenSecret = O.IO.Storage.get('oTwitterAccessTokenSecret');
        username = O.IO.Storage.get('oTwitterUsername');
    }

    return {
        /**
         * Max length of status.
         * @property MAX_CHARS
         * @type {Number}
         */
        MAX_CHARS: 140,
        /**
         * XAuth authorization method.
         * http://dev.twitter.com/pages/xauth
         * @property METHOD_X_AUTH
         * @type {String}
         */
        METHOD_X_AUTH: 'xAuth',
        /**
         * Initialize manager.
         * @method init
         * @param {String} method
         * @param {String} key
         * @param {String} secret
         */
        init: function(method, key, secret) {
            if(method !== this.METHOD_X_AUTH) {
                throw new Error('Only xAuth is supported now');
            }

            authMethod = method;
            consumerKey = key;
            consumerSecret = secret;

            loadCredentials();
        },
        /**
         * Clear user's credentials.
         * @method clearCredentials
         */
        clearCredentials: function() {
            accessToken = undefined;
            accessTokenSecret = undefined;
            username = undefined;

            saveCredentials();
        },
        /**
         * Return true is user is logged and false otherwise.
         * @method isLogged
         * @return {Boolean}
         */
        isLogged: function() {
            return accessToken && accessTokenSecret;
        },
        /**
         * Log in user with passed credentials.
         * @method logIn
         * @param {String} un           - username
         * @param {String} password     - 
         * @param {Object} onSuccess    - success callback
         * @param {Object} onFailure    - failure callback
         */
        logIn: function(un, password, onSuccess, onFailure) {
            getAccessToken(
                un,
                password,
                { // On success.
                    fn: function(data) {
                        accessToken = data.token;
                        accessTokenSecret = data.secret;
                        username = data.screenName;
                        saveCredentials();

                        onSuccess.fn.call(onSuccess.scope);
                    }
                },{ // On failure.
                    fn: function(req) {
                        onFailure.fn.call(onFailure.scope, req.responseText);
                    }
                });
        },
        /**
         * Return name of the authorized user.
         * @method getUsername
         * @return {String}
         */
        getUsername: function() {
            return username;
        },
        /**
         * Return info about user.
         * @method getUserInfo
         * @param {String} username         -
         * @param {Object} onSucces         - success callback
         * @param {Object} onFailure        - failure callback
         * @param {Boolean} readFromCache   - try to get data from cache
         * @return O.IO.Req
         */
        getUserInfo: function(username, onSuccess, onFailure, readFromCache) {
            if(readFromCache && cache['userInfo']) {
                onSuccess.fn.call(onSuccess.scope, cache['userInfo']);
            }
            else {
                return makeRequest(
                    O.IO.Req.GET,
                    'http://api.twitter.com/' + API_VERSION +
                        '/users/show.json',
                    [
                        { name: 'screen_name', value: username }
                    ],
                    { // On success
                        fn: function(req, respJSON) {
                            cache['userInfo'] = respJSON;

                            onSuccess.fn.call(onSuccess.scope, req, respJSON);
                        }
                    },
                    onFailure
                );
            }
        },
        
        /**
         * Returns the most recent statuses posted by the user
         * identified by screenName.
         * @method getUserTimeline
         * @param {Object} cfg
         * @return O.IO.Req
         */
        getUserTimeline: function(screenName, onSuccess, onFailure) {
            var parameters = [];
            
            parameters.push({
                name: 'screen_name',
                value: screenName
            });

            return makeRequest(
                O.IO.Req.GET,
                'http://api.twitter.com/' + API_VERSION +
                    '/statuses/user_timeline.json',
                parameters,
                onSuccess,
                onFailure
            );
        },
        
        /**
         * Returns the most recent statuses posted by the 
         * autheticated user's friends.
         * @method getFriendsTimeline
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getFriendsTimeline: function(onSuccess, onFailure) {
            return makeRequest(
                O.IO.Req.GET,
                'http://api.twitter.com/' + API_VERSION +
                    '/statuses/friends_timeline.json',
                [],
                onSuccess,
                onFailure
            );
        },
        
        /**
         * Returns the most recent statuses posted by the 
         * autheticated user and his friends.
         * @method getHomeTimeline
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getHomeTimeline: function(parameters,onSuccess, onFailure) {
            
            parameters = parameters || []
            
            return makeRequest(
                O.IO.Req.GET,
                'http://api.twitter.com/' + API_VERSION +
                    '/statuses/home_timeline.json',
                parameters,
                onSuccess,
                onFailure
            );
        },
        /**
         * Get lists followed by specified user.
         * @method getFollowedLists
         * @param {String} username
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getFollowedLists: function(username, onSuccess, onFailure) {
            return makeRequest(
                O.IO.Req.GET,
                'http://api.twitter.com/' + API_VERSION + '/' + username +
                    '/lists/subscriptions.json',
                [],
                onSuccess,
                onFailure
            );
        },
        /**
         * Get lists the specified user has been added to.
         * @method getLists
         * @param {String} username
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getLists: function(username, onSuccess, onFailure) {
            return makeRequest(
                O.IO.Req.GET,
                'http://api.twitter.com/' + API_VERSION + '/' + username +
                    '/lists/memberships.json',
                [],
                onSuccess,
                onFailure
            );
        },
        
        /**
         * retrives the most recent mentions
         * (tweets with @username of current user)
         * @method getMentions
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getMentions: function(parameters,onSuccess, onFailure) {
            
            parameters = parameters || []
            
            return makeRequest(
                O.IO.Req.GET,
                "http://api.twitter.com/" + API_VERSION +
                    "/statuses/mentions.json",
                parameters,
                onSuccess,
                onFailure
            );
        },
        
        /**
         * retrives RECEIVED direct messages
         * @method getDirectMessages
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getDirectMessages: function(parameters,onSuccess, onFailure) {
            
            parameters = parameters || []
            
            return makeRequest(
                O.IO.Req.GET,
                "http://api.twitter.com/" + API_VERSION +
                    "/direct_messages.json",
                parameters,
                onSuccess,
                onFailure
            );
        },
        
        /**
         * retrives SENT direct messages
         * @method getSentDirectMessages
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getSentDirectMessages: function(parameters,onSuccess, onFailure) {
            
            parameters = parameters || []
            
            return makeRequest(
                O.IO.Req.GET,
                "http://api.twitter.com/" + API_VERSION +
                    "/direct_messages/sent.json",
                parameters,
                onSuccess,
                onFailure
            );
        },
        
        /**
         * Sends message to specified recipient identified by screen_name
         * @method sendDirectMessage
         * @param {String} recipient
         * @param {String} text
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        sendDirectMessage: function(recipient, text, onSuccess, onFailure) {
            
            var parameters = [
                {name:'screen_name', value: recipient},
                {name:'text', value: text},
            ];
            
            return makeRequest(
                O.IO.Req.POST,
                "http://api.twitter.com/" + API_VERSION +
                    "/direct_messages/new.json",
                parameters,
                onSuccess,
                onFailure
            );
        },
        
        /**
         * Performs search and founded tweets
         * @method search
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        search: function(parameters,onSuccess, onFailure) {
            
            parameters = parameters || []
            
            return makeRequest(
                O.IO.Req.GET,
                "http://search.twitter.com/search.json",
                parameters,
                onSuccess,
                onFailure
            );
        },
        
        /**
         * Retrives profile, by screen_name
         * @method sendDirectMessage
         * @param {String} screenName
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getUser: function(screenName, onSuccess, onFailure){
            
            var parameters = [
                {name: 'screen_name', value: screenName}
            ];
            
            return makeRequest(
                O.IO.Req.GET,
                "http://api.twitter.com/" + API_VERSION +
                    "/users/show.json",
                parameters,
                onSuccess,
                onFailure
            );
        },
        
        /**
         * Retrives Saved Searches, by screen_name
         * @method getSavedSearches
         * @param {Object} onSuccess
         * @param {Object} onFailure
         * @return O.IO.Req
         */
        getSavedSearches: function(onSuccess, onFailure){
            
            return makeRequest(
                O.IO.Req.GET,
                "http://api.twitter.com/" + API_VERSION +
                    "/saved_searches.json",
                [],
                onSuccess,
                onFailure
            );
        }
    };
}();
