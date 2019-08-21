const mysql = require("mysql2/promise");

module.exports.dbConfig = {
    host : process.env.DBHost,
    user : process.env.DBUser,
    password : process.env.DBPassword,
    database : process.env.SCADB
};
  
module.exports.querys = {
    "InsertContents" : 'INSERT INTO contents(contract) VALUES(?)',
    "InsertInfoWithOutBlkNum" : 'INSERT INTO info(db_key, hash) VALUES(?, ?)',
    "UpdateBlkNum" : 'UPDATE info SET block_num = ? WHERE db_key = ?',
    "UpdateDBKey" : 'UPDATE contents SET db_key = ? WHERE db_num = ?',
    "UpdateBlkGenTime" : 'UPDATE info SET block_gen_time = ? WHERE block_num = ?',
    "InsertTransfer" : `INSERT INTO transfer(db_key, frompk, topk, amount, kind) VALUES `,
    "InsertInfoWithBlkNum" : 'INSERT INTO info(db_key, block_num, hash) VALUES(?, ?)',
    "InsertGenesisTx" : 'INSERT INTO transfer(db_key, frompk, topk, amount, kind) VALUES (?, ?, ?, ?, ?)',
    "TruncateContents" : 'TRUNCATE contents',
    "TruncateInfo" : 'TRUNCATE info',
    "TruncateTransfer" : 'TRUNCATE transfer'
};


module.exports.CreateConnection = async (dbConfig) => {
    return await mysql.createConnection(dbConfig);
}

module.exports.executeQueryWithParam = async (connection, query, param) => {
    return await connection.execute(query, param);
}

module.exports.executeQueryWithOutParam = async (connection, query) => {
    return await connection.execute(query);
}

module.exports.connectionClose = async (connection) => {
    await connection.end();
}