/*
 *
 *   ---------------------------------- GLOBAL VARS DECLARATIONS ----------------------------------
 *
 */
// const electron = require('electron');
const {app, globalShortcut, ipcMain, BrowserWindow, Tray, Menu, screen} = require('electron');
const myCommon = require("./js/common");

// For the window
const w = 530;
const h = 480;
var posExplicitlyChanged = false;
var posBubbleChanged = false;

// For the bubble
const bW = 80;
const bH = 80;

// For useful things
const dir = __dirname;
const path = require('path');
const filePath = 'file://' + dir;

/*
 *
 *   ---------------------------------- ELECTRON DECLARATIONS ----------------------------------
 *
 */
const fs = require('fs');
// const {
//     ipcMain
// } = require('electron');
// const app = electron.app;
// const globalShortcut = require('electron').globalShortcut;

/*
 *
 *   ---------------------------------- WINDOW DECLARATIONS ----------------------------------
 *
 */
// const BrowserWindow = electron.BrowserWindow;
let mainWindow;
let bubble;

/*
 *
 *   ---------------------------------- TRAY DECLARATIONS ----------------------------------
 *
 */
// const Tray = require('electron').Tray;
// const Menu = require('electron').Menu;
let tray = null;

/*
 *
 *   ---------------------------------- APP & WINDOW DEFINITIONS ----------------------------------
 *
 */


function createMain() {

	createMainWindow();

	// IPC PART
	ipcMain.on('toggle-window', () => {
		if (!posBubbleChanged && bubble.isFocused()) {
			mainWindow.webContents.reload();
			bubble.webContents.send('message-read');
			if (mainWindow.isVisible()) {
				mainWindow.show();
			} else {
				if (!posExplicitlyChanged) deduceNewWindowPos();
				mainWindow.unmaximize();
				mainWindow.show();
				mainWindow.focus();

			}
		}
		posBubbleChanged = false;
	});


	ipcMain.on('read-message', (event, arg) => {
		mainWindow.webContents.reload();
		bubble.webContents.send('message-read');
		if (!mainWindow.isVisible()) {
			mainWindow.show();
		}
		mainWindow.focus();
	});

	ipcMain.on('new-message', (event, arg) => {
		if (mainWindow != null && !mainWindow.isFocused()) bubble.webContents.send('new-message', arg);
	});

	ipcMain.on('hide-bubble', () => {
		bubble.hide();
	});

	ipcMain.on('position-changed', () => {
		if (!posExplicitlyChanged) posExplicitlyChanged = true;
	});

	ipcMain.on('bubble-position-changed', () => {
		if (!posBubbleChanged) posBubbleChanged = true;
	});

	ipcMain.on('maximize-window', () => {
		mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
	});

	ipcMain.on('minimize-window', () => {
		mainWindow.minimize();
	});

	ipcMain.on('close-window', () => {
		posExplicitlyChanged = false;
		posBubbleChanged = false;
		mainWindow.hide();
	});


	// Shortcuts
	globalShortcut.register('Alt+A', () => {
		if (mainWindow.isVisible()) {
			mainWindow.blur();
		} else {
			if (!posExplicitlyChanged) deduceNewWindowPos();
			mainWindow.unmaximize();
			mainWindow.show();
			mainWindow.focus();
			bubble.webContents.send('new-message', '');
		}
	});

	globalShortcut.register('Alt+Q', () => {
		if (bubble.isVisible()) {
			bubble.hide();
		} else {
			bubble.show();
		}
	});

	globalShortcut.register('Alt+Z', () => {
		bubble.blur();
	});
}


// Triggered when the app is created and ready to use, this one creates the window responsible for displaying the Messenger app
app.on('ready', createMain);

// Triggered when the app is created and ready to use, this one creates the window responsible for displaying the bubble
app.on('ready', function () {
	if (process.platform == 'darwin')
		app.dock.hide();

	let size = screen.getPrimaryDisplay().workAreaSize;
	let bPosX = parseInt(size.width * 0.9);
	let bPosY = parseInt(size.height * 0.8);

	bubble = new BrowserWindow({
		x: bPosX,
		y: bPosY,
		width: bW,
		height: bH,
		maxWidth: bW,
		maxHeight: bH,
		frame: false,
		show: false,
		alwaysOnTop: true,
		type: 'toolbar',
		icon: './images/favicon256.ico',
		transparent: true,
		acceptFirstMouse: true,
		resizable: false,
		skipTaskbar: true,
		webPreferences: {
			nodeIntegration: true
		}
	});
	bubble.setMenu(null);
	bubble.loadURL(filePath + '/bubble.html');

	// Tray part. It allows the user to hide/show the bubble, and to quit the application
	if (process.platform != 'darwin') {
		tray = new Tray(path.join(__dirname, '/images/faviconTray.ico'));
		tray.on('click', () => {
			bubble.isVisible() ? bubble.hide() : bubble.show();
		});
	} else
		tray = new Tray(path.join(__dirname, '/images/faviconTray.ico'));


	const template = [
		{
			label: '小助手',
			role: 'show',
			click() {
				bubble.isVisible() ? bubble.hide() : bubble.show();
			}
		},
		{
			label: '退出',
			role: 'close',
			click() {
				bubble.close();
			}
		}
	];
	tray.setContextMenu(Menu.buildFromTemplate(template));
	tray.setToolTip('Opale');

	bubble.webContents.on('did-finish-load', () => {
		bubble.showInactive();
	});

	// When a new window is created, open it in the default browser so that we don't have to handle it in our electron app
	bubble.webContents.on('new-window', function (event, url) {
		event.preventDefault();
		shell.openExternal(url);
	});

	bubble.on('closed', () => {
		bubble = null;
		mainWindow = null;
		tray.destroy();
		app.quit();
	});

	buildContextMenu();
});

// Triggered when the app's window is closed, or when all the windows are closed if there are many
app.on('window-all-closed', () => {
	if (process.platform != 'darwin') // On Mac OS, it's common to keep the software running till the user explicitly stops it with Cmd+Q
		app.quit();
});

app.on('will-quit', () => {
	globalShortcut.unregisterAll();
});


//启动定时器
setInterval(async function () {
	try {
		let res = await myCommon.heartbeat();
		if (!res) console.warn('控制中心未配置');
		else {
			console.info(JSON.stringify(res));
			if (res.messageNum && res.messageNum > 0)
				bubble.webContents.send('message-received', res.messageNum);
		}
	} catch (err) {
		console.error(err);
	}
}, 15000);

function deduceNewWindowPos() {
	const {
		width,
		height
	} = require('electron').screen.getPrimaryDisplay().workAreaSize;
	var bX = bubble.getPosition()[0];
	var bY = bubble.getPosition()[1];
	var wW = mainWindow.getSize()[0];
	var wH = mainWindow.getSize()[1];

	var newX = 0;
	var newY = 0;

	if (bX + wW > width)
		newX = bX - wW;
	else
		newX = Math.abs(bX);
	if (bY + wH > height)
		newY = bY - wH;
	else
		newY = Math.abs(bY);
	mainWindow.setPosition(newX, newY);
}

function createMainWindow() {

	let size = screen.getPrimaryDisplay().workAreaSize;

	//如果任务栏要显示窗口，需要skipTaskbar 、type 都去掉
	mainWindow = new BrowserWindow({
		width: parseInt(size.width * 0.5),
		height: parseInt(size.height * 0.7),
		icon: './images/favicon256.ico',
		frame: false,
		show: false,
		resizable: true,
		acceptFirstMouse: true,
		// skipTaskbar: true,
		// type: 'toolbar',
		webPreferences: {
			webviewTag: true,
			nodeIntegration: true
		}
	});

	mainWindow.loadURL(filePath + '/index.html');
	mainWindow.setMenu(null);

	// This event is triggered when the window is unfocused
	// mainWindow.on('blur', () => {
	// 	if (!bubble.isFocused())
	// 		bubble.webContents.send('hide-window');
	// });

	// This event is triggered when the window is focused
	mainWindow.on('focus', () => {
		bubble.webContents.send('stop-blink');
	});

	// This event is triggered when the window is closed via Alt+F4 or such
	mainWindow.on('close', function (event) {
		if (bubble != null) {
			event.preventDefault();
			mainWindow.hide();
			bubble.blur();
			posExplicitlyChanged = false;
		}
	});
	// mainWindow.webContents.openDevTools();
}

function buildContextMenu() {
	// Context-Menu for the bubble
	require('electron-context-menu')({
		window: bubble,
		prepend: (params, window) => [
			{
				label: "隐藏小助手",
				click() {
					bubble.hide();
				}
			},
			{
				label: "退出",
				click() {
					bubble.close();
				}
			}],
		showInspectElement: false
	});
}
