//This is the server main file.
const express = require('express');
const config = require('../../config/server.config');
const {sucMessage} = require('../util/util');
const {createRouter} = require('./router');
const Server = express();
const bodyParser = require('body-parser');
const multer = require('multer'); 
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');


const allowCrossDomain = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:8020,http://localhost:8000");//  http://localhost:8000
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");  
    res.header("Access-Control-Allow-Credentials",true);
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");  
    next();
};

Server.use('/images',express.static(path.resolve(__dirname,'../../static/images')));
Server.use(allowCrossDomain);
Server.use(bodyParser.json());
Server.use(cookieParser());
Server.use(cors({
    origin: 'http://localhost:8000',
    credentials: true,
}));
//Add the route
createRouter(Server);

//open the server
Server.listen(config.port,config.host,(err)=>{
	if(err) throw err;
	console.log(sucMessage('Server started & listen to '+ config.host + ' ' + config.port));
})

