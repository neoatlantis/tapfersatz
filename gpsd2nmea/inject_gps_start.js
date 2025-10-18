const fs = require("fs");


function wait_device(device){
	return new Promise((resolve)=>{
		function check(){
			if(fs.existsSync(device)) return resolve();
			setTimeout(check, 1000);
		}
		check();
	})
}


module.exports = async function(){
	const ports = [
		'/dev/ttyUSB1',
		'/dev/ttyUSB2',
	];
	const message = '$GPS_START\r\n';

	for(let port of ports){
		console.log("Waiting for device " + port);
		await wait_device(port);
		console.log(port + " detected.");

		try {
			const fd = fs.openSync(port, 'w');
			fs.writeSync(fd, message);
			fs.closeSync(fd);
			console.log(`Sent to ${port}:`, JSON.stringify(message))
		} catch (err) {
			console.error('Error writing to port:', err);
			return false;
		}

	}

	return true;
}
