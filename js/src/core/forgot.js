M.Forgot = M.Class.extend({

	options : {
		title : 'Forgot password',
		message : 'Please provide your email. We will send you instructions on creating a new password.',
		sent : 'Please check your email for further instructions.',
		button : 'Submit',
		email: 'Your email address',
		api : '/api/forgot',
	},

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

		// login
		this._createForgot();

	},

	_createLogo : function () {

		// wrap
		var logo_wrap = M.DomUtil.create('div', 'logo-wrap', this._container);

		// // logo
		// var logo = M.DomUtil.create('div', 'logo', logo_wrap);

		// // set image
		// var logo_img = loginConfig.invitationLogo;
		// logo.style.backgroundImage = 'url(../' + logo_img + ')';

		// logo
		var logo = M.DomUtil.create('img', '', logo_wrap);

		// set image
		var logo_img = loginConfig.invitationLogo;
		logo.src = logo_img;
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
		this._inputs = M.DomUtil.create('div', 'input-wrapper', wrapper);

		// email label
		this._email = M.DomUtil.create('input', 'input forgot', this._inputs, this.options.email);
		this._email.setAttribute('name', 'email');

		// button
		var button = M.DomUtil.create('button', 'button', this._inputs, this.options.button);

		// click
		M.DomEvent.on(button, 'click', this._sendForgotRequest, this);

	},


	_sendForgotRequest : function (e) {

		var options = options || {
			callback : this._sent.bind(this),
			json : JSON.stringify({
				email : this._email.value
			}),
			url : 'https://' + window.location.host + this.options.api,

		}

		// set
		var callback = options.callback;
		var url = options.url;
		var http = new XMLHttpRequest();
		var json = options.json;
		
		// open
		http.open("POST", url, true);
		http.setRequestHeader('Content-type', 'application/json');
		http.onreadystatechange = function() {
			if (http.readyState == 4 && http.status == 200) {
				callback && callback(http.responseText); 
			}
		}

		// send
		http.send(json);
	},

	_sent : function (response) {
		console.log('_sent!');

		this._inputs.style.display = 'none';
		this._text.innerHTML = this.options.sent;
	},
});
