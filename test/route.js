/*jshint expr:true */
/*global describe:true,it:true */
'use strict';

var expect   = require('expect.js')
  , TrailMap = require('../trailmap')
  , Route    = TrailMap.Route
  , Segment  = TrailMap.Segment
  , _        = require('underscore');

describe('Route', function() {

  var patterns = {
    '/': 1,
    'test/foo': 2,
    'test/:foo/?bar-:baz': 3
  };

  var cases = [
    {
      pattern: '/',
      length:  1,
      params:  {},
      path:    ''
    },
    {
      pattern: 'test/foo/',
      length:  2,
      params:  {},
      path:    'test/foo'
    },
    {
      pattern: 'test/:foo/?bar-:baz',
      length:  3,
      params:  { foo: 'test1', baz: 'test2' },
      path:    'test/test1/bar-test2'
    }
  ];

  var optionalCases = [
    {
      pattern: 'test/?optional/after',
      params:  {},
      path:    'test/optional/after'
    },
    {
      pattern: 'test/?category-:category/?page-:page',
      params:  { page: 1 },
      path:    'test/page-1'
    },
    {
      pattern: 'test/:foo/?page-:page',
      params:  { foo: 'bar' },
      path:    'test/bar'
    }
  ];
  
  it (
    'should have an array of Segment elments of the correct length',
    function() {
      _(patterns).each(function(length, pattern) {
        var route = new Route(pattern);
        expect(route.segments).to.have.length(length);
        _(route.segments).each(function(segment) {
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
        _(patterns).each(function(length, pattern) {
          var parts = Route.split(pattern);
          expect(parts).to.have.length(length);
        });
      }
    );

    it(
      'should call the optional callback with each part',
      function() {
        _(patterns).each(function(length, pattern) {
          var cbCount = 0;
          Route.split(pattern, function() {
            cbCount++;
          });
          expect(cbCount).to.be(length);
        });
      }
    );

  });

  describe('test prototype method', function(){

    var doCaseTest = function(testCase) {
      var route = new Route(testCase.pattern)
        , params = {};
      expect(route.test(testCase.path, params)).to.be(true);
      expect(params).to.eql(testCase.params);
    };
    
    it(
      'should return true only if all segments are matched',
      function() {
        _(cases).each(doCaseTest);
      }
    );

    it(
      'should skip over optional segments that do not match',
      function() {
        _(optionalCases).each(doCaseTest);
      }
    );

    it(
      'should return false if the path has extra segments at the end',
      function() {
        var route = new Route('foo');
        expect(route.test('foo/bar')).to.be(false);
      }
    );

  });

  describe('path prototype method', function() {
  
    it(
      'should build the correct path for a given set of params',
      function() {
        _.chain(cases).union(optionalCases).each(function(testCase) {
          var route = new Route(testCase.pattern);
          expect(route.path(testCase.params)).to.be(testCase.path);
        });
      }
    );
  
  });

});
