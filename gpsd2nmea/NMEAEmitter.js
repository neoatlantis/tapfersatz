const events = require("events");
const net = require('net');
const fs = require('fs');
const path = require('path');

const GPSD_SERVER = "127.0.0.1";
const GPSD_PORT = 2947;



class NMEAEmitterWorker extends events.EventEmitter {

    #gps;

    constructor(){
        super();

        this.#gps = net.createConnection(GPSD_PORT, GPSD_SERVER, ()=>{
            console.log(`Connected to gpsd at ${GPSD_SERVER}:${GPSD_PORT}`);
            const cmd = '?WATCH={"enable":true,"json":false,"nmea":true,"raw":0}\n';
            this.#gps.write(cmd);
        });

        this.#gps.on("data", (data)=>{
            this.emit("data", data);
        });

        const on_close = ()=>{
            this.#gps.destroy();
            this.emit("close");
        };

        this.#gps.on("error", on_close);
        this.#gps.on("close", on_close);
    }

}




class NMEAEmitter extends events.EventEmitter {

    #worker;

    constructor(){
        super();

        this.#createWorker();
    }

    #createWorker(){
        this.#worker = new NMEAEmitterWorker();

        this.#worker.on("data", (data)=>{
            let lines = data
                .toString()
                .split("\n")
                .map(e=>e.trim())
                .filter(e=>e.startsWith('$G'))
            ;
            this.emit("data", lines.join('\n').toString());
        });

        this.#worker.on("close", ()=>{
            setTimeout(
                ()=>{this.#createWorker();},
                1000
            );
        });
    }

}

module.exports = NMEAEmitter;