/**
 * sails-hook-winston-logger
 *
 * Author: Uzair Sajid <uzair@uzairsajid.com>
 * License: MIT
 *
 * A Sails.js hook for integrating Winston logging into the system.
 **/

var Winston = require("winston"),
	WinstonCloudWatch = require("winston-cloudwatch"),
	path = require("path"),
	fs = require("fs"),
	pkgJSON = require(path.resolve("package.json")),
	mkdirp = require("mkdirp"),
	_ = require("lodash");
require('winston-daily-rotate-file');
module.exports = function winstonLogger(sails) {
	var _transportsAvailable = {
		console: Winston.transports.Console,
		dailyRotate: Winston.transports.DailyRotateFile,
		cloudWatch: WinstonCloudWatch,
		cloudWatch2: WinstonCloudWatch,
	};

	var _configurationKey = null;

	return {
		defaults: {
			__configKey__: {
				console: {
					enabled: true,
					level: "info",
					timestamp: true,
					colorize: true,
					prettyPrint: true,
				},

				dailyRotate: {
					enabled: false,
					level: "info",
					filename: path.join(
						path.dirname(path.resolve("package.json")),
						"logs",
						pkgJSON.name + ".log."
					),
					timestamp: true,
					colorize: false,
					maxsize: 1024 * 1024 * 10,
					json: true,
					prettyPrint: true,
					depth: 10,
					tailable: true,
					zippedArchive: true,
					datePattern: "yyyy-MM-dd",
				},

				cloudWatch: {
					name: "cloudWatch",
					type: "cloudWatch",
					enabled: false,
					logGroupName: null,
					logStreamName: null,
					awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
					awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
					awsRegion: process.env.AWS_REGION,
				},
			},
		},

		configure: function () {
			_configurationKey = this.configKey;
            _configurationKey = 'winstonlogger';
			for (var key in sails.config[this.configKey]) {
				_.extend(
					this.defaults[this.configKey][key],
					sails.config[this.configKey][key]
				);
			}
		},

		initialize: function (cb) {
			sails.log.info(sails.config[_configurationKey]);

			sails.after(["hook:logger:loaded"], function () {
				var transports = [],
					_transportsAvailableArray =
						Object.keys(_transportsAvailable);

				var addTransport = function (transport, config) {
					if (!config.enabled) {
						return;
					}

					delete config.enabled;

					if (
						transport === Winston.transports.DailyRotateFile ||
						transport === Winston.transports.File
					) {
						var dir = path.dirname(config.filename);

						if (!fs.existsSync(dir)) {
							mkdirp.sync(dir);
						}
					}
					if (
						transport === Winston.transports.Console
					) {
                        transports.push(new (Winston.transports.Console)(config));
                        console.log('+transport Console')
                    }
					if (
						transport === Winston.transports.DailyRotateFile
					) {
                        transports.push(new (Winston.transports.DailyRotateFile)(config));
                        console.log('+transport DailyRotateFile')
                    }
					if (
						transport === Winston.transports.File
					) {
                        transports.push(new (Winston.transports.File)(config));
                        console.log('+transport File')
                    }
				};

				for (var key in sails.config[_configurationKey]) {
					if (
						_transportsAvailableArray.indexOf(
							sails.config[_configurationKey][key].type
								? sails.config[_configurationKey][key].type
								: key
						) >= 0
					) {
						addTransport(
							_transportsAvailable[
								sails.config[_configurationKey][key].type
									? sails.config[_configurationKey][key].type
									: key
							],
							sails.config[_configurationKey][key]
						);
					}
				}

				/*var logger = Winston.createLogger({
					transports: transports,
				});*/
                var logger = new Winston.Logger({
					transports: transports,
				});

				var CaptainsLog = require("captains-log");
				sails.log = new CaptainsLog({ custom: logger });

				sails.log.info("Using Winston as the default logger");

				return cb();
			});
		},
	};
};
