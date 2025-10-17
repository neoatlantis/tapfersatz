const NMEAEmitter = require("./NMEAEmitter.js");

const nmea_emitter = new NMEAEmitter();

nmea_emitter.on("data", (data)=>{
	console.log(data);
})