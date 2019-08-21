const config = require("./config/config.js");
const winlog = require("./src/Winlog.js");
const sca = require("./src/SCA.js");
const be = require("./src/HttpBE.js");
const net = require("net");
const logger = require("tracer").colorConsole(config.ConsoleOption);

let retryConnect = false;

// Create Server to receive a Contract from Client(Wallet)
let serverCLIENT = net.createServer(async function(client) {
  logger.info("Recieved Contract From Wallet Success");
  winlog.info("Recieved Contract From Wallet Success");
  
  client.on("data", async function(data) {
    let client_res = await sca.createTx(nna, data);
    client.write(JSON.stringify(client_res));
  });

  client.on("end", function() {
    logger.info("Wallet Client Disconnected");
    winlog.info("Wallet Client Disconnected");
  });

  client.on("error", function(err) {
    logger.error("Server Error : ", JSON.stringify(err));
    winlog.error("Server Error : ", JSON.stringify(err));
  });
});

// Create Socket for connect to NNA
let nna = new net.Socket();

function nna_connect() {
  nna.connect(config.netConfigToNNA, async function() {
    nna.setKeepAlive(true);
    // Retry the connection to the server.
    if ((retryConnect = false)) {
      logger.info("Trying Connect to NNA ...");
      winlog.info("Trying Connect to NNA ...");
    }
  });
}

nna.on("connect", function() {
  logger.info("Connected to NNA success");
  winlog.info("Connected to NNA success");
  retryConnect = true;
});

nna.on("data", async function(data) {
  // JSON parsing
  let tx_json = JSON.parse(data);
  const Table_Name = tx_json.table_name;
  let transaction

  // NNA -> SCA : Transaction Ack
  if (Table_Name == config.TableNames.TxAck) {
    transaction = await sca.TxAckFromNNA(tx_json);
    const KeyID = tx_json.db_key;
    // Send to BE
    await be.BEConnection(config.TXhttpsConfig, transaction);
  
    logger.info("Transaction Send To BE");
    winlog.info("Transaction Send To BE");
    logger.debug("Sent Transaction DB Key : " + KeyID);
    winlog.info("---------------------------------------------------------------------------");
  }

  // NNA -> SCA : Block Noti
  else if (Table_Name == config.TableNames.BlkNotiFromNNA) {
    transaction = await sca.BlkNotiFromNNA(tx_json);
    const TXC = tx_json.tx_count;
    // Send to BE
    await be.BEConnection(config.BlockhttpsConfig, transaction);
    
    logger.info("BlockNoti Send To BE Success");
    winlog.info("BlockNoti Send To BE Success");
    logger.debug("Sent BlockNoti TX Count : " + TXC);
    logger.log("---------------------------------------------------------------------------");
    winlog.info("---------------------------------------------------------------------------");
  }
  
  else if (Table_Name == config.TableNames.GenesisBlkGen) {
    await sca.GenesisBlkNotiFromNNA(nna, tx_json);
  }
  else {
    logger.error("Transaction from NNA Is Invalid");
    winlog.error("Transaction from NNA Is Invalid");
  }
});

nna.on("close", async function() {
  logger.warn("Connection from NNA closed");
  winlog.warn("Connection from NNA closed");
  // Retry the connection if the connection with the NNA is lost. (Every 2sec)
  retryConnect = false;
  logger.log("Reconnecting to NNA  ... (2sec)");
  setTimeout(nna_connect, config.ConnectionRetryTime);
});

nna.on("error", function(err) {
  logger.error("SCA Socket Error(nna) :", JSON.stringify(err));
  winlog.error("SCA Socket Error(nna) :", JSON.stringify(err));
});

// Server listen for Client(Wallet)
serverCLIENT.listen(config.SCAServerPort, function() {
  logger.info("SCA Server Listening For Wallet : " + JSON.stringify(serverCLIENT.address()));
  winlog.info("SCA Server Listening For Wallet : " + JSON.stringify(serverCLIENT.address()));
  serverCLIENT.on("close server for client", function() {
    logger.error("Server for Wallet Terminated");
    winlog.error("Server for Wallet Terminated");
  });
});

// connect to NNA
nna_connect();
