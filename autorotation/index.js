const { exec } = require('child_process');
const dbus = require('dbus-next');
const systemBus = dbus.systemBus();

const SCREEN_NAME = "eDP-1";

const IFACE = "net.hadess.SensorProxy";
const PROPS_IFACE = 'org.freedesktop.DBus.Properties';

async function main(){

    let obj = await systemBus.getProxyObject(
        'net.hadess.SensorProxy',
        '/net/hadess/SensorProxy'
    );

    const iface = obj.getInterface(IFACE);
    const props = obj.getInterface(PROPS_IFACE);

    async function getOrientation(){
    	await iface.ClaimAccelerometer();
    	let ret = await props.Get(IFACE, 'AccelerometerOrientation');
    	iface.ReleaseAccelerometer();
    	return ret.value;
    }

    const hasAccel = await props.Get(IFACE, 'HasAccelerometer');

    let orientation_value = null;

    async function detectOrientationChange(){
    	if(!hasAccel.value) return; // Do nothing if no accelerometer installed

    	let old_value = orientation_value;
    	orientation_value = await getOrientation();

    	if(old_value == orientation_value) return; // no change

    	const command_map = {
    		"right-up" : "right",
    		"left-up"  : "left",
    		"bottom-up": "inverted",
    	}[orientation_value] || "normal";

    	const cmd = `xrandr --output ${SCREEN_NAME} --rotate ${command_map}`;

    	console.log(
    		`Screen orientation changed: ${old_value}->${orientation_value}`);
    	console.log(cmd);

    	try{
    		exec(cmd);
    	} catch(e){
    		console.log("Failed executing command.", e);
    	}

    }
    

    // query current state
    
	setInterval(async ()=>{
		await detectOrientationChange();
	}, 1500);
        

    /*props.on("PropertiesChanged", (iface, changed, invalidated)=>{
    	console.log("PropertiesChanged", iface, changed);
    });*/ // not working, not know why

}

main();