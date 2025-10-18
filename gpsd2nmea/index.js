const NMEAEmitter = require("./NMEAEmitter.js");
const GPS = require("gps");
const express = require("express");
const _ = require("lodash");

const nmea_emitter = new NMEAEmitter();
const gps = new GPS();
const app = express();

app.use(express.json());

let last_nmea_reception = 0;

nmea_emitter.on("data", (data)=>{
	last_nmea_reception = new Date().getTime();

	let lines = data.split("\n");
	for(let l of lines){
		gps.update(l);
		console.log(l);
	}
});

app.all("/", (req, res)=>{
	const lat = _.get(gps.state, "lat"),
		  lng = _.get(gps.state, "lon");

	if(_.isFinite(lat) && _.isFinite(lng)){
		const ret = {
		    "location": { lat, lng },
		    "accuracy": 0.0,
		};
		res.status(200).send(ret);
	} else {
		res.sendStatus(503);
	}
});

app.listen(12947);



const inject_gps_start = require("./inject_gps_start");
async function inject_gps_again(){
	const now = new Date().getTime();

	if(now - last_nmea_reception > 10000){
		try{
			await inject_gps_start();
		} catch(e){
			console.log("inject_gps_again error:", e);
		}
	}

	setTimeout(inject_gps_again, 10000);
}
setTimeout(inject_gps_again, 10000);