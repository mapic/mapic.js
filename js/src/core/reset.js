M.Reset = M.Class.extend({

	options : {
		title : 'Reset your password',
		message : 'Please create a strong password',
		sent : 'Please check your email for further instructions.',
		button : 'Reset',
		api : '/v2/users/password'
	},

	initialize : function (options) {

		// set options
		this.setOptions(options);

		// init container
		this._initContainer();

		// init content
		this._initContent();
	},

	setOptions : function (options) {
		
		// set options
		M.setOptions(this, options);

		// get token
		this._token = this.getParams('token');

		// get email
		this._email = this.getParams('email');
	},

	getParams : function (name) {
		return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
	},

	_initContainer : function () {
		this._container = M.DomUtil.get(this.options.container);
	},

	_initContent : function () {

		// logo
		this._createLogo();

		// wrapper
		this._centralWrapper = M.DomUtil.create('div', 'central', this._container);

		// login
		this._createForgot();
	},

	_createLogo : function () {

		// wrap
		var logo_wrap = M.DomUtil.create('div', 'logo-wrap', this._container);

		// logo
		var logo_img = window.systemapicConfigOptions.logos.clientLogo;
		logo_wrap.style.backgroundImage = logo_img.backgroundImage;
    		logo_wrap.style.backgroundRepeat = "no-repeat";
    		logo_wrap.style.backgroundPosition = "center";
	},


	_createForgot : function () {

		// login wrapper
		var wrapper = M.DomUtil.create('div', 'center', this._centralWrapper);

		// label
		var label = M.DomUtil.create('div', 'top-label', wrapper, this.options.title);
	
		// text
		var textWrapper = M.DomUtil.create('div', 'text-wrapper', wrapper);
		this._text = M.DomUtil.create('div', 'text-content', textWrapper);
		this._text.innerHTML = this.options.message;

		// wrapper
		this._inputs = M.DomUtil.create('form', 'input-wrapper', wrapper);
		this._inputs.setAttribute('action', this.options.api);
		this._inputs.setAttribute('method', 'post');

		// email label
		this._emailDiv = M.DomUtil.create('input', 'input reset', this._inputs, 'Email Address');
		this._emailDiv.setAttribute('name', 'email');
		this._emailDiv.value = this._email;
		this._emailDiv.setAttribute('readonly', 'readonly');

		// password label
		this._password = M.DomUtil.create('input', 'input forgot', this._inputs, 'Create a strong password');
		this._password.setAttribute('name', 'password');
		this._password.setAttribute('type', 'password');

		// pass token to POST
		this._tokenInput = M.DomUtil.create('input', 'input forgot', this._inputs);
		this._tokenInput.setAttribute('name', 'token');
		this._tokenInput.style.display = 'none';
		this._tokenInput.value = this._token;

		// button
		var button = M.DomUtil.create('button', 'button', this._inputs, this.options.button);
		button.setAttribute('type', 'submit');
		button.setAttribute('name', 'login');
		
	},

});