const fs = require("fs");
const KJUR = require("jsrsasign");

const config = require("./../config/config.js");
const wallet = require("./Wallet.js");
const crypto = require("./Crypto.js");

const EC = new KJUR.crypto.ECDSA({ curve: config.CurveNames.ECDSACurveName });
const { createECDH, ECDH } = require("crypto");
const logger = require("tracer").colorConsole(config.ConsoleOption);

const KeyNumIndexPadding = (KeyIndex_hex) => {
    while (KeyIndex_hex.length < config.DBKeyLen.KeyIndexLen) {
        KeyIndex_hex = "0" + KeyIndex_hex;
        if (KeyIndex_hex.length == config.DBKeyLen.KeyIndexLen) break;
        else continue;
    }
    return KeyIndex_hex;
}

const KeyNumPadding = (KeyNum_hex) => {
    while (KeyNum_hex.length < config.DBKeyLen.KeyNumLen) {
        KeyNum_hex = "0" + KeyNum_hex;
        if (KeyNum_hex.length == config.DBKeyLen.KeyNumLen) break;
        else continue;
    }
    return KeyNum_hex;
}

const ConvertKey = async (CompPubKey, CurveName) => {
    return await ECDH.convertKey(CompPubKey, CurveName, "hex", "hex", "uncompressed");
} 

module.exports.SignatureVerify = async (CompPubKey, contractJson, KeyR, KeyS) => {
    // BigInt(KeyR) + BigInt(KeyS) = Signature    
    let signature = KJUR.crypto.ECDSA.biRSSigToASN1Sig(KeyR, KeyS);

    // Creates the same hash as the one created in the wallet. - 2019-07-12 modified by JunSu
    const leftBuffer = wallet.leftSignBufferGenerator(contractJson);
    const rightBuffer = wallet.rightSignBufferGenerator(contractJson.Note);
    const mergedBuffer = Buffer.concat([leftBuffer, rightBuffer]);

    const transferHash = crypto.GenerateHash(mergedBuffer);
    // compressed public key -> uncompressed public key (prime256v1 == secp256r1)
    const pubkey = await ConvertKey(CompPubKey, config.CurveNames.ECDHCurveName);

    // Arg for Verify signature .....end
    logger.log("Contract From Wallet Is Valid");
    logger.debug("Recieved Contract Hash : " + transferHash);

    return await EC.verifyHex(transferHash, signature, pubkey);
}

module.exports.ConvertPubKey = async (ComPubKey, CurveName) => {
    return await ConvertKey(ComPubKey, CurveName);
}

module.exports.GenKeyID = async (KeyNum) => {
    let NNAconfigData = fs.readFileSync(config.NNAnodejsonPath());
    let NNAconfig = JSON.parse(NNAconfigData);
    let P2Proot = NNAconfig.NODE.P2P.CLUSTER.ROOT;
    let P2Paddr = P2Proot.slice(config.ParseP2PRoot.start, config.ParseP2PRoot.end);
    const KeyIndex = P2Paddr;
    let KeyNum_hex = KeyNum.toString(16);
    let KeyIndex_hex = KeyIndex.toString(16);

    // KeyIndex = 2byte, KeyNum = 6byte
    KeyIndex_hex = await KeyNumIndexPadding(KeyIndex_hex);
    KeyNum_hex = await KeyNumPadding(KeyNum_hex);

    let KeyID_hex = KeyIndex_hex + KeyNum_hex;
    let KeyID_big = BigInt("0x" + KeyID_hex);
    return KeyID_big.toString();
}