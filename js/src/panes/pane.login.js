M.Pane.Login = M.Pane.extend({

	_description : 'Sign in to Mapic',
	
	setDescription : function (text) {
		this._description = text;
	},

	open : function () {

		// select project
		M.Mixin.Events.fire('closePopups');

		// frames
		this._loginFullscreen = M.DomUtil.create('div', 'fullscreen-background', app._appPane);
		this._login_wrapper = M.DomUtil.create('div', 'login-wrapper', this._loginFullscreen);
		this._login_box = M.DomUtil.create('div', 'login-box', this._login_wrapper);

		// colors from login
		this._login_box.style.backgroundColor = app.options.logos.loginLogo.backgroundColor;
		this._login_box.style.color = app.options.logos.loginLogo.color;

		// logos
		this._createLogo();

		// login content wrapper
		this._loginInner = M.DomUtil.create('div', 'login-inner', this._login_box);
		this._forgotInner = M.DomUtil.create('div', 'login-forgot-inner', this._login_box);

		// description
		this._descriptionDiv = M.DomUtil.create('div', 'login-description', this._loginInner, this._description);
		this.login_form = M.DomUtil.create('form', 'login-form', this._loginInner);
		this.login_form.setAttribute('action', '/api/token');
		this.login_form.setAttribute('method', 'post');
		
		// email input
		this._email_input = this._createInput({
			label : 'Email',
			placeholder : 'name@domain.com',
			appendTo : this.login_form,
			type : 'email'
		});

		// password input
		this._password_input = this._createInput({
			label : 'Password',
			placeholder : 'Enter your password',
			appendTo : this.login_form,
			type : 'password'
		});

		// error feedback
		this._error_feedback = M.DomUtil.create('div', 'login-error-label', this._loginInner);

		// buttons wrapper
		this._buttons = M.DomUtil.create('div', 'login-buttons-wrapper', this._loginInner);

		// button
		this._loginBtn = M.DomUtil.create('div', 'smooth-fullscreen-save invite', this._buttons, 'Login');
		
		// cancel button
		this._cancelBtn = M.DomUtil.create('div', 'smooth-fullscreen-save invite cancel', this._buttons, 'Cancel');

		// forgot password
		this._forgotLink = M.DomUtil.create('a', 'login-forgot-link', this._buttons, 'Forgot your password?');

		// add events
		this.addEvents();

		// focus
		this._email_input.focus();
	},

	_createLogo : function () {
		var logoConfig = app.options.logos.loginLogo;
		var logo = M.DomUtil.create('div', 'login-popup-logo', this._login_box);
		logo.style.backgroundImage = logoConfig.image;
		logo.style.height = logoConfig.height;
		logo.style.width = logoConfig.width;
		logo.style.backgroundSize = logoConfig.backgroundSize;
		logo.style.backgroundPosition = logoConfig.backgroundPosition;
	},

	_openForgotPassword : function () {

		// hide login
		M.DomUtil.addClass(this._loginInner, 'displayNone');

		// add buttons
		this._forgotDescriptionDiv = M.DomUtil.create('div', 'login-description', this._forgotInner, 'Request password reset');

		// add input
		this._forgot_input = this._createInput({
			label : 'Email',
			placeholder : 'Enter your email',
			appendTo : this._forgotInner,
			type : 'email'
		});

		// buttons wrapper
		this._forgotButtons = M.DomUtil.create('div', 'login-buttons-wrapper', this._forgotInner);

		// button
		this._resetBtn = M.DomUtil.create('div', 'smooth-fullscreen-save invite', this._forgotButtons, 'Reset');
		
		// cancel button
		this._forgotCancelBtn = M.DomUtil.create('div', 'smooth-fullscreen-save invite cancel', this._forgotButtons, 'Cancel');

		// events
		M.DomEvent.on(this._forgotCancelBtn, 'click', this.close, this);
		M.DomEvent.on(this._resetBtn, 'click', this.requestReset, this);

		// set height
		this._login_box.style.height = '340px';
	},

	requestReset : function () {
		var email = this._forgot_input.value;

		app.api.resetPassword({
			email : email
		}, function (err, result) {
			if (err) {
				app.feedback.setError({
					title : 'Something went wrong.',
				});
			} else {
				app.feedback.setMessage({
					title : 'Password reset',
					description : result
				});
			}

			// close window
			this.close();

		}.bind(this));
	},

	addEvents : function () {
		// add events
		// M.DomEvent.on(this._loginFullscreen, 'click', this.close, this);
		M.DomEvent.on(this._login_box, 'click', M.DomEvent.stop, this);
		M.DomEvent.on(this._loginBtn, 'click', this._doLogin, this);
		M.DomEvent.on(this._cancelBtn, 'click', this.close, this);
		M.DomEvent.on(this._password_input, 'keydown', this._checkEnter, this);
		M.DomEvent.on(this._forgotLink, 'click', this._openForgotPassword, this);
		M.DomEvent.on(window, 'keydown', this._keyDown, this);
	},

	removeEvents : function () {
		// remove events
		// M.DomEvent.off(this._loginFullscreen, 'click', this.close, this);
		M.DomEvent.off(this._login_box, 'click', M.DomEvent.stop, this);
		M.DomEvent.off(this._loginBtn, 'click', this._doLogin, this);
		M.DomEvent.off(this._cancelBtn, 'click', this.close, this);
		M.DomEvent.off(this._password_input, 'keydown', this._checkEnter, this);
		M.DomEvent.off(window, 'keydown', this._keyDown, this);

	},

	_keyDown : function (e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 27) { //Enter keycode
			this.close(e);
		}
	},

	_checkEnter : function (e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) { //Enter keycode	
			this._doLogin(e);
		}	
	},

	_doLogin : function (e) {
		M.DomEvent.stop(e);

		// clear feedback
		this._error_feedback.innerHTML = '';

		// get fields
		var email = this._email_input.value;
		var password = this._password_input.value;

		// get token from user/pass from server
		app.api.getTokenFromPassword({
			email : email,
			password : password
		}, this._didLogin.bind(this));
	},

	_didLogin : function (err, result) {
		var tokens = M.parse(result);

		// invalid credentials
		if (err && err == 400) {
			// set error feedback
			return this._error_feedback.innerHTML = tokens.error.message;
		}

		// set tokens
		app.tokens = tokens;

		// reload portal
		window.location = app.options.servers.portal;
	},

	_createInput : function (options) {

		var appendTo = options.appendTo;
		var label = options.label;
		var type = options.type;
		var placeholder = options.placeholder;

		// label
		var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label invite-emails', appendTo, label);
		
		// container
		var invite_container = M.DomUtil.create('div', 'invite-container narrow', appendTo);
		var invite_inner = M.DomUtil.create('div', 'invite-inner', invite_container);
		var invite_input_container = M.DomUtil.create('div', 'invite-input-container', invite_inner);

		// input box
		var invite_input = M.DomUtil.create('input', 'invite-email-input-form', invite_input_container);
		var invite_error = M.DomUtil.create('div', 'smooth-fullscreen-error-label', appendTo);
		if (type) invite_input.setAttribute('type', type);
		if (placeholder) invite_input.setAttribute('placeholder', placeholder);

		return invite_input;
	},

	close : function () {
		this.removeEvents();
		M.DomUtil.remove(this._loginFullscreen);
	},

	_onCloseMenuTabs : function () {
		this.close();
	}

});