const settings = require('electron-settings');
const request = require("axios");

request.defaults.headers.post['Content-Type'] = 'application/json';
request.defaults.headers["Access-Control-Allow-Origin"] = "*";

async function heartbeat() {
	let ctlUrl = await settings.get('User.CtlUrl');
	console.info(ctlUrl);
	if (!ctlUrl || ctlUrl === 'null') return '';
	let res =  await requsetCtl(ctlUrl + '/rebotapi/mlist');
	return res && res.data ? res.data : '';
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
