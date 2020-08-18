var should = require('chai').should();
var bitcore = require('../..');
var BufferUtil = bitcore.util.buffer;
var BlockHeader = bitcore.BlockHeader;
var dataPow = require('../data/silubium/block-pow');
var dataPos = require('../data/silubium/block-pos');
var bhhexPow = dataPow.blockheaderhex;
var hashPow = dataPow.hash;
var bhhexPos = dataPos.blockheaderhex;
var hashPos = dataPos.hash;
var bhbufPow = new Buffer(bhhexPow, 'hex');
var bhbufPos = new Buffer(bhhexPos, 'hex');


var data = {
    POS: {
        bhbuf: new Buffer(bhhexPos, 'hex'),
        bhhex: dataPos.blockheaderhex,
        hash: dataPos.hash,
        version: dataPos.version,
        prevblockidhex: dataPos.prevblockidhex,
        merkleroothex: dataPos.merkleroothex,
        time: dataPos.time,
        bits: dataPos.bits,
        nonce: dataPos.nonce,
        hashStateRoot: dataPos.hashStateRoot,
        hashUTXORoot: dataPos.hashUTXORoot,
        prevOutStakeHash: dataPos.prevOutStakeHash,
        prevOutStakeN: dataPos.prevOutStakeN,
        vchBlockSig: dataPos.signature
    },
    POW: {
        bhbuf: new Buffer(bhhexPow, 'hex'),
        bhhex: dataPow.blockheaderhex,
        hash: dataPow.hash,
        version: dataPow.version,
        prevblockidhex: dataPow.prevblockidhex,
        merkleroothex: dataPow.merkleroothex,
        time: dataPow.time,
        bits: dataPow.bits,
        nonce: dataPow.nonce,
        hashStateRoot: dataPow.hashStateRoot,
        hashUTXORoot: dataPow.hashUTXORoot,
        prevOutStakeHash: dataPow.prevOutStakeHash,
        prevOutStakeN: dataPow.prevOutStakeN,
        vchBlockSig: dataPow.signature

    }
};

describe('BlockHeader', function() {

    ['POW', 'POS'].forEach(function (type) {

        var bhbuf = data[type].bhbuf;
        var bhhex = data[type].bhhex;
        var hash = data[type].hash;
        var version = data[type].version;
        var prevblockidhex = data[type].prevblockidhex;
        var merkleroothex = data[type].merkleroothex;
        var prevblockidbuf = new Buffer(prevblockidhex, 'hex');
        var merklerootbuf = new Buffer(merkleroothex, 'hex');
        var time = data[type].time;
        var bits = data[type].bits;
        var nonce = data[type].nonce;
        var hashStateRoot = data[type].hashStateRoot;
        var hashUTXORoot = data[type].hashUTXORoot;
        var prevOutStakeHash = data[type].prevOutStakeHash;
        var prevOutStakeN = data[type].prevOutStakeN;
        var vchBlockSig = data[type].vchBlockSig;

        it('should make a new blockheader ' + type, function() {
            BlockHeader(bhbuf).toBuffer().toString('hex').should.equal(bhhex);
        });

        it('hash blockheader ' + type, function() {
            BufferUtil.reverse(BlockHeader(bhbuf)._getHash()).toString('hex').should.equal(hash);
        });

        describe('#constructor', function() {

            it('should set all the variables ' +  type, function() {

                var bh = new BlockHeader({
                    version: version,
                    prevHash: prevblockidbuf,
                    merkleRoot: merklerootbuf,
                    time: time,
                    bits: bits,
                    nonce: nonce,
                    hashStateRoot: hashStateRoot,
                    hashUTXORoot: hashUTXORoot,
                    prevOutStakeHash: prevOutStakeHash,
                    prevOutStakeN: prevOutStakeN,
                    vchBlockSig: vchBlockSig
                });

                should.exist(bh.version);
                should.exist(bh.prevHash);
                should.exist(bh.merkleRoot);
                should.exist(bh.time);
                should.exist(bh.bits);
                should.exist(bh.nonce);
                should.exist(bh.hashStateRoot);
                should.exist(bh.hashUTXORoot);
                // should.exist(bh.prevOutStakeHash);
                // should.exist(bh.prevOutStakeN);
                // should.exist(bh.vchBlockSig);

            });

            it('will throw an error if the argument object hash property doesn\'t match ' + type, function() {
                (function() {

                    var bh = new BlockHeader({
                        hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
                        version: version,
                        prevHash: prevblockidhex,
                        merkleRoot: merkleroothex,
                        time: time,
                        bits: bits,
                        nonce: nonce,
                        hashStateRoot: hashStateRoot,
                        hashUTXORoot: hashUTXORoot,
                        prevOutStakeHash: prevOutStakeHash,
                        prevOutStakeN: prevOutStakeN,
                        vchBlockSig: vchBlockSig
                    });


                }).should.throw('Argument object hash property does not match block hash.');

            });

        });


        describe('#fromObject', function() {

            it('should set all the variables', function() {

                var bh = BlockHeader.fromObject({
                    version: version,
                    prevHash: prevblockidbuf.toString('hex'),
                    merkleRoot: merklerootbuf.toString('hex'),
                    time: time,
                    bits: bits,
                    nonce: nonce,
                    hashStateRoot: hashStateRoot,
                    hashUTXORoot: hashUTXORoot,
                    prevOutStakeHash: prevOutStakeHash,
                    prevOutStakeN: prevOutStakeN,
                    vchBlockSig: vchBlockSig
                });

                should.exist(bh.version);
                should.exist(bh.prevHash);
                should.exist(bh.merkleRoot);
                should.exist(bh.time);
                should.exist(bh.bits);
                should.exist(bh.nonce);
                should.exist(bh.hashStateRoot);
                should.exist(bh.hashUTXORoot);
                // should.exist(bh.prevOutStakeHash);
                // should.exist(bh.prevOutStakeN);
                // should.exist(bh.vchBlockSig);

            });

        });

        describe('#toJSON ' + type, function() {

            var bh = BlockHeader.fromObject({
                version: version,
                prevHash: prevblockidbuf.toString('hex'),
                merkleRoot: merklerootbuf.toString('hex'),
                time: time,
                bits: bits,
                nonce: nonce,
                hashStateRoot: hashStateRoot,
                hashUTXORoot: hashUTXORoot,
                prevOutStakeHash: prevOutStakeHash,
                prevOutStakeN: prevOutStakeN,
                vchBlockSig: vchBlockSig
            });

            it('should set all the variables ' + type, function() {
                var json = bh.toJSON();

                should.exist(json.version);
                should.exist(json.prevHash);
                should.exist(json.merkleRoot);
                should.exist(json.time);
                should.exist(json.bits);
                should.exist(json.nonce);
                should.exist(json.hashStateRoot);
                should.exist(json.hashUTXORoot);
                // should.exist(bh.prevOutStakeHash);
                // should.exist(bh.prevOutStakeN);
                // should.exist(bh.vchBlockSig);
            });

        });

    });


    it('should not make an empty block', function() {
        (function() {
            BlockHeader();
        }).should.throw('Unrecognized argument for BlockHeader');
    });

    describe('version', function() {
        it('is interpreted as an int32le', function() {
            var hex = 'ffffffff0000000000000000000000000000000000000000000000000000000000000000414141414141414141414141414141414141414141414141414141414141414101000000020000000300000056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b42156e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421de17e7f36963bfbfc5ff67b5002b29896fc44f8d7a93148fcc6bc2117ddaf9ba0100000046304402203244c37e6c606aeadad2d2b1a879f4bc2f62b34bf74d79e925791576f445f2e002205fe72f12850250f7a9269870e5306e21f310aecc06c43683c0015299068839ec';
            var header = BlockHeader.fromBuffer(new Buffer(hex, 'hex'));
            header.version.should.equal(-1);
            header.timestamp.should.equal(1);
        });
    });







});