/*jshint expr:true */
/*global describe:true,it:true,beforeEach:true */
'use strict';

var expect    = require('expect.js')
  , TrailMap  = require('../trailmap')
  , _         = require('underscore');

describe('TrailMap', function() {
  
  var router
    , currentUrl
    , dummyHandler;

  dummyHandler = function() { dummyHandler.callCount++; };
  dummyHandler.callCount = 0;

  beforeEach(function() {
    currentUrl = '';
    router = new TrailMap(
      function() { return currentUrl; },
      true // use manual update for testing
    );
  });
  
  describe('route prototype method', function() {
  
    it(
      'should be able to add a single route',
      function() {
        router.route('foo', 'bar/baz', dummyHandler);
        expect(router.namedRoutes.foo).to.be.a(TrailMap.Route);
      }
    );

    it(
      'should be able to add multiple routes at once',
      function() {
        router.route(
          'foo', 'test/foo', dummyHandler,
          'bar', 'test/bar', dummyHandler,
          'baz', 'test/baz', dummyHandler
        );
        expect(router.routes).to.have.length(3);
        _(router.routes).each(function(route) {
          expect(route).to.be.a(TrailMap.Route);
        });
      }
    );
  
  });

  describe('path prototype method', function() {
    
    it(
      'should call the path method of the route for the given name',
      function() {
        var pattern = 'bar/bar/:baz'
          , params  = { baz: 'test' }
          , route   = new TrailMap.Route(pattern);
        router.route('foo', pattern, dummyHandler);
        expect(router.path('foo', params)).to.be(route.path(params));
      }
    );

  });

  describe('update prototype method', function() {
    
    it(
      'should select the first route that matches the url',
      function() {
        router.route(
          'root',  '/',        dummyHandler,
          'foo',   'foo',      dummyHandler,
          'bar',   'foo/bar',  dummyHandler
        );
        _(router.routes).each(function(route) {
          currentUrl = _(route.segments).pluck('prefix').join('/');
          var matched = router.update();
          expect(matched).to.be(route);
        });
      }
    );

  });

});
