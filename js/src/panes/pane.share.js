M.Share = M.Pane.extend({
	
	type : 'share',
	title : 'Share',

	options : {
		permissions : [{
			title : 'View project',
			permission : 'read_project',
			checked : true,
			enabled : false
		},{
			title : 'Download data',
			permission : 'download_file',
			checked : false,
			enabled : true
		},{
			title : 'Invite others',
			permission : 'share_project',
			checked : true,
			enabled : true
		}],

		text : {
			screenshot : 'Create screenshot',
			invite : 'Invite others to project',
			creating : 'Creating screenshot...'
		}
	},

	initialize : function (options) {

		// set options
		M.setOptions(this, options);

		// init container
		this._initContent();
		
		// listen up (events on parent)
		this._listen();
	},      

	_initContent : function () {

		// create layout
		this._initLayout();

		// put button in top chrome
		this._registerButton();
	},

	_initLayout : function () {

		// create dropdown
		this._shareDropdown = M.DomUtil.create('div', 'share-dropdown displayNone', app._appPane);

		// items
		this._shareImageButton = M.DomUtil.create('div', 'share-item', this._shareDropdown);
		this._shareInviteButton  = M.DomUtil.create('div', 'share-item', this._shareDropdown);
		this._feedbackButton = M.DomUtil.create('div', 'share-item-processing', this._shareDropdown);

		// events
		M.DomEvent.on(this._shareImageButton,  'click', this._shareImage, this);
	},

	_registerButton : function () {

		// register button in top chrome
		var top = app.Chrome.Top;

		// add a button to top chrome
		this._shareButton = top._registerButton({
			name : 'share',
			className : 'chrome-button share',
			trigger : this._togglePane,
			context : this,
			project_dependent : true
		});

		// share icon
		this._shareButton.innerHTML = '<i class="fa fa-paper-plane"></i>';
	},

	_togglePane : function () {
		this._isOpen ? this._close() : this._open();
	},

	_setFeedback : function (msg) {
		this._feedbackButton.innerHTML = msg;
		M.DomUtil.addClass(this._feedbackButton, 'invite-feedback-active');

	},

	_closeFeedback : function () {
		this._feedbackButton.innerHTML = '';
		M.DomUtil.removeClass(this._feedbackButton, 'invite-feedback-active');
	},

	_open : function () {

		// close other tabs
		M.Mixin.Events.fire('closeMenuTabs');

		M.DomUtil.removeClass(this._shareDropdown, 'displayNone');
		this._isOpen = true;

		// mark button active
		M.DomUtil.addClass(this._shareButton, 'active');

		// fill titles
		this._fillTitles();
	},

	_close : function () {
		M.DomUtil.addClass(this._shareDropdown, 'displayNone');
		this._isOpen = false;

		// remove links if open
		if (this._shareLinkWrapper) M.DomUtil.remove(this._shareLinkWrapper);
		if (this._sharePDFInput) M.DomUtil.remove(this._sharePDFInput);
		if (this._inviteWrapper) M.DomUtil.remove(this._inviteWrapper);
		
		this._shareInviteButton.innerHTML = this.options.text.invite;
		M.DomUtil.removeClass(this._shareDropdown, 'wide-share');

		// mark button inactive
		M.DomUtil.removeClass(this._shareButton, 'active');

		// close feedback
		this._closeFeedback();
	},

	_onCloseMenuTabs : function () {
		this._close();
	},


	_fillTitles : function () {
		this._shareImageButton.innerHTML = this.options.text.screenshot;
		this._shareInviteButton.innerHTML = this.options.text.invite;
	},

	_clearTitles : function () {
		this._shareImageButton.innerHTML = '';
		this._shareInviteButton.innerHTML = '';
	},

	_addGhost : function () {
		this._ghost = M.DomUtil.create('div', 'share-ghost', app._appPane);
		M.DomEvent.on(this._ghost, 'click', this._close, this);
	},

	_removeGhost : function () {
		if (!this._ghost) return; 
		M.DomEvent.off(this._ghost, 'click', this._close, this);
		M.DomUtil.remove(this._ghost);
	},

	// on select project
	_refresh : function () {

		var project = this._project;

		if (project.isShareable()) {
			M.DomUtil.removeClass(this._shareInviteButton, 'disabled');
			M.DomEvent.on(this._shareInviteButton, 'click', this._shareInvite, this);
		} else {
			M.DomUtil.addClass(this._shareInviteButton, 'disabled');
			M.DomEvent.off(this._shareInviteButton, 'click', this._shareInvite, this);
		}
		
	},

	_shareImage : function () {

		// take snap
		app.phantomjs.snap(function (err, file) {

			// open image in new tab
			this.openImage(err, file);

		}.bind(this));

		// set progress bar for a 10sec run
		app.ProgressBar.timedProgress(3000);

		// set feedback
		this._setFeedback(this.options.text.creating);

		app.log('screenshot', {info : {
			project_name : app.activeProject.getName()
		}})
	},

	openImage : function (context, file, c) {

		// parse results
		var result = M.parse(file);
		var image = result.image;
		var path = app.options.servers.portal;
		path += 'pixels/';
		path += image;
		path += '?raw=true'; // add raw to path
		path += '&access_token=' + app.tokens.access_token;

		// open (note: some browsers will block pop-ups. todo: test browsers!)
		window.open(path, 'mywindow')

		// close share dropdown
		this._close();

		var project = app.activeProject;

		// set feedback
		this._setFeedback('Done!');

	},

	_shareInvite : function () {
		app.Chrome.Left._tabs.projects.openShare();
		this._close();
	}

});
