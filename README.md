# BlockchainVis
This project provides a visual explorer of blockchain-based cryptocurrency transaction 
data, called *SilkViser*. It's designed to help users intuitively understand relevant 
concepts and processes about cryptocurrency transaction mechanisms, as well as 
visually recognize essential and advanced transaction information.

There are three main parts including *silkviser*, *silkviewer* and *siluium-api*. Detailed 
information and usage will be introduced later.

## Dependencies
The SilkViser is implemented based on HTML, CSS and JS, and also depends on the 
following environments:
+ D3.js 
+ Node.js
+ nginx
+ Java
+ MongoDB

Please make sure the above environments are installed before first use.

## Introduction and Usage 
### 1. silkviser
The *silkviser* can visualize the content of blockchain analysis data. It provides 
interactive display functions for the following parts:
+ The latest 6 blocks and the change curve of the number of transactions in each block 
in the past 30 days.
+ Block details and the transaction information in it.
+ Transaction details and information of input and output. 

### 2. silkviewer
The *silkviewer* is mainly used to display the blockchain analysis data in the form 
of a list, and it can also display the following details:
+ The latest 10 blocks and 10 transactions. 
+ Block details and the transaction information in it.
+ Transaction details and information of input and output. 

### 3. silubium-api
The *silubium-api* is designed to periodically parse the blockchain data to MongoDB 
database, while providing API to the front-end.

## Tips
The project is based on the web with server API. Please deploy it with 
the nginx application server and make the target path point to the project root 
directory before use.
