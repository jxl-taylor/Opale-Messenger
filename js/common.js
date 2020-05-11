const settings = require('electron-settings');
const request = require("axios");

request.defaults.headers = {
	"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
}

async function heartbeat() {
	let ctlUrl = await settings.get('User.CtlUrl');
	console.info(ctlUrl);
	if (!ctlUrl || ctlUrl === 'null') return '';
	return await requsetCtl(ctlUrl + '/rebotapi/mlist');
}

async function requsetCtl(sCtlUrl) {
	let res = null;
	try {
		res = await request({
			method: "POST",
			url: sCtlUrl,
			data: {}
		});
	} catch (e) {
		console.error(e);
	}

	return res && res.data ? res.data : '';
}

exports.heartbeat = heartbeat;
exports.requsetCtl = requsetCtl;
