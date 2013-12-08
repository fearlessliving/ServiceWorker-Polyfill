var fs = require('fs');
var mime = require('mime');
var urlLib = require('url');
var _networkRequest = require('request');
var Promise = require('promise');
var Response = require('./Response');
var NetworkError = require('./NetworkError');
var SameOriginResponse = require('./SameOriginResponse');

module.exports = _Requester;

function _Requester(request) {
    var url = urlLib.parse(request.url);
    var promise;
    if (url.hostname) {
        promise = this.networkRequest(request);
    } else {
        promise = this.fileSystemRequest(request);
    }
    return promise.then(function (response) {
        return response;
    }, function (why) {
        throw why;
    });
}

_Requester.prototype.networkRequest = function (request) {
    return new Promise(function (resolve, reject) {
        _networkRequest(request, function (err, response) {
            if (err) {
                return reject(err);
            }
            var response = new Response(response);
            if (response.statusCode >= 400) {
                return reject(new NetworkError(response.statusCode));
            }
            resolve(response);
        });
    });
};

_Requester.prototype.fileSystemRequest = function (request) {
    return new Promise(function (resolve, reject) {
        fs.readFile(request.url, { encoding: 'utf-8' }, function (err, contents) {
            if (err) {
                return reject(err);
            }
            resolve(new SameOriginResponse({
                statusCode: 200,
                method: 'GET',
                headers: {
                    'Content-Type': mime.lookup(request.url)
                },
                body: contents
            }));
        });
    });
};