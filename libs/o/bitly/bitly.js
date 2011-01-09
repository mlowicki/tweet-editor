
O.Bitly = function() {
    var cache = {},
        apiKey,
        login;

    return {
        init: function(l, key) {
            login = l;
            apiKey = key;
        },
        shorten: function(url, onSuccess, onFailure) {
            if(cache[url]) {
                return cache[url];
            }

            new O.IO.Req({
                url: 'http://api.bit.ly/v3/shorten?login=' + login +
                    '&apiKey=' + apiKey + '&longUrl=' +
                    encodeURIComponent(url) + '&format=json',
                method: O.IO.Req.GET,
                onSuccess: {
                    fn: function(req) {
                        try{
                            var respData = JSON.parse(req.responseText);
                        } catch(e) {
                            onFailure.fn.call(onFailure.scope, req);
                        }

                        if(respData.status_code === 200) {
                            onSuccess.fn.call(onSuccess.scope,
                                respData.data.url, respData.data.long_url);
                        }
                        else {
                            onFailure.fn.call(onFailure.scope,
                                respData.status_txt);
                        }
                    }
                },
                onFailure: {
                    fn: function(req) {
                        onFailure.fn.call(onFailure.scope, req.responseText);
                    }
                }
            });
        }
    };
}();
