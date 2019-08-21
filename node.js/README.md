##############################################################################
# SCA node.js 19.08.12 

# Inspection
SeongKee, Kim ( sk.quant@gmail.com)

# Author
Leo Son, ksnam

# Prerequisite
- Download and setting up MySQL - Our Program store the data in MySQL
- Download set_env.sh file in our project repository
- Modify the set_env.sh file to suit your server environment
- Execute set_env.sh for setting up your server

# Description
SCA(Smart Contract Application)
It takes transactions from Wallet on GMB mainnet and creates smart contact and stores them in DB.
It also plays a role of transmitting the generated smart contact to the NNA.
Block Explorer can identify smart contract, transactions, and the balance of wallets through DB queries to SCA

       --SCA
            い config
            |     い-- config.js
            い log
            |     い-- Log files by date (ex. SCA.log.2019-08-09 ...)
            い src
            |     い-- CommonUtil.js 
            |     い-- Crypto.js
            |     い-- DBUtil.js
            |     い-- HttpBE.js
            |     い-- KeyUtil.js
            |     い-- SCA.js
            |     い-- Wallet.js
            |     い-- Winlog.js
            いmain.js

# How to run
 - It is executed by ISA during full mainnet operation.

 - Individual execution
  >> node main.js

# Process
 Excuted by ISA
###### - If contract is received from wallet, 
 1. Verify Signature in contract using from value.
  -- Fail case : Contract Ack(Error)
 2. Create Smart Contract.
  -- SC [DBKey, BN(block number), BGT(block gen time), BCT(block confirm time), Hash]
 3. Insert DB
 4. Contract Ack(Success)
 5. Transaction to NNA
  -- Transaction [DBKey, Hash]
 6. Received Ack from NNA
  -- Transaction Ack [BN, DBKey, Hash]
 7. Update DB (BN)
 8. Transaction to BE(Block Explorer)

###### - If BlockNoti is received from NNA
 1. Update DB (BGT, BCT)
 2. Send BlockNoti to BE

# Development Environment
 - OS : Linux (CentOS 7.5)
 - Node.js : v10.16.0
 - DB : MySQL (Ver 14.14 Distrib 5.7.27)
