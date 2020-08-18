'use strict';

var should = require('chai').should();

describe('Index Exports', function() {
  it('will export silubiumcore-lib', function() {
    var silubiumcore = require('../');
    should.exist(silubiumcore.lib);
    should.exist(silubiumcore.lib.Transaction);
    should.exist(silubiumcore.lib.Block);
  });
});
