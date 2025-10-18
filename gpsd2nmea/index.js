const NMEAEmitter = require("./NMEAEmitter.js");
const GPS = require("gps");
const express = require("express");
const _ = require("lodash");

const nmea_emitter = new NMEAEmitter();
const gps = new GPS();
const app = express();

app.use(express.json());

nmea_emitter.on("data", (data)=>{
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