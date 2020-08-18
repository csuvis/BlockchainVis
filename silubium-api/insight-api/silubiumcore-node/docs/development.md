# Setting up Development Environment

## Install Node.js

Install Node.js by your favorite method, or use Node Version Manager by following directions at https://github.com/creationix/nvm

```bash
nvm install v4
```

## Fork and Download Repositories

To develop silubiumcore-node:

```bash
cd ~
git clone git@github.com:<yourusername>/silubiumcore-node.git
git clone git@github.com:<yourusername>/silubiumcore-lib.git
```

To develop silubium or to compile from source:

```bash
git clone git@github.com:<yourusername>/silubiumcoin.git
git fetch origin <branchname>:<branchname>
git checkout <branchname>
```
**Note**: See silubium documentation for building silubium on your platform.


## Install Development Dependencies

For Ubuntu:
```bash
sudo apt-get install libzmq3-dev
sudo apt-get install build-essential
```
**Note**: Make sure that libzmq-dev is not installed, it should be removed when installing libzmq3-dev.


For Mac OS X:
```bash
brew install zeromq
```

## Install and Symlink

```bash
cd bitcore-lib
npm install
cd ../bitcore-node
npm install
```
**Note**: If you get a message about not being able to download silubium distribution, you'll need to compile silubiumd from source, and setup your configuration to use that version.


We now will setup symlinks in `silubiumcore-node` *(repeat this for any other modules you're planning on developing)*:
```bash
cd node_modules
rm -rf silubiumcore-lib
ln -s ~/silubiumcore-lib
rm -rf silubiumd-rpc
ln -s ~/silubiumd-rpc
```

And if you're compiling or developing silubiumcoin:
```bash
cd ../bin
ln -sf ~/silubium/src/silubiumd
```

## Run Tests

If you do not already have mocha installed:
```bash
npm install mocha -g
```

To run all test suites:
```bash
cd silubiumcore-node
npm run regtest
npm run test
```

To run a specific unit test in watch mode:
```bash
mocha -w -R spec test/services/silubiumd.unit.js
```

To run a specific regtest:
```bash
mocha -R spec regtest/silubiumd.js
```

## Running a Development Node

To test running the node, you can setup a configuration that will specify development versions of all of the services:

```bash
cd ~
mkdir devnode
cd devnode
mkdir node_modules
touch silubiumcore-node.json
touch package.json
```

Edit `silubiumcore-node.json` with something similar to:
```json
{
  "network": "livenet",
  "port": 3001,
  "services": [
    "silubiumd",
    "web",
    "insight-api",
    "insight-ui",
    "<additional_service>"
  ],
  "servicesConfig": {
    "silubiumd": {
      "spawn": {
        "datadir": "/home/<youruser>/.silubium",
        "exec": "/home/<youruser>/silubium/src/silubiumd"
      }
    }
  }
}
```

**Note**: To install services [silubium-insight-api](http://172.16.0.99/szc/insight-api) and [silubium-explorer](http://172.16.0.99/szc/silubium-explorer) you'll need to clone the repositories locally.

Setup symlinks for all of the services and dependencies:

```bash
cd node_modules
ln -s ~/silubiumcore-lib
ln -s ~/silubiumcore-node
ln -s ~/silubium-insight-api
ln -s ~/silubium-explorer
```

Make sure that the `<datadir>/silubium.conf` has the necessary settings, for example:
```
server=1
whitelist=127.0.0.1
txindex=1
addressindex=1
timestampindex=1
spentindex=1
zmqpubrawtx=tcp://127.0.0.1:28332
zmqpubhashblock=tcp://127.0.0.1:28332
rpcallowip=127.0.0.1
rpcuser=user
rpcpassword=password
rpcport=18332
reindex=1
gen=0
addrindex=1
logevents=1
```

From within the `devnode` directory with the configuration file, start the node:
```bash
../silubiumcore-node/bin/silubiumcore-node start
```