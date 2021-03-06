M.ErrorPane = M.Class.extend({

	options : {

		clearTimer : false,
		clearDelay : 1000,
		severityColors : {
			1 : 'yellow',
			2 : 'cyan',
			3 : 'rgba(255, 0, 0, 0.81)'
		}

	},

	initialize : function () {

		// init layout
		this.initLayout();

		// shortcut
		app.error = this;

	},

	initLayout : function () {

		// create divs
		this._container = M.DomUtil.create('div', 'error-pane displayNone', app._appPane);
		this._content = M.DomUtil.create('div', 'error-pane-content', this._container);

		this._title = M.DomUtil.create('div', 'error-pane-title', this._content);
		this._description = M.DomUtil.create('div', 'error-pane-description', this._content);
		this._icon = M.DomUtil.create('div', 'error-pane-icon', this._content);

		// x
		this._x = M.DomUtil.create('div', 'error-pane-x', this._container, 'X');

		// events
		this.addEvents();

	},

	addEvents : function () {

		// close on click
		// M.DomEvent.on(this._container, 'click', this.clear, this);

		M.DomEvent.on(this._x, 'click', this.clear, this);
	},

	set : function (title, description, severity) {
		this.setError(title, description, severity);
	},

	setError : function (title, description, severity) {

		// set view
		if (title) this.setTitle(title);
		if (description) this.setDescription(description);
		if (severity) this.setSeverity(severity);

		// show
		this.show();

		// clear after timeout
		this.clearTimer();

	},

	clearTimer : function (delay) {
		if (!this.options.clearTimer) return;
		this._clearTimer = setTimeout(this.clear.bind(this), delay || this.options.clearDelay);
	},

	clear : function () {
		this.hide();
	},

	setTitle : function (title) {
		this._title.innerHTML = title;
	},

	setDescription : function (description) {
		this._description.innerHTML = description;
	},

	setSeverity : function (s) {
		if (s) this.setBackground(this.options.severityColors[s]);
	},

	setBackground : function (color) {
		this._content.style.background = color;
	},

	hide : function () {
		M.DomUtil.addClass(this._container, 'displayNone');
	},

	show : function () {
		M.DomUtil.removeClass(this._container, 'displayNone');
	}




});