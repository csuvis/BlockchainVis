'use strict';

/* jshint unused: false */
/* jshint latedef: false */
var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');
var sinon = require('sinon');

var bitcore = require('../..');
var BN = bitcore.crypto.BN;
var Transaction = bitcore.Transaction;
var Input = bitcore.Transaction.Input;
var Output = bitcore.Transaction.Output;
var PrivateKey = bitcore.PrivateKey;
var Script = bitcore.Script;
var Address = bitcore.Address;
var Networks = bitcore.Networks;
var Opcode = bitcore.Opcode;
var errors = bitcore.errors;

var transactionVector = require('../data/tx_creation');

describe('Transaction', function() {

    it('should serialize and deserialize correctly a given transaction', function() {
        var tr = new Transaction();
        tr.fromString('020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff0402a95900ffffffff020000000000000000000000000000000000266a24aa21a9ed598bdca4eab6001d5753ba33e9a50b1986649f4b477948b5f761decd6b742b4e0120000000000000000000000000000000000000000000000000000000000000000000000000');
        tr.toString().should.equal('020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff0402a95900ffffffff020000000000000000000000000000000000266a24aa21a9ed598bdca4eab6001d5753ba33e9a50b1986649f4b477948b5f761decd6b742b4e0120000000000000000000000000000000000000000000000000000000000000000000000000');
    });

    it('should get correct hash', function() {
        var tr = new Transaction();
        tr.fromString('020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff0402a95900ffffffff020000000000000000000000000000000000266a24aa21a9ed598bdca4eab6001d5753ba33e9a50b1986649f4b477948b5f761decd6b742b4e0120000000000000000000000000000000000000000000000000000000000000000000000000');
        tr.hash.should.equal('dda8ee7794dd38c1789b5583ae0324f5e5e4cb5f84a4746f180b7eb080323e5a');
    });

});