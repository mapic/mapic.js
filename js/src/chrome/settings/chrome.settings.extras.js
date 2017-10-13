M.Chrome.SettingsContent.Extras = M.Chrome.SettingsContent.extend({

	_ : 'extras',

	options : {
		dropdown : {
			staticText : 'None',
			staticDivider : '-'
		}
	},

	_initialize : function () {

		// init container
		this._initContainer();

		// add events
		this._addEvents();
	},

	_initContainer : function () {
		// Create Container
		this._container = M.DomUtil.create('div', 'chrome chrome-content chrome-pane extras', this.options.appendTo);

	},

	_initLayout : function () {
		this._layers = this._project.getDataLayers();

		this._midSection = M.DomUtil.create('div', 'chrome-middle-section', this._container);
		this._midOuterScroller = M.DomUtil.create('div', 'chrome-middle-section-outer-scroller', this._midSection);	
		this._midInnerScroller = M.DomUtil.create('div', 'chrome-middle-section-inner-scroller', this._midOuterScroller);	

		this._initLayout_activeLayers('Layer', 'Select layer', this._midInnerScroller, this._layers);		

		// Create Field Wrapper
		this._fieldsWrapper = M.DomUtil.create('div', 'chrome-field-wrapper', this._midInnerScroller);
	},

	_selectedActiveLayer : function (value, uuid) {

		this.layerUuid = uuid || value;

		this._layer = this._project.getLayer(this.layerUuid);

		if (!this._layer) return;

		// Store uuid of layer we're working with
		this._storeActiveLayerUuid(this.layerUuid);		

		// get current style, returns default if none
		var style = this._layer.getStyling();

		this.tabindex = 1;
		this.cartoJSON = style || {};
		this.getLayerMeta();
		// Add temp layer
		this._tempaddLayer();
		// Clear
		this._fieldsWrapper.innerHTML = '';
	
		// Globesar Extras
		this.initGlobesarExtras();

	},

	// Get all metafields
	// Get all metafields
	// Get all metafields	

	getLayerMeta : function () {

		// Get layer
		var layer = this._layer = this._project.getLayer(this.layerUuid);

		// Get styling json
		this.cartoJSON = layer.getStyling();
		
		// Get layermeta
		var layerMeta = layer.getMeta();

		// Get columns
		this.columns = layerMeta.columns;

		this.metaFields = [this.options.dropdown.staticText, this.options.dropdown.staticDivider];

		for ( var k in this.columns ) {

			var isDate = this._validateDateFormat(k);

			if ( !isDate ) {
				this.metaFields.push(k);
			}
		}
	},



	// GLOBSAR EXTRAS
	// GLOBSAR EXTRAS
	// GLOBSAR EXTRAS

	initGlobesarExtras : function () {
		if ( !this.cartoJSON.extras || !this.cartoJSON.extras.referencepoint ) {

			this.cartoJSON.extras = {
				referencepoint : {
					column : false,
					value  : false
				}
			}

		}

		var wrapper = M.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper);
		var header = M.DomUtil.create('div', 'chrome-content-header globesar-extras', wrapper, 'Satellite Settings');

		this.layer = this._project.getLayer(this.layerUuid);

		var satpos = M.parse(this.layer.getSatellitePosition());
		var path = satpos.path ? satpos.path : false;
		var angle = satpos.angle ? satpos.angle : false;

		// ANGLE
		// ANGLE
		// ANGLE

		var angleLine = new M.fieldLine({
			id       : 'satelliteAngle',
			appendTo : wrapper,
			title    : 'Satellite angle',
			input    : false
		});

		var angleMiniInput = new M.button({
			id 	    : 'satelliteAngle',
			type 	    : 'miniInput',
			right 	    : true,
			isOn        : true,
			appendTo    : angleLine.container,
			value       : angle,
			placeholder : 'none',
			className   : 'globesar-extras-input',
			tabindex    : 1,
			fn 	    : this._saveMiniBlur.bind(this)
		});

		// PATH
		// PATH
		// PATH

		var pathLine = new M.fieldLine({
			id       : 'satellitePath',
			appendTo : wrapper,
			title    : 'Satellite path',
			input    : false
		});

		var pathMiniInput = new M.button({
			id 	    : 'satellitePath',
			type 	    : 'miniInput',
			right 	    : true,
			isOn        : true,
			appendTo    : pathLine.container,
			value       : path,
			placeholder : 'none',
			className   : 'globesar-extras-input',
			tabindex    : 2,
			fn 	    : this._saveMiniBlur.bind(this)
		});

	},

	// ON BLUR IN MINI FIELDS
	_saveMiniBlur : function (e) {
		var angle = M.DomUtil.get('field_mini_input_satelliteAngle').value;
		var path  = M.DomUtil.get('field_mini_input_satellitePath').value;
		this.layer = this._project.getLayer(this.layerUuid);

		// Save object
		this.satpos = {};
		if ( path ) this.satpos.path = path;
		if ( angle ) this.satpos.angle = angle;

		var satpos = this.satpos;


		// console.log('sat pos', this.layer.getSatellitePosition());

		this.layer.setSatellitePosition(JSON.stringify(satpos));

		// Update description...
		app.MapPane._controls.description.setHTMLfromStore(this.layerUuid);

	},	


	_refresh : function () {
		this._flush();
		this._initLayout();
	},

	_flush : function () {
		this._container.innerHTML = '';
	},

	// CARTO CARTO CARTO CARTO
	// CARTO CARTO CARTO CARTO
	// CARTO CARTO CARTO CARTO

	_updateStyle : function () {
		
		this.getCartoCSSFromJSON(this.cartoJSON, function (ctx, finalCarto) {
			this.saveCartoJSON(finalCarto);
		});

	},


	getCartoCSSFromJSON : function (json, callback) {

		var options = {
			styleJSON : json,
			columns : this.columns
		};

		app.api.json2carto(JSON.stringify(options), callback.bind(this));
	},	


	saveCartoJSON : function (finalCarto) {

		this._layer.setStyling(this.cartoJSON);

		var sql = this._layer.getSQL();

		// request new layer
		var layerOptions = {
			css : finalCarto, 
			sql : sql,
			layer : this._layer
		};

		this._updateLayer(layerOptions);

	},


	_updateLayer : function (options, done) {

		var css = options.css;
		var layer = options.layer;
		var file_id = layer.getFileUuid();
		var sql = options.sql;

		// var layerOptions = layer.store.data.postgis;

		// layerOptions.sql = sql;
		// layerOptions.css = css;
		// layerOptions.file_id = file_id;		

		var layerJSON = {
			geom_column: 'the_geom_3857',
			geom_type: 'geometry',
			raster_band: '',
			srid: '',
			affected_tables: '',
			interactivity: '',
			attributes: '',
			access_token: app.tokens.access_token,
			cartocss_version: '2.0.1',
			cartocss : css,
			sql: sql,
			file_id: file_id,
			return_model : true,
			layerUuid : layer.getUuid()
		};

		console.log('layerJSON', layerJSON);

		// create layer on server
		app.api.createTileLayer(layerJSON, function (err, newLayerJSON) {
			if (err) {
				app.feedback.setError({
					title : 'Something went wrong',
					description : err
				});
				return done && done(err);
			}
			// new layer
			var newLayerStyle = M.parse(newLayerJSON);

			// catch errors
			if (newLayerStyle.error) {
				done && done();
				return console.error(newLayerStyle.error);
			}


			// update layer
			layer.updateStyle(newLayerStyle);

			// return
			done && done();
		}.bind(this));

	}
});








