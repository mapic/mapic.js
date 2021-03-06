M.FeedbackPane = M.Class.extend({

	initialize : function () {

		// create container
		this.initContainer();

		// shortcut	
		app.feedback = this;

		// concurrent messages stored here
		this._messages = {};

		// Used to know the order (which message is oldest)
		this._messagesArray = [];
	},

	initContainer : function () {

		// var appendHere = app.MapPane._map._controlCorners.topleft;
		var appendHere = app._appPane;

		this._container = M.DomUtil.create('div', 'feedback-pane', appendHere);
		this._innerWrapper = M.DomUtil.create('div', 'feedback-pane-inner-wrapper', this._container);

		M.DomEvent.on(this._container, 'click', M.DomEvent.stopPropagation);
	},

	set : function (options) {
		this.add(options);
	},
	
	setMessage : function (options) {
		this.add(options, 1); 	// neutral message
	},

	setSuccess : function (options) {
		this.add(options, 1);	// success message
	},
	
	setError : function (options) {
		this.add(options, 3); 	// error message
	},

	setAction : function (options) {
		this.add(options, 4); 	// action message
	},

	err : function (title, description) {
		this.setError({
			title : title, 
			description : description
		});
	},

	say : function (title, description) {
		this.setMessage({
			title : title, 
			description : description
		});
	},

	msg : function (title, description, clearDelay) {
		this.setMessage({
			title : title, 
			description : description,
			clearDelay : clearDelay || 5000
		});
	},



	add : function (message, severity) {

		// Create random number
		var id = M.Util.createRandom(5);

		// gets passed from sidepane.dataLibrary.js
		if (message.id) id = message.id;

		var options = {
			container 		: this._container,
			innerWrapper 	: this._innerWrapper,   // Used to see if inner wrapper overflow container
			id 				: id,
			severity : severity || 3 // error default
		};

		var pane = this._messages[id];
		
		if (pane) {
			
			this.update(message, severity);

		} else {

			// create and save in stack
			this._messages[id] = new M.FeedbackPane.Message(M.extend(options, message));

			// Store message boxes in array
			this._messagesArray.push(this._messages[id]);
		}

		// If messages overflow its container: remove the oldest element message
		this.checkOverflow();
	},

	// Check if message boxes overflow container, and remove the oldest message if it does
	checkOverflow : function() {
		var containerMaxHeight  = 700;
		var innerHeight 		= this._innerWrapper.offsetHeight;
		var diff 				= containerMaxHeight - 100 - innerHeight;
		
		if (diff < 0) {
			var remId = this._messagesArray[0].options.id;
			this.remove(remId);
			this._messagesArray.splice(0, 1);
		}

	},

	// Update message box, if it exists before
	update : function (message, severity) {

		var title 	   = message.title;
		var description    = message.description;
		var id 		   = message.id;
		var newTitle 	   = M.DomUtil.create('div', 'feedback-pane-title2', 	    this._messages[id]._content, title);
		var newDescription = M.DomUtil.create('div', 'feedback-pane-description2', this._messages[id]._content, description);		

		// Update severity
		this._messages[id].options.severity = severity;
		this._messages[id].setSeverity(severity);

	},

	remove : function (id) {

		// delete container and object
		var pane = this._messages[id];
		if (!pane) return;

		var container = pane._content;
		M.DomUtil.remove(container);
		delete this._messages[id];
	}
});



M.FeedbackPane.Message = M.Class.extend({

	options : {

		clearTimer : true,
		clearDelay : 5000,
		// clearDelay : 2000000, // debug 
		// transitionDelay : 0.5, 
		severityStyle : {
			1 : 'message',
			2 : 'success',
			3 : 'error',
			4 : 'action'
		}
	},

	initialize : function (options) {
		
		// set options
		M.setOptions(this, options);

		// init layout
		this.initLayout();

		// set message
		this.set();

	},

	initLayout : function () {

		// create divs
		// this._innerWrapper = M.DomUtil.create('div', 'feedback-pane-inner-wrapper', this.options.container);			

		// this._content = M.DomUtil.create('div', 'feedback-pane-content', this.options.container);
		this._content 		= M.DomUtil.create('div', 'feedback-pane-content', 	this.options.innerWrapper);
		this._title 		= M.DomUtil.create('div', 'feedback-pane-title', 	this._content);
		this._icon 			= M.DomUtil.create('div', 'feedback-pane-icon', 	this._content);
		this._iconImg 		= M.DomUtil.create('img', 'feedback-pane-icon-img', 	this._icon);
		this._description 	= M.DomUtil.create('div', 'feedback-pane-description', this._content);
		
		// set transition
		this._content.style.opacity 		 = 0;
		this._content.style.webkitTransition = 'opacity ' + this.options.transitionDelay + 's';
		this._content.style.transition 	     = 'opacity ' + this.options.transitionDelay + 's';

		// x
		this._x = M.DomUtil.create('div', 'feedback-pane-x displayNone', this._content, 'X');

		// events
		this.addEvents();

	},

	addEvents : function () {
		// close on click
		M.DomEvent.on(this._x, 'click', this.clear, this);

		M.DomEvent.on(this._content, 'mouseenter', this._mouseEnter, this);
		M.DomEvent.on(this._content, 'mouseleave', this._mouseLeave, this);
	},

	set : function () {
	
		// set view
		this.setTitle();
		this.setDescription();
		this.setSeverity();
		this.setIcon();

		// show
		this.show();

		// clear after timeout
		this.clearTimer();
	},

	_mouseEnter : function () {
		this._cancelTimer();
	},

	_mouseLeave : function () {
		this.clearTimer(this.options.clearDelay/4);
	},

	_cancelTimer : function () {
		if (this._clearTimer) clearTimeout(this._clearTimer);
	},

	clearTimer : function (delay) {
		if (!this.options.clearTimer) return;
		this._clearTimer = setTimeout(this.clear.bind(this), delay || this.options.clearDelay);
	},

	clear : function () {
		this.hide();
	},

	setTitle : function () {
		this._title.innerHTML = this.options.title;
	},

	setDescription : function () {
		this._description.innerHTML = this.options.description || '';
	},

	setIcon : function () {
		if (!this.options.icon) return;
		this._iconImg.setAttribute('src', this.options.icon);
	},

	setSeverity : function (s) {
		var s = this.options.severity;
		if (s) this.setStyle(this.options.severityStyle[s]);
	},

	setStyle : function (style) {

		var _style    = [];
		    _style[0] = this.options.severityStyle[1];
		    _style[1] = this.options.severityStyle[2];
		    _style[2] = this.options.severityStyle[3];
		    _style[3] = this.options.severityStyle[4];

		// Remove previous styles, and set the new one
		_style.forEach(function(s) {

			if ( s == style ) M.DomUtil.addClass(this._content, style);
			else 		  M.DomUtil.removeClass(this._content, s);

		}, this);

	},

	setBackground : function (color) {
		this._content.style.background = color;
	},

	hide : function () {

		this._content.style.opacity = 0;
		setTimeout(function () {
			app.feedback.remove(this.options.id);
		}.bind(this), this.options.transitionDelay * 1000); // timed with css transition
		
	},

	show : function () {
		setTimeout(function () {
			this._content.style.opacity = 1;
		}.bind(this), 5); // dom hack
	}

});


