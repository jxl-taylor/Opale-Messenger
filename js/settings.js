const settings = require('electron-settings');
const request = require("axios");

// Defaults value for every functionality
settings.defaults({
	User: {
		SerialNo: 'null',
		CtlUrl: 'null',
		Mail: 'null',
		Nick: 'null'
	},
	AutoLog: 'false',
});

async function setCtlUrl() {
	let hbRes = await requsetCtl($('#iCtlUrl').val());
	console.info(JSON.stringify(hbRes));
	if (!hbRes) {
		$('#userErr').html('控制中心地址无法连接');
		$('#userErr').show("slow");
		$('#iCtlUrl').focus();
		return false;
	} else {
		$('#userErr').hide();
		return true;
	}
}

function storeLoginAndPassword(serialNo, ctlUrl, mail, nick) {
	if (!ctlUrl) {
		$('#userErr').show("slow");
		$('#userErr').html('控制中心地址必填！');
		return false;
	}
	//todo
	if (serialNo.length != 3) {
		$('#userErr').show("slow");
		$('#userErr').html('手机号码有误！');
		return false;
	}

	if (mail && nick) {
		settings.set('User', {
			'SerialNo': serialNo,
			'CtlUrl': ctlUrl,
			'Mail': mail,
			'Nick': nick
		});
		return true;
	} else
		return false;

}

// Set the account informations back to defaults
function resetLoginAndPassword() {
	settings.set('User', {
		'SerialNo': 'null',
		'CtlUrl': 'null',
		'Mail': 'null',
		'Nick': 'null'
	});
}

// Enable or disable the Auto-Log functionality
function setAutoLog(enabled) {
	settings.set('AutoLog', enabled);
}

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

module.exports = {heartbeat}
