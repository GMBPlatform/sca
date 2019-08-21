const fs = require("fs");

module.exports.SCAServerPort = process.env.SCA2CLI_Port1;

module.exports.ConnectionRetryTime = 2000;

const NNAnodeJsonPath = "./../NNA/conf/node.json";
const NNAconfigData = fs.readFileSync(NNAnodeJsonPath);
const NNAconfig = JSON.parse(NNAconfigData);

module.exports.NNAnodejsonPath = () => {
  return NNAnodeJsonPath;
}

module.exports.TableNames = {
  "TxAck" : "tx",
  "BlkNotiFromNNA" : "block_noti",
  "GenesisBlkGen" : "genesis_block"
}

module.exports.CurveNames = {
  "ECDSACurveName" : "secp256r1",
  "ECDHCurveName" : "prime256v1", 
}

module.exports.ParseP2PRoot = {
  "start" : 10,
  "end" : 14
}

module.exports.DBKeyLen = {
  "KeyNumLen" : 12,
  "KeyIndexLen" : 4
}

module.exports.netConfigToNNA = {
  port: parseInt(process.env.NNA2ISA_Srv),
  host: NNAconfig.NODE.SOCK.TCP_SVR_1.IP,
  localPort: parseInt(process.env.SCAPort)
};

module.exports.TXhttpsConfig = {
  rejectUnauthorized: false,
  host: process.env.BEServer,
  port: process.env.SCA2BE_Srv,
  localport: process.env.SCA2BE_Cli,
  path: process.env.BEPath_TX,
  method: 'POST',
  json: true,
  headers: {
    'Content-Type': 'application/json'
  }
};

module.exports.BlockhttpsConfig = {
  rejectUnauthorized: false,
  host: process.env.BEServer,
  port: process.env.SCA2BE_Srv,
  localport: process.env.SCA2BE_Cli,
  path: process.env.BEPath_Block,
  method: 'POST',
  json: true,
  headers: {
    'Content-Type': 'application/json'
  }
};

module.exports.ConsoleOption = {
  format: [
    "[{{title}}] [{{timestamp}}] [in {{file}}:{{line}}] {{message}}", //default format
    {
      log: "[{{title}}]   [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      debug: "[{{title}}] [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      info: "[{{title}}]  [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      warn: "[{{title}}]  [{{timestamp}}] [in {{file}}:{{line}}] {{message}}",
      error: "[{{title}}] [{{timestamp}}] [in {{file}}:{{line}}] {{message}}" // error format
    }
  ],
  dateformat: "yyyy.mm.dd HH:MM:ss.L",
  preprocess: function (data) {
    data.title = data.title.toUpperCase();
  }
};

module.exports.GenesisBlock = {
  "Revision": 0,
  "PreviousKeyID": 0,
  "ContractCreateTime": 0,
  "Fintech": 0,
  "From": "000000000000000000000000000000000000000000000000000000000000000000",
  "Balance": 0, "NotePrivacy": 0,
  "Note": [{ "To": "029D2957645318425F8BFE8C7073592BBB3EDA303749FD9A2EAB7F0555F6F88E07", "Fee": 0, "Kind": 0, "Amount": "1000000000" }],
  "KeyR": "0000000000000000000000000000000000000000000000000000000000000000",
  "KeyS": "0000000000000000000000000000000000000000000000000000000000000000"
}