const settings = require('electron-settings');
const request = require("axios");

async function heartbeat() {
	let ctlUrl = await settings.get('User.CtlUrl');
	console.info(ctlUrl);
	if (!ctlUrl || ctlUrl === 'null') return '';
	return await requsetCtl(ctlUrl);
}

async function requsetCtl(sCtlUrl) {
	let res = null;
	try {
		res = await request({
			method: "POST",
			url: `${sCtlUrl}/api/assit`,
			data: {}
		});
	} catch (e) {
		console.error(e);
	}

	return res && res.data ? res.data : '';
}

exports.heartbeat = heartbeat;
exports.requsetCtl = requsetCtl;
