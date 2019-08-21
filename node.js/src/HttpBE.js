const https = require("https");

const config = require("./../config/config.js");
const winlog = require("./Winlog.js");
const logger = require("tracer").colorConsole(config.ConsoleOption);

module.exports.BEConnection = async (httpConfig, transaction) => {
    let req = https.request(httpConfig, function(res) {
        res.on("data", d => {
            logger.info("Connected to BE success");
            winlog.info("Connected to BE success");
        });
    });

    req.on("error", (error) => {
        logger.error("Connection to BE failed");
        winlog.error(error);
    });

    await req.write(JSON.stringify(transaction));
    await req.end();
}