//This is the server main file.
const express = require('express');
const config = require('../../config/server.config');
const {sucMessage} = require('../util/util');
const {createRouter} = require('./router');
const Server = express();

const allowCrossDomain = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:8000");  
    res.header("Access-Control-Allow-Headers", "X-Requested-With");  
    res.header("Access-Control-Allow-Credentials",true);
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    res.header("X-Powered-By",' 3.2.1')  
    res.header("Content-Type", "application/json;charset=utf-8");  
    next();
};

Server.use(allowCrossDomain);
//Add the route
createRouter(Server);

//open the server
Server.listen(config.port,config.host,(err)=>{
	if(err) throw err;
	console.log(sucMessage('Server started & listen to '+ config.host + ' ' + config.port));
})

