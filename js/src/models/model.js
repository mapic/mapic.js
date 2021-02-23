M.Model = M.Evented.extend({

	initialize : function (options) {

		// set options
		M.setOptions(this, options);

		// local initialize
		this._initialize(options);

		// listen up
		this._listen();
	},      

	_listen : function () {
		M.Mixin.Events.on('projectSelected', this._projectSelected, this);
		M.Mixin.Events.on('editEnabled',     this._editEnabled, this);
		M.Mixin.Events.on('editDisabled',    this._editDisabled, this);
		M.Mixin.Events.on('layerEnabled',    this._layerEnabled, this);
		M.Mixin.Events.on('layerDisabled',   this._layerDisabled, this);
		M.Mixin.Events.on('fileImported',    this._onFileImported, this);
		M.Mixin.Events.on('fileDeleted',     this._onFileDeleted, this);
		M.Mixin.Events.on('layerAdded',      this._onLayerAdded, this);
		M.Mixin.Events.on('layerEdited',     this._onLayerEdited, this);
		M.Mixin.Events.on('layerDeleted',    this._onLayerDeleted, this);
		M.Mixin.Events.on('projectChanged',  this._onProjectChanged, this);
		M.Mixin.Events.on('animationPlay',   this._onAnimationPlay, this);
		M.Mixin.Events.on('animationStop',   this._onAnimationStop, this);
		M.Mixin.Events.on('animationSlide',  this._onAnimationSlide, this);
		M.Mixin.Events.on('setFPS',   		 this._onSetFPS, this);
		M.Mixin.Events.on('mapClick',   	 this._onMapClick, this);
		M.Mixin.Events.on('sliderSet',  	 this._onSliderSet, this);
		M.Mixin.Events.on('sliderUpdate',    this._onSliderUpdate, this);
		
		// file events
		var event_id = 'downloadReady-' + this.getUuid();
		M.Mixin.Events.on(event_id, this._onDownloadReady, this);

		this.on('showLabels', this._onShowLabels);
		this.on('hideLabels', this._onHideLabels);

	},

	_projectSelected : function (e) {

		var projectUuid = e.detail.projectUuid;

		if (!projectUuid) return;

		// set project
		this._project = app.activeProject = app.Projects[projectUuid];

		// refresh pane
		this._refresh();
	},

	
	// dummies
	_initialize 	 : function () {},
	_initContainer   : function () {},
	_editEnabled 	 : function () {},
	_editDisabled 	 : function () {},
	_layerEnabled 	 : function () {},
	_layerDisabled 	 : function () {},
	_updateView 	 : function () {},
	_refresh 	 	 : function () {},
	_onFileImported  : function () {},
	_onFileDeleted   : function () {},
	_onLayerAdded    : function () {},
	_onLayerEdited   : function () {},
	_onLayerDeleted  : function () {},
	_onDownloadReady : function () {},
	_onProjectChanged: function () {},
	_onAnimationPlay : function () {},
	_onAnimationStop : function () {},
	_onAnimationSlide: function () {},
	_onSetFPS 		 : function () {},
	_onCubeEdited	 : function () {},
	_onSliderSet	 : function () {},
	_onSliderUpdate	 : function () {},
	_onMapClick		 : function () {},
	_onShowLabels	 : function () {},
	_onHideLabels	 : function () {},

});