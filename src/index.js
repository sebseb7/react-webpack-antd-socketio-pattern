const io = require('socket.io-client');
import * as ReactDOM from 'react-dom/client';
import { Space, Row, Col, Button, message} from 'antd';
import 'antd/dist/antd.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBug as fasBug } from '@fortawesome/free-solid-svg-icons';
//import { faFile } from '@fortawesome/free-regular-svg-icons';
library.add(fasBug);
import Login from './login.js';
import Register from './register.js';
import { useState} from 'react';
import { HashRouter as Router,Route,Routes,Link } from "react-router-dom";

const socket = io("", { transports: ["websocket"] });

socket.io.on('error',(error)=>{
	message.error('Connection Error: '+error);
});
socket.io.on('reconnect',()=>{
	message.success('Connection reestablished');
	const token = window.localStorage.getItem('token');
	if(token){
		socket.emit('check_token',{token:token});//,async function(result){
		//	if(result && result.ok){
		//		setLoggedin(true);
		//	}
		//});
	}
});

socket.on('disconnect',(reason)=>{
	message.error('Connection lost: '+reason);
});

function onRegister(values,setLoggedin,setRegisterError){
	setLoggedin('member');
	setRegisterError('');
	socket.emit('getPubKey',async function(pubkey){
		const enc = new TextEncoder();
		const encoded = enc.encode(values.password);
		const parsedKey = await window.crypto.subtle.importKey('jwk', pubkey, {name:'RSA-OAEP',hash:'SHA-256'}, true, ['encrypt'])
		const cryptedPw = await window.crypto.subtle.encrypt({name: "RSA-OAEP",},parsedKey,encoded);
		socket.emit('register',{username:values.username,email:values.email,password:cryptedPw},function(result){
			console.log(result);
			if(result.err == 'userError'){
				setRegisterError('username exists');
				setLoggedin('guest');
			}
			if(result.ok){
				if (window.PasswordCredential) {
					var c = new window.PasswordCredential({id: values.username,password:values.password});
					navigator.credentials.store(c);
				}
				window.localStorage.setItem('token',result.ok);
				setRegisterError('');
				setLoggedin('member');
			}
		});
	});
}

function onLogin(values,setLoggedin,setLoginError){

	socket.emit('getSalt',async function(salt){
		const encoder = new TextEncoder();
		const data = encoder.encode(salt+values.username+values.password);
		const hash = await crypto.subtle.digest('SHA-256',data);
		const pwHash = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
		socket.emit('login',{user:values.username,hash:pwHash},function(result){
			if(result.err == 'userError'){
				setLoginError('no such user');
				setLoggedin('guest');
			}
			if(result.err == 'passwordError'){
				setLoginError('password error');
				setLoggedin('guest');
			}
			if(result.ok){
				if (window.PasswordCredential) {
					var c = new window.PasswordCredential({id: values.username,password:values.password});
					navigator.credentials.store(c);
				}
				window.localStorage.setItem('token',result.ok);
				setLoginError('');
				setLoggedin('member');
			}
		});
	});
}
function onLogout(setLoggedin,setLoginError){
	
	window.localStorage.removeItem('token');
	socket.emit('logout');
	setLoginError('');
	setLoggedin('guest');
}

function App() {

	const token = window.localStorage.getItem('token');
	var loggedinState = 'guest';
	if(token){
		loggedinState = 'none';
		socket.emit('check_token',{token:token},async function(result){
			if(result && result.ok){
				setLoggedin('member');
			}else{
				setLoggedin('guest');
			}
		});
	}
	
	const [loginError, setLoginError] = useState('');
	const [registerError, setRegisterError] = useState('');
	const [isLoggedin, setLoggedin] = useState(loggedinState);

	return (
		<>
			<Row style={{ marginBottom: 8 }}>
				<Col>
				</Col>
			</Row>
					<Router>
						{ isLoggedin=='guest' &&
							<Routes>
								<Route path="/" element={<Login error={loginError} onFinish={(values)=>{onLogin(values,setLoggedin,setLoginError)}}/>}/>
								<Route path="*" element={<Space><FontAwesomeIcon style={{color:"#f5222d"}} icon="fa-solid fa-bug" /><Link to="/">Home</Link></Space>}/>
								<Route path="forgot" element={<div>Forgot <Link to="/">Home</Link></div>}/>
								<Route path="register" element={<Register error={registerError} onFinish={(values)=>{onRegister(values,setLoggedin,setRegisterError)}}/>}/>
							</Routes>
						}
						{ isLoggedin=='member' &&
							<Routes>
								<Route path="/" element={<div><Button type="primary" onClick={()=>{onLogout(setLoggedin,setLoginError)}}>Log out</Button></div>}/>
								<Route path="*" element={<Space><FontAwesomeIcon style={{color:"#f5222d"}} icon="fa-solid fa-bug" /><Link to="/">Home</Link></Space>}/>
								<Route path="register" element={<div>Registration complete <Link to="/">Home</Link></div>}/>
							</Routes>
						}
					</Router>
		</>
	);
}

var appDiv = document.createElement('div');
document.body.appendChild(appDiv);
const root = ReactDOM.createRoot(appDiv);
function RootElem() {return (<div style={{padding:'20px'}}><App/></div>);}
root.render(RootElem());

