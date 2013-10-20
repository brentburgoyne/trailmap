/*jshint expr:true */
/*global describe:true,it:true */
'use strict';

var expect   = require('expect.js')
  , TrailMap = require('../trailmap')
  , Route    = TrailMap.Route
  , Segment  = TrailMap.Segment;

describe('Route', function() {

  var patterns = {
    '/': 1,
    'test/foo': 2,
    'test/:foo/?bar-:baz': 3
  };

  it (
    'should have an array of Segment elments of the correct length',
    function() {
      Object.keys(patterns).forEach(function(pattern) {
        var route = new Route(pattern);
        expect(route.segments).to.have.length(patterns[pattern]);
        route.segments.forEach(function(segment) {
          expect(segment).to.be.a(Segment);
        });
      });
    }
  );

  it(
    'should set function from second constructor argument to this.callback',
    function() {
      var cb    = function() {}
        , route = new Route('', cb);
      expect(route.callback).to.be(cb);
    }
  );

  describe('split method', function() {

    it(
      'should return an array of parts split by a forward slash',
      function() {
        Object.keys(patterns).forEach(function(pattern) {
          var parts = Route.split(pattern);
          expect(parts).to.have.length(patterns[pattern]);
        });
      }
    );

    it(
      'should call the optional callback with each part',
      function() {
        Object.keys(patterns).forEach(function(pattern) {
          var cbCount = 0;
          Route.split(pattern, function() {
            cbCount++;
          });
          expect(cbCount).to.be(patterns[pattern]);
        });
      }
    );

  });

});
