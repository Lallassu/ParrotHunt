//======================================================
// File: server.js
// Descr: Nodejs server for Wizard Warz.
// 
// Author: Magnus Persson
// Date: 2014-01-31
//======================================================

// Examples for SQLITE:
// http://webreflection.blogspot.se/2013/07/dblite-sqlite3-for-nodejs-made-easy.html

// Examples for game server:
// http://rawkes.com/articles/creating-a-real-time-multiplayer-game-with-websockets-and-node

//======================================================
// Configuration
//======================================================
var version = "0.1";
var port = 8080;

//======================================================
// Initialization
//======================================================
var server = require("http");
var dblite = require('dblite');
var db = dblite('database.db');

// Create database
//db.query('CREATE TABLE players (id INTEGER PRIMARY KEY, name VARCHAR(13), score INT, hits INT, date_played VARCHAR(25))');

server = server.createServer(Handler);
var io = require("socket.io").listen(server).set('log level',1);
io = io.sockets.on("connection", SocketHandler);
var fs = require("fs");
var path = require("path");
var logger = require('util');
var sys = require('sys');
server.listen(port);

console.log("===================================");
console.log("Server for ParrotHunt");
console.log("Author: nergal");
console.log("Version: "+version);
console.log("===================================");
logger.log("Started server on port "+port);

//======================================================
//
// Server only stuff
//
//======================================================
// Socket handler
function SocketHandler(socket, data) {
    var ip = socket.handshake.address;
    logger.log("Incoming connection from "+ip.address+":"+ip.port);

    // world
    socket.on('GetScore', GetScore);
    socket.on('SetScore', SetScore);
    socket.on('GetStat', GetStat);
}

// Set score
function SetScore(data) {
    data.name = data.name.substr(0,15);
    db.query('BEGIN');
    db.query(
        'INSERT INTO players (name, score, hits, date_played) VALUES (?, ?, ?, current_timestamp)',
        [data.name, data.score, data.hits]
    );
    db.query('COMMIT');
}

// Get statistics
function GetStat(data) {
    var s = this;
    db.query(
        'SELECT count(*) as players, sum(hits) as hits from players where id > ?',
        [0],
        function (rows) {
            if(rows[0][1] =='' || rows[0][1] == undefined) {
                rows[0][1] = 0;
            }
            s.emit("stat", { players: rows[0][0], hits: rows[0][1]});
        }
    );
}

// Get score
function GetScore(data) {
    logger.log("Get score request..");
    var s = this;
    db.query(
        'SELECT name, score, date_played from players where id > ? order by score desc limit 200',
        [0],
        function (rows) {
            var data = [];
            for(var i = 0 ; i < rows.length; i++) {
                data.push({name: rows[i][0],
                          score: rows[i][1],
                          date: rows[i][2],
                });
            }
            s.emit("scoreboard", { score: data });
        }
    );
}

//======================================================
//
// Utility functions
//
//======================================================
function Length(obj) {
    return Object.keys(obj).length;
}

//======================================================
//
// Handler for web requests (webserver)
//
//======================================================
function Handler(req, res)
{                     
    var file = ".." + req.url;
    if(file === "../") {
        file = "../index.html";
    }
    var name = path.extname(file);
    var contentType;
    switch(name) {
        case '.html':
            case '.htm':
            contentType = 'text/html';
        break;
        case '.js':
            contentType = 'text/javascript';
        break;
        case '.css':
            contentType = 'text/css';
        break;
        case '.png':
            contentType = 'image/png';
        break;
        case '.jpg':
            contentType = 'image/jpg';
        break;
    }
    fs.exists(file, function(exists) {
        if(exists) {
            fs.readFile(file,function(err,data) {
                res.writeHead(200, {'Content-Type': contentType});
                res.end(data);
            });
        } else {
            res.writeHead(404, {'Content-Type': contentType});
            res.end("Wizard killed the requested file with a Fireball! R.I.P "+file);
        }
    });
}
