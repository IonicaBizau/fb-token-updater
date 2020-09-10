"use strict";

const graph = require('fbgraph');
const Lien = require("lien");
const config = require("./config");

const CLIENT_ID = config.client_id;
const CLIENT_SECRET = config.client_secret;
const PORT = process.env.PORT || 8080;

let ACCESS_TOKEN = config.access_token;
let lastFbData = {}

function extendToken () {
    graph.extendAccessToken({
        access_token: ACCESS_TOKEN
      , client_id: CLIENT_ID
      , client_secret: CLIENT_SECRET
    }, function (err, facebookRes) {
        if (err) {
            lastFbData = {
                error: err
              , date: new Date()
            };
            return;
        }
        ACCESS_TOKEN = facebookRes.access_token;
        graph.setAccessToken(ACCESS_TOKEN);
        console.log(ACCESS_TOKEN);
        lastFbData = facebookRes;
        lastFbData.date = new Date();
        setTimeout(function () {
            extendToken();
        }, 60 * 60 * 1000);
    });
}

extendToken();

// Init lien server
let server = new Lien({
    host: "localhost"
  , port: PORT
});

// Listen for load
server.on("load", err => {
    err && console.error(err);
    err && process.exit(1);
});

server.addPage("/metadata", lien => {
    if (!lien.query.url) {
        return lien.end();
    }
    graph.post("/?debug=all&id=" + lien.query.url + "&method=get&pretty=0&scrape=true&suppress_http_code", (err, res) => {
        lien.end(res);
    });
});

server.addPage("/status", lien => {
    lien.header("access-control-allow-origin", "*");
    lien.end(lastFbData);
});
