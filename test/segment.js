/*jshint expr:true */
/*global describe:true,it:true */
'use strict';

var expect = require('expect.js')
  , Segment  = require('../trailmap').Segment;

describe('Segment', function() {
  it(
    'should be optional only if part begins with a question mark', 
    function() {
      var seg1 = new Segment('?test')
        , seg2 = new Segment('test');
      expect(seg1.optional).to.be(true);
      expect(seg2.optional).to.be(false);
    }
  );
  it(
    'should base param name on string after the colon', 
    function() {
      var seg1 = new Segment('?test:param')
        , seg2 = new Segment(':test')
        , seg3 = new Segment('test');
      expect(seg1.param).to.be('param');
      expect(seg2.param).to.equal('test');
      expect(seg3.param).to.be.an('undefined');
    }
  );
  it(
    'should get prefix from the string before :param and after ?', 
    function() {
      var seg1 = new Segment('?prefix:param')
        , seg2 = new Segment('prefix');
      expect(seg1.prefix).to.be('prefix');
      expect(seg2.prefix).to.be('prefix');
    }
  );

  it(
    'should throw an Error when part contains invalid characters',
    function() {
      var invalidParts = [
        'includes space',
        '$pecial-characters',
        '+foo',
        '&asdfa',
        'asdf?'
      ];
      invalidParts.forEach(function(part) {
        expect(function(){
          var seg = new Segment(part); 
        }).to.throwError(function(err) {
          expect(err).to.be.a(Error);
        });
      });
    }
  );

  describe('test method', function() {
    
    it(
      'should match segments without parameters',
      function() {
        var seg = new Segment('test');
        expect(seg.test('test')).to.be(true);
        expect(seg.test('foo')).to.be(false);
      }
    );

    it(
      'should match segments with a param and extract param value',
      function() {
        var seg1    = new Segment(':test1')
          , seg2    = new Segment('prefix-:test2')
          , params = {};
        expect(seg1.test('param1', params)).to.be(true);
        expect(seg2.test('prefix-param2', params)).to.be(true);
        expect(params).to.have.property('test1', 'param1');
        expect(params).to.have.property('test2', 'param2');
      }
    );

  });

  describe('build method', function() {
    
    it(
      'should return the prefix for segements without a param',
      function() {
        var prefix = 'test'
          , seg    = new Segment(prefix);
        expect(seg.build()).to.be(prefix);
      }
    );

    it(
      'should return the param for param-only segments',
      function() {
        var params = { foo: 'test' }
          , seg    = new Segment(':foo');
        expect(seg.build(params)).to.be(params.foo);
      }
    );

    it(
      'should return the combined prefix and param for segments with both',
      function() {
        var prefix = 'test-'
          , params = { foo: 'bar' }
          , seg    = new Segment(prefix + ':foo');
        expect(seg.build(params)).to.be(prefix + params.foo);
      }
    );

  });
});
