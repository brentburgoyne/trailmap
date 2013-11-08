(function(win) {
  'use strict';

  var updateListeners = []
    , Segment, Route, TrailMap
    , defaultGetUrl, updateOnHashChange, doUpdate;

  // Constructs a new segment object from a part string.
  Segment = function(part) {
    var matches = String(part).match(/^(\??)([a-z0-9_-]*)(:([a-z0-9_-]+))?$/i)
      , pattern;
    if (!matches) {
      throw new Error('Invalid route segment: ' + part);
    }
    this.optional = !!matches[1];
    this.prefix   = matches[2];
    this.param    = matches[4];
    pattern       = matches[2];
    if (this.param) {
      pattern += '([a-z0-9_-]+)';
    }
    this.re = new RegExp('^' + pattern + '$');
  };

  // Tests a string to see if it matches the segment. If it matches, any 
  // parameters will be extracted and added to the params object.
  Segment.prototype.test = function(part, params) {
    var matches = String(part).match(this.re);
    if (matches && params && this.param) {
      params[this.param] = matches[1];
    }
    return !!matches;
  };

  // Creates a URL string for the segment given a set of parameters.
  Segment.prototype.build = function(params) {
    var part = this.prefix;
    if (params && this.param && this.param in params) {
      part += params[this.param];
    }
    return part;
  };

  // Constructs a new route object with the given pattern and callback.
  Route = function(pattern, cb) {
    var _this     = this;
    this.segments = [];
    this.callback = cb;
    Route.split(pattern, function(part) {
      _this.segments.push(new Segment(part));
    });
  };

  // Returns an array of forward slash delimited parts from the given string.
  // If a callback is given, it will be called once for every part.
  Route.split = function(str, cb) {
    var parts = ((String(str).match(/^\/?(.*?)\/?$/)||[])[1]||'').split('/')
      , i     = -1
      , len   = parts.length;
    if (typeof cb === 'function') {
      while (++i < len) {
        cb(parts[i]);
      }
    }
    return parts;
  };

  // Tests a path to see if it maches all of the routes segments and collects 
  // parameter values from each matching segment.
  Route.prototype.test = function(path, params) {
    var _this = this
      , valid = true
      , i     = -1;
    Route.split(path, function(part) {
      var partValid = false;
      while (_this.segments[++i] && !partValid) {
        partValid = _this.segments[i].test(part, params);
        if (partValid) {
          i--;
        }
      }
      valid = valid && partValid;
    });
    return valid;
  };

  // Returns the path string for the route with the given params object.
  Route.prototype.path = function(params) {
    params = params || {};
    var parts = []
      , len   = this.segments.length
      , i     = -1;
    while (++i < len) {
      var segment = this.segments[i];
      if (segment.param) {
        if (params[segment.param] || !segment.optional) {
          parts.push(segment.prefix + String(params[segment.param]));
        }
      } else {
        parts.push(segment.prefix);
      }
    }
    return parts.join('/');
  };

  // Constructs a new TrailMap object. An optional cutrom getUrl function can be
  // given via the first argument. Passing true as the the second argument will
  // cause the router to not to automatically update on hash change.
  TrailMap = function(getUrlFunction, manualUpdate) {
    this.routes      = [];
    this.namedRoutes = {};
    this.matched     = false;
    this.args        = [];
    this.lastUrl     = null;
    this.getUrl      = getUrlFunction || defaultGetUrl;
    if (!manualUpdate) {
      updateOnHashChange(this);
    }
  };

  // Finds the first route that maches the url, and calls that routes callback
  // with the first argument being the params object. Any arguments given to 
  // update will be passed on the the callback.
  TrailMap.prototype.update = function() {
    this.matched  = false;
    this.args     = Array.prototype.slice.call(arguments, 0);
    var url       = this.getUrl()
      , len       = this.routes.length
      , i         = -1
      , route
      , params;
    while (++i < len) {
      params = {};
      if (this.routes[i].test(url, params)) {
        this.matched = true;
        this.args.unshift(params);
        this.routes[i].callback.apply(null, this.args);
        route = this.routes[i];
        break;
      }
    }
    return route;
  };

  // Add one or more routes in the format of name, pattern, callback. The three
  // required arguments can be repeated as many times as needed.
  TrailMap.prototype.route = function(name, pattern, callback) {
    var args  = Array.prototype.slice.call(arguments, 0)
      , count = Math.floor(args.length / 3)
      , i     = -1
      , route;
    while (++i < count) {
      route = new Route(args[3*i+1], args[3*i+2]);
      this.routes.push(route);
      this.namedRoutes[args[3*i]] = route;
    }
  };

  // Returns the URL for a named route with the given set of parameters.
  TrailMap.prototype.path = function(name, params) {
    return this.namedRoutes[name].path(params);
  };

  // Is win realy a browser window object?
  if (win.window !== win) {
    win = {};
  }

  // Function used to get the current URL if a custom is not passed to the
  // TrailMap constructor. Reads from window.location.hash. Also supperts 
  // hasbbang style urls.
  defaultGetUrl = function() {
    var hashMatch = win.location.hash.match(/^#!?(.*)/) || [];
    return hashMatch[1];
  };

  // Add trail map to update listener array, add event handler/timeout once the
  // first one is added.
  updateOnHashChange = function(listener) {
    updateListeners.push(listener);
    if (updateListeners.length === 1) {
      if ('onhashchange' in win) {
        win.onhashchange = doUpdate;
      } else {
        setTimeout(doUpdate, 100);
      }
    }
  };

  // Loops over all listening trail maps and update if the route has changed.
  doUpdate = function() {
    var i   = -1
      , len = updateListeners.length
      , router, url;
    while (++i < len) {
      router = updateListeners[i];
      url    = router.getUrl();
      if (router.lastUrl !== url) {
        router.update();
        router.lastUrl = url;
      }
    }
  };

  // Add route and segments constructors as properties of TrailMap so they will
  // be exported.
  TrailMap.Route   = Route;
  TrailMap.Segment = Segment;

  // Define a AMD module if supported
  if (typeof define === 'function' && define.amd) {
    define([], function() { return TrailMap; });
  // Export a module if in node.js
  } else if (typeof module === 'object' && module.exports) {
    module.exports = TrailMap;
  // Otherwise add to window
  } else {
    win.TrailMap = TrailMap;
  }

}(this));

