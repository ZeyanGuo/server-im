const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const URL = "mongodb://localhost:27017";
const dbName = "IM";



function find(db,collections,selector,fn){
	const collection = db.collection(collections);

	collection.find(selector).toArray(function(err,result){
		assert.equal(err,null);
		fn(result);
	});
}

function add(db,collections,selector,fn){
	const collection = db.collection(collections);
	collection.insertMany([selector],function(err,result){
    	assert.equal(err,null);
	    fn(result);
	});
}

function deletes(db,collections,selector,fn){
	const collection = db.collection(collections);
	collection.deleteOne(selector,function(err,result){
	    assert.equal(err,null);
	    fn(result);
	});
}

function update(db,collections,selector,fn){
	const collection = db.collection(collections);
	collection.updateOne(selector[0],selector[1],function(err,result){
		assert.equal(err,null);
		fn(result);
	});
}

function sortFind(db,collections,selector,fn){
	const collection = db.collection(collections);
	let result = collection.find().sort(selector[0]).skip(selector[1]).limit(selector[2]);
	result.toArray(function(err,result){
		assert.equal(err,null);
		fn(result);
	});
}

methodsTypes = {
	find:find,
	add:add,
	delete:deletes,
	update:update,
	sortFind:sortFind
}

module.exports = function(methods,collections,selector,fn){
	MongoClient.connect(URL,function(err,client){
		assert.equal(null,err);
		db = client.db(dbName);
		methodsTypes[methods](db,collections,selector,fn);
		client.close();
	})
}











