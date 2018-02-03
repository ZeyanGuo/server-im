const path = require('path');
const rootFile = process.cwd();

const createRouter = (app) => {
	app.get('/',(req,res)=>{
		res.sendFile(path.resolve(rootFile,'./public/index.html'));
	});
	app.get('/methods/checkUserByCookie.json',(req,res)=>{
		let result = {
			status:'ok',
			result:null
		}
		res.end(JSON.stringify(result));
	})
}

module.exports.createRouter = createRouter;