const crypto = require("crypto");

module.exports.GenerateHash = (MessageBuffer) => {
    const sha256Result = crypto.createHash("sha256");
    sha256Result.update(MessageBuffer);
    return sha256Result.digest("hex");
}