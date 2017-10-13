M.acceptContact = M.Class.extend({

	options : systemapicConfigOptions,

	initialize : function (options) {

		// set options
		M.setOptions(this, options);

		// init container
		this._initContainer();

		// init content
		this._initContent();
	},

	_initContainer : function () {
		this._container = M.DomUtil.get(this.options.container);
	},

	_initContent : function () {

		// logo
		this._createLogo();

		// wrapper
		this._centralWrapper = M.DomUtil.create('div', 'central', this._container);

		this._createMessageTimer();
	},

	_createLogo : function () {

		// wrap
		var logo_wrap = M.DomUtil.create('div', 'logo-wrap', this._container);

		// logo
		var logo_img = window.systemapicConfigOptions.logos.resetPassword;
			
		logo_wrap.style.backgroundImage = logo_img.backgroundImage;
		logo_wrap.style.backgroundRepeat = "no-repeat";
		logo_wrap.style.backgroundPosition = "center";
	},

	_createMessageTimer : function () {
		var timer = 10;
		// wrapper
		this._timeMessage = M.DomUtil.create('div', 'redirect-time-message', this._centralWrapper, "Redirect to main page in 10");

		var redirectTimeInterval = setInterval(function () {
			timer -= 1;
			this._timeMessage.innerHTML = "Redirect to main page in " + timer;
			if (timer <= 0) {
				clearInterval(redirectTimeInterval);
				window.location.href = app.options.servers.portal;
			}
            
        }.bind(this), 1000);
	}

});