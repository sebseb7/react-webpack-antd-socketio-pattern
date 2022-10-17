const { Server } = require("socket.io");
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const async = require("async");

const db = new sqlite3.Database('.database.sqlite',()=>{createTables()});

function createTables(){

	db.run("create table if not exists Users (userid INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, email TEXT, approved TEXT)");
	db.run("create table if not exists Tokens (userid INTEGER, token TEXT UNIQUE,expires DATETIME DEFAULT (DATETIME(CURRENT_TIMESTAMP,'+1 hour')), CONSTRAINT userid_key FOREIGN KEY (userid) REFERENCES Users(userid) )");

}



module.exports = function(http){
	const io = new Server(http);

	setInterval(async ()=>{

		const sockets = await io.fetchSockets();

		async.forEachOf(sockets, (socket, key, callback) => {
			if(socket.data && socket.data.auth){
				db.run("update Tokens set expires = DATETIME(CURRENT_TIMESTAMP,'+1 hour') where token = ?",{1:socket.data.auth},()=>{
					callback();
				});
			}else{
				callback();
			}
		}, err => {
			db.run("delete from Tokens where expires < CURRENT_TIMESTAMP");
		});

	},1000*10);

	io.on('connection',(socket)=>{
		socket.on('getSalt',(callback)=>{
			const salt = crypto.createHash('sha256').update(socket.id).digest('hex');
			if(callback) callback(salt);
		});
		socket.on('getPubKey',(callback)=>{
			const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {modulusLength: 2048,});
			socket.data.privateKey = privateKey;
			if(callback) callback(publicKey.export({type: "spki",format: "jwk"}));
		});
		socket.on('register',(data,callback)=>{

			var password = '';

			try{
				const decryptedData = crypto.privateDecrypt(
					{
						key: socket.data.privateKey,
						padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
						oaepHash: "sha256"
					},data.password);

				password = decryptedData.toString();
			}catch(e){
				if(callback) callback({err:'internalError'});
			}
			
			db.get("select 1 from Users where username = ?",{1:data.username},(err,result)=>{
	
				if(result){
					if(callback) callback({err:'userError'});
				}else{
					db.get('insert into Users (username,password,email) values (?,?,?) RETURNING userid',{1:data.username,2:password,3:data.email},(err,result) =>{
						if(result){
							const token = crypto.randomBytes(16).toString("hex");
							db.run('insert into Tokens (userid,token) values (?,?)',{1:result.userid,2:token},(err,result) =>{
								if(callback) callback({ok:token});
								socket.data.auth=token;
							});
						}
					});
				}
			});



		});
		socket.on('login',(data,callback)=>{

			db.get("select * from Users where username = ?",{1:data.user},(err,result)=>{
				if(! result){
					if(callback) callback({err:'userError'});
				}else{
				
					const salt = crypto.createHash('sha256').update(socket.id).digest('hex');
					const pw = result.password;
					const pwHash = crypto.createHash('sha256').update(salt+data.user+pw).digest('hex');
					if(pwHash != data.hash){
						if(callback) callback({err:'passwordError'});
					}else{
						const token = crypto.randomBytes(16).toString("hex");
						db.run('insert into Tokens (userid,token) values (?,?)',{1:result.userid,2:token},(err,result) =>{
							if(callback) callback({ok:token});
							socket.data.auth=token;
						});
					}
				}
			});

		});

		socket.on('logout',()=>{
							
			if(socket.data.auth){
				db.run('delete from Tokens where token = ?',{1:socket.data.auth});
				delete socket.data.auth;
			}

		});
		socket.on('check_token',(data,callback)=>{
			
			if(data.token){
				db.get('select * from Tokens where token = ?',{1:data.token},(err,result)=>{
					if(result && result.userid){
						socket.data.auth=data.token;
						if(callback)callback({ok:true});
					}
				});
			}

		});

	});


	return io;
}
