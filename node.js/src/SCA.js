const config = require("./../config/config.js");
const keyUtil = require("./KeyUtil.js");
const db = require("./DBUtil.js");
const util = require("./CommonUtil.js");
const crypto = require("./Crypto.js");
const winlog = require("./Winlog.js");
const logger = require("tracer").colorConsole(config.ConsoleOption);

// CreateTransaction from WalletContract
// Pass to NNA
module.exports.createTx = async (nna, data) => {
    // Database Connection
    const connection = await db.CreateConnection(db.dbConfig);
    // data's first 2byte=length, else=contract(JSON type)
    let length_buff = "0x";
    length_buff += Buffer.concat([data.slice(1, 2), data.slice(0, 1)]).toString("hex");
    let contract = data.toString().substring(2, data.toString().length);
    
    // Compare the length of "received data's first 2byte" and "Real contract"
    if (Number(contract.length) == parseInt(length_buff)) {
        // JSON Parsing
        let contractJson = JSON.parse(contract);
        let from_arg = contractJson.From;

        // Arg for Verify Signature (ecdsa secp256r1)
        //let compPubkey = Buffer.from(from_arg, "hex");
        const KeyR = BigInt("0x" + contractJson.KeyR);
        const KeyS = BigInt("0x" + contractJson.KeyS);

        // Verifying Signature
        const verifyResult = await keyUtil.SignatureVerify(from_arg, contractJson, KeyR, KeyS);

        // Signature Verify Valid
        if (verifyResult) {
            logger.log("Contract Signature Verify Success");
            let to_arg_valid;
            try {
                contractJson.Note.some(element => keyUtil.ConvertPubKey(element.To, config.CurveNames.ECDHCurveName));
                to_arg_valid = true;
            } catch (err) {
                to_arg_valid = false;
            }   

            if(to_arg_valid == true) {
                logger.log("To Address Is Valid");
                // MySQL query 'INSERT INTO contents(contract) VALUES(?)'\
                [query_result] = await db.executeQueryWithParam(connection, db.querys.InsertContents, [contract]);
                const KeyNum = query_result.insertId;

                // Generate DBKeyID
                const KeyID = await keyUtil.GenKeyID(query_result.insertId);
                
                // MySQL query 'UPDATE contents SET db_key = ? WHERE db_num = ?'   
                [query_result] = await db.executeQueryWithParam(connection, db.querys.UpdateDBKey, [KeyID, KeyNum]);             

                // 'INSERT INTO transfer(db_key, frompk, topk, amount, kind) VALUES(?, ?, ?, ?, ?)',
                let ledger_insert_query = db.querys.InsertTransfer;

                await util.asyncForEach(contractJson.Note, async (element, index) => {
                    if (index === contractJson.Note.length - 1) {
                        ledger_insert_query += `("${KeyID}", "${from_arg}", "${element.To}", ${BigInt(
                            element.Amount
                        )}, ${0} )`;
                    } else {
                        ledger_insert_query += `("${KeyID}", "${from_arg}", "${element.To}", ${BigInt(
                            element.Amount
                        )}, ${0} ),`;
                    }
                });

                [query_result] = await db.executeQueryWithOutParam(connection, ledger_insert_query);
                // SHA256 hash for transaction hash
                const Hash = crypto.GenerateHash(KeyID + contract);

                // MySQL query 'INSERT INTO info(db_key, hash) VALUES(?, ?)'
                [query_result] = await db.executeQueryWithParam(connection, db.querys.InsertInfoWithOutBlkNum, [KeyID.toString(), Hash]);
                
                // send to NNA by JSON Form
                const transaction = { db_key : KeyID, hash : Hash};

                // Client for NNA
                await nna.write(JSON.stringify(transaction) + "\n");
                logger.info("Transaction Send To NNA Success");
                winlog.info("Transaction Send To NNA Success");

                await db.connectionClose(connection);
                return { res : "success", hash : Hash};
            } 
            else {
                logger.error("To Address Is Invalid");
                winlog.error("To Address Is Invalid");                
            }
            await db.connectionClose(connection);
            return { res : "error", message : "To Address Is Invalid" }
        }
        else {
            // Invalid verify
            logger.error("Contract's Signature Verify Is Invalid");
            winlog.error("Contract's Signature Verify Is Invalid");

            await db.connectionClose(connection);
            return { res : "error", message : "Contract's Signature Verify Is Inavalid" }
        }
    } 
    else {
        // Contract length different
        logger.error("Contract From Wallet Is Invalid(Different Length)");
        winlog.error("Contract From Wallet Is Invalid(Different Length)");
        
        await db.connectionClose(connection);
        return { res : "error", message : "Contract From Wallet Is Invalid(Different Length)" }
    }
}

module.exports.TxAckFromNNA = async (tx_json) => {
    const connection = await db.CreateConnection(db.dbConfig);
    logger.info("Received Transaction From NNA Success");
    winlog.info("Received Transaction From NNA Success");

    const BN = tx_json.block_num;
    const KeyID = tx_json.db_key;
    const Hash = tx_json.hash;

    logger.debug("Received Transaction : " + tx_json.toString());   
    // MySQL query 'UPDATE info SET block_num = ? WHERE db_key = ?'
    await db.executeQueryWithParam(connection, db.querys.UpdateBlkNum, [BN, KeyID]);
    
    // Create transactions to be sent to Block Explore
    const transaction = {
        table_name: config.TableNames.TxAck,
        block_num: BN,
        db_key: KeyID,
        hash: Hash
    };

    await db.connectionClose(connection);
    return transaction;
}

module.exports.BlkNotiFromNNA = async (tx_json) => {
    const connection = await db.CreateConnection(db.dbConfig);
    logger.info("Received BlockNoti From NNA Success");
    winlog.info("Received BlockNoti From NNA Success");

    const BN = tx_json.block_num;
    const BGT = tx_json.block_gen_time;
    const TXC = tx_json.tx_count;
    const Hash = tx_json.hash;
    logger.debug("Received BlockNoti : " + JSON.stringify(tx_json));

    // MySQL query 'UPDATE info SET block_gen_time = ? WHERE db_key = ?'
    await db.executeQueryWithParam(connection, db.querys.UpdateBlkGenTime, [BGT, BN]);
    
    // block Noti to be sent to Block Explore
    const transaction = {
        table_name : config.TableNames.BlkNotiFromNNA,
        block_num : BN,
        block_gen_time : BGT,
        tx_count : TXC,
        hash : Hash
    };
    
    await db.connectionClose(connection);
    return transaction;
}

module.exports.GenesisBlkNotiFromNNA = async (nna, tx_json) => {
    const connection = await db.CreateConnection(db.dbConfig);
    logger.info("Making Genesis Block Start");
    winlog.info("Making Genesis Block Start");
    logger.info("All Databases TRUNCATE");
    winlog.info("All Databases TRUNCATE");

    await db.executeQueryWithOutParam(connection, db.querys.TruncateContents);
    await db.executeQueryWithOutParam(connection, db.querys.TruncateInfo);
    await db.executeQueryWithOutParam(connection, db.querys.TruncateTransfer);

    const contract = config.GenesisBlock;
    const fromAddr = contract.From;
    const noteArr = contract.Note;
    const toAddr = noteArr[0].To;
    const amount = noteArr[0].Amount;

    // MySQL query 'INSERT INTO contents(contract) VALUES(?)'
    [query_result] = await db.executeQueryWithParam(connection, db.querys.InsertContents, [contract]);
    const KeyNum = query_result.insertId;
    const KeyID = await keyUtil.GenKeyID(KeyNum);

    // MySQL query 'UPDATE contents SET db_key = ? WHERE db_num = ?'
    await db.executeQueryWithParam(connection, db.querys.UpdateDBKey, [KeyID, KeyNum]);
    await db.executeQueryWithParam(connection, db.querys.InsertGenesisTx, [KeyID, fromAddr, toAddr, amount, "0"]);

    // SHA256 hash for transaction hash
    const Hash = await crypto.GenerateHash(KeyID + contract);

    const transaction = { db_key : KeyID, hash : Hash };
    await nna.write(JSON.stringify(transaction) + "\n");
    logger.info("Genesis Block Send To NNA Success");
    winlog.info("Genesis Block Send To NNA Success");
    
    await db.executeQueryWithParam(connection, db.querys.InsertInfoWithOutBlkNum, [KeyID.toString(), Hash]);
    await db.connectionClose(connection);
}
