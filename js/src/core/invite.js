M.Invite = M.Class.extend({

	initialize : function (options) {


		// set options
		M.setOptions(this, options);

		// invite store
		this._invite = window.invite_store;

		// init container
		this._initContainer();

		// init content
		this._initContent();
	},

	_initContainer : function () {
		this._header = M.DomUtil.get(this.options.header);
		this._footer = M.DomUtil.get(this.options.footer);
		this._container = M.DomUtil.get(this.options.id);
	},

	_initContent : function () {

		// taco
		var wrapper = this._wrapper = M.DomUtil.create('div', 'invite-wrapper', this._header);

		// get some invite info
		var invited_by = this._invite.invited_by.firstName + ' ' + this._invite.invited_by.lastName;
		var company = this._invite.invited_by.company ? this._invite.invited_by.company : '';
		var projectName = this._invite.project.name;

		// create header
		var headerTitle = 'You have been invited to collaborate.';// + invited_by;
		headerTitle += '<br>Project: ' + projectName;
		headerTitle += '<br>Invited by: ' + invited_by.camelize();
		if (company) headerTitle += ' (' + company.camelize() +')';
		var headerTitleDiv = M.DomUtil.create('div', 'invite-header-title', wrapper, headerTitle);

		// login instead of register if you have account
		var link = window.location.origin + '/login?invite=' + this._invite.token;
		var loginText = '(If you already have an account, please <a href="' + link + '">login</a> and try link again.)';
		var loginTextDiv = M.DomUtil.create('div', 'invite-login-title', wrapper, loginText);

		// add invite token to form
		var input_token = M.DomUtil.get('invite_token');
		input_token.value = this._invite.token;

	},

});