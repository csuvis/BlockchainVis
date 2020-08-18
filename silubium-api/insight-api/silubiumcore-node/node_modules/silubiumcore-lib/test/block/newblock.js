'use strict';

var bitcore = require('../..');
var BN = require('../../lib/crypto/bn');
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;
var BlockHeader = bitcore.BlockHeader;
var Block = bitcore.Block;
var chai = require('chai');
var fs = require('fs');
var should = chai.should();
var Transaction = bitcore.Transaction;

// https://test-insight.bitpay.com/block/000000000b99b16390660d79fcc138d2ad0c89a0d044c4201a02bdf1f61ffa11
var dataRawBlockBuffer = fs.readFileSync('test/data/blk86756-testnetnew.dat');
var dataRawBlockBinary = fs.readFileSync('test/data/blk86756-testnetnew.dat', 'binary');
var dataJson = fs.readFileSync('test/data/blk86756-testnet.json').toString();
var data = require('../data/blk86756-testnetnew');
var dataBlocks = require('../data/bitcoind/blocksnew');

var dataRawBlockBinary = fs.writeFileSync('test/data/blk86756-testnetnew.dat', new Buffer('00000020cca2653e81941d2bb260ad7d3e2e7444a8b6f0e15056ca59a93acf5aa4dc0450da4eb969df70e52b83c208d9884149e07266d900e950a2cbcd10f2f3e33c552f11aec258e02a151a00000000473045022100bccf26fd5802065355c85049f20df9e3ad7f713fa985da614934ed38e041273a02202a288cc7bf496bf5c83787b093a49e6908cee4603d7fea8a60f8664dedd7de4e0160019b7d8fdca81280acb9aea479b03f209ccd6b1870966ff9b10bfe3815a3650100000011aec25856e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b42156e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b4210201000000010000000000000000000000000000000000000000000000000000000000000000ffffffff04022f1100ffffffff010000000000000000000000000011aec258010000000160019b7d8fdca81280acb9aea479b03f209ccd6b1870966ff9b10bfe3815a365010000004847304402206991daaa22743a935d466bbf0e903dee4920af30a2e66f41e8a5ddb6513fc86502201af466ef6bcfc136c59412383e1fe93327e8945a571eaf33fc28e8f0fcf4f1bd01ffffffff0200000000000000000040b140fc03000000232103880cfc2a1578d3d1077d88a96dce5e06451f91a809793d5634df517370445c33ac0000000011aec258', 'hex'));


describe('Block', function() {
    var blockhex = data.blockhex;
    var blockbuf = new Buffer(blockhex, 'hex');
    var bh = BlockHeader.fromBuffer(new Buffer(data.blockheaderhex, 'hex'));
    var txs = [];

    it('should make a new block', function() {
        var b = Block(blockbuf);
        b.toBuffer().toString('hex').should.equal(blockhex);
    });

    it('should not make an empty block', function() {
        (function() {
            return new Block();
        }).should.throw('Unrecognized argument for Block');
    });

    describe('#constructor', function() {

        it('should set these known values', function() {
            var b = new Block({
                header: bh,
                transactions: txs
            });
            should.exist(b.header);
            should.exist(b.transactions);
        });

        it('should properly deserialize blocks', function() {
            dataBlocks.forEach(function(block) {
                var b = Block.fromBuffer(new Buffer(block.data, 'hex'));
                b.transactions.length.should.equal(block.transactions);
            });
        });

    });

    describe('#fromRawBlock', function() {

        it('should instantiate from a raw block binary', function() {
            var x = Block.fromRawBlock(dataRawBlockBinary);
            // x.header.version.should.equal(2);
            // new BN(x.header.bits).toString('hex').should.equal('1c3fffc0');
        });

        // it('should instantiate from raw block buffer', function() {
        //     var x = Block.fromRawBlock(dataRawBlockBuffer);
        //     x.header.version.should.equal(2);
        //     new BN(x.header.bits).toString('hex').should.equal('1c3fffc0');
        // });

    });
});