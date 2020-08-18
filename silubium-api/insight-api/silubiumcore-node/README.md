Silubiumcore Node
============

A SILUBIUM full node for building applications and services with Node.js. A node is extensible and can be configured to run additional services.

## Getting Started

1. Install nvm https://github.com/creationix/nvm  

    ```bash
    nvm i v6
    nvm use v6
    ```  
2. Install mongo https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/  

3. Install silubium-bitcore http://172.16.0.99/szc/silubium-bitcore - with ZMQ !

    ```bash
    # with ZMQ
    sudo apt-get install libzmq3-dev 
    ```  
4. Install silubiumcore-node

    ```bash
    npm i http://172.16.0.99/szc/silubiumcore-node.git#master

    $(npm bin)/silubiumcore-node create mynode

    cd mynode

    ```  
5. Edit silubiumcore-node.json

    ```json
    {
      "network": "livenet",
      "port": 3001,
      "services": [
	    "silubiumd",
        "web"
      ],
      "servicesConfig": {
        "silubiumd": {
          "spawn": {
            "datadir": "/home/user/.silubium",
            "exec": "/home/user/silubium-bitcore/src/silubiumd"
          }
        }
      }
	}
    ```  
6. Edit silubium.conf

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
7. Run Node  

    ```
    $(npm bin)/silubiumcore-node start
    ```  

## Add-on Services

There are several add-on services available to extend the functionality of Silubiumcore:

- [SILUBIUM Insight API](http://172.16.0.99/szc/insight-api)
- [SILUBIUM Explorer](http://172.16.0.99/szc/silubium-explorer)

## Contributing



## License
