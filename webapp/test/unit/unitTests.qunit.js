/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zsd_delivery_creation/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
