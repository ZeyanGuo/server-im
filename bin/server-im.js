#!/usr/bin/env node

//get method type
const childProcess = require('child_process');
const assert = require('assert');

const prefix = '\x1B[40m\x1B[37mserver-im\x1B[39m\x1B[49m';
const args = process.argv.slice(2);
const argsIndex = args.findIndex(
	x=>x==='build'|| x === 'test'|| x==='start'
);
const method = argsIndex===-1?args[0]:args[argsIndex];

//do some methods accroding to the method type
switch(method){
	case 'build':
	case 'start':
	case 'test':{
		//invoke method by child process
		let exec = childProcess.exec('node '+__dirname+'/../server/script/'+method,(err)=>{
			assert.equal(err,null);
		});
		exec.stdout.on('data',(data)=>{
			console.log(data);
		});
	} break;
	default:{
		console.log(prefix + '\x1B[31m unkonwn method '+ method + '.\x1B[39m');
	}
}
