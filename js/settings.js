const settings = require('electron-settings');

// Defaults value for every functionality
settings.defaults({
	User: {
		SerialNo: 'null',
		Mail: 'null',
		Nick: 'null'
	},
	AutoLog: 'false',
});

// Fill inputs with account informations
function fillInAccountInformations() {
	settings.get('User.Username').then(user => {
		var username = user;
		settings.get('User.Password').then(pass => {
			var password = pass;
			webview.executeJavaScript("document.getElementById('email').value ='" + username + "';");
			webview.executeJavaScript("document.getElementById('pass').value ='" + password + "';");
		});
	});
}

// Same as before, and click on the login-button
function logAccount() {
	webview.executeJavaScript("document.getElementById('loginbutton').click();");
}

function storeLoginAndPassword(serialNo, mail, nick) {
	//todo
	if (serialNo.length != 3) {
		$('#userErr').show("slow");
		$('#userErr').html('手机号码有误！');
		return false;
	}

	if (mail && nick) {
		settings.set('User', {
			'SerialNo': serialNo,
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
		'Mail': 'null',
		'Nick': 'null'
	});
}

// Enable or disable the Auto-Log functionality
function setAutoLog(enabled) {
	settings.set('AutoLog', enabled);
}
