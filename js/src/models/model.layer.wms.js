// wms layer
M.WMSLayer = M.Model.Layer.extend({

    type : 'wms',

  
    initLayer : function () {
        if (this.layer) this.remove();
        this.update();
    },

    update : function () {
        var map = app._map;

        // prepare raster
        this._prepareLayer();
    },

    _prepareLayer : function () {

        var source = this.store.data.wms.source;
        var layers = this.store.data.wms.layers;
        var options_string = this.store.data.wms.options;
        var options = this._queryStringToJSON(options_string) || {};

        // options.source = source;
        options.layers = layers;
        options.transparent = true;
        options.format = 'image/png';

        // remember options
        this._wms_options = options;

        // create layer
        this.layer = L.tileLayer.wms(source, options);

    },

    _queryStringToJSON : function (string) {   
        if (!string) return {};         
        var pairs = string.split('&');
        
        // parse each param
        var result = {};
        pairs.forEach(function(pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });

        // parse
        var parsed = M.parse(M.stringify(result));

        return parsed;
    },

    _on_timeseries_layer_date_changed : function (e) {

        var isOn = this.getCustomOptions().listen_timeseries_event || false;
        if (!isOn) return;

        // get time
        var timestamp = e.detail.timestamp;
        var parsed_time = moment(timestamp).format('YYYY-MM-DD');

        // save time options
        this._wms_options['TIME'] = parsed_time;

        // refresh options
        this.layer.setParams(this._wms_options);        

    },

    _getFirstWMSLayer : function () {
        var wms = this.store.data.wms;
        var layer = wms.layers[0];
        return layer;
    },

    project : function () {
        return app.activeProject;
    },


    getInfoBox : function () {
        if (!this.project()._infobox) this._createInfoBox();
        return this.project()._infobox;
    },

    isWMS : function () {
        return true;
    },

    _createInfoBox : function () {
        var container = M.DomUtil.create('div', 'wms-info-box', app._appPane);
        var content = M.DomUtil.create('div', 'wms-info-box-content', container);
        var closeBtn = M.DomUtil.create('div', 'wms-info-box-close-btn', container, 'x');

        // set infobox
        this.project()._infobox = content;

        // set close event
        M.DomEvent.on(closeBtn, 'click', this.clearSelection.bind(this));
    },

    clearSelection : function () {
    
        // remove polygons
        _.forEach(this._overlays, function (o) {
            o.remove();
            delete this._overlays[o];
        }.bind(this));

        // remove description box
        var infobox = this.getInfoBox();

        // clear
        if (infobox) infobox.innerHTML = '';
    },

    _getGeocodingAddress : function (content) {
        var f = '';
        if (!content) return f;
        if (!content.results) return f;
        if (!_.size(content.results)) return f;
        return content.results[0].formatted_address;
    },

    _overlays : {},

    getExtent : function () {
        var meta = this.getMeta();
        if (!meta) return;
        var extent_geojson = meta.extent_geojson;
        if (!extent_geojson) return;
        var coordinates = extent_geojson.coordinates;
        if (!coordinates) return;
        var coords = coordinates[0];

        var extent = [
            coords[0][0],
            coords[0][1],
            coords[2][0],
            coords[2][1]
        ];
        return extent;
    },

    flyTo : function () {

        var extent = this.getExtent();

        if (!extent) return;

        var southWest = L.latLng(extent[1], extent[0]);
        var northEast = L.latLng(extent[3], extent[2]);
        var bounds = L.latLngBounds(southWest, northEast);
        var map = app._map;
        var row_count = parseInt(this.getMeta().row_count);
        var flyOptions = {};

        // if large file, don't zoom out
        if (row_count > 500000) { 
            var zoom = map.getZoom();
            flyOptions.minZoom = zoom;
        }

        // fly
        map.fitBounds(bounds, flyOptions);
    },

    deleteLayer : function () {

        // confirm
        var message = 'Are you sure you want to delete this layer? \n - ' + this.getTitle();
        if (!confirm(message)) return console.log('No layer deleted.');

        // get project
        var layerUuid = this.getUuid();
        var project = _.find(app.Projects, function (p) {
            return p.layers[layerUuid];
        });

        // delete layer
        project.deleteLayer(this);
    },

    downloadLayer : function () {
        console.log('wms downloadLayer');
    },

    isRaster : function () {
        return true;
    },

    setData : function (data) {
        if (!data) return console.error('no style to set!');
        this.store.data.postgis = data;
        this.save('data');
    },
   
    _refreshLayer : function (layerUuid) {
        this.layer.setOptions({
            layerUuid : layerUuid
        });

        this.layer.redraw();
    },

    add : function (type) {

        // mark as base or layermenu layer
        this._isBase = (type == 'baselayer');
        
        // add
        this.addTo();
    },

    ensureLayerInited : function (done) {
        if (this._inited) return done();

        // init layer
        this.initLayer();

        // and wait a bit
        setTimeout(done.bind(this), 300);
    },

    addTo : function () {

        // ensure layer is ready
        this.ensureLayerInited(function () {

            // add to map
            this._addTo();
            
            // add to controls
            this.addToControls();

        }.bind(this));
    },

    _addTo : function (type) {
        var map = app._map;

        // leaflet fn
        map.addLayer(this.layer);

        // add to active layers
        app.MapPane.addActiveLayer(this);   // includes baselayers

        // mark
        this._added = true;

        // events
        this.addHooks();

        // fire event
        M.Mixin.Events.fire('layerEnabled', { detail : {
            layer : this
        }}); 

    },

    getLegendImage : function () {
        var legendImage = this.store.legend;
        return legendImage;
    },

    _setHooks : function (on) {
        M.Mixin.Events[on]('timeseries_layer_date_changed', this._on_timeseries_layer_date_changed, this);
    },

    remove : function (map) {
        var map = map || app._map;

        // leaflet fn
        if (map.hasLayer(this.layer)) {
            map.removeLayer(this.layer);
        }
        // remove from active layers
        app.MapPane.removeActiveLayer(this);    

        // remove gridLayer if available
        if (this.gridLayer) {
            this.gridLayer._flush();
            if (map.hasLayer(this.gridLayer)) map.removeLayer(this.gridLayer); 
        }

        // remove from zIndex
        this._removeFromZIndex();

        // remove from descriptionControl if avaialbe
        var descriptionControl = app.MapPane.getControls().description;
        if (descriptionControl) descriptionControl._removeLayer(this);

        // remove overlays
        _.forEach(this._overlays, function (o) {
            o.remove();
            delete this._overlays[o];
        }.bind(this))

        this._added = false;

        // events
        this.removeHooks();

        // fire layer enabled
        this.fire('disabled', {
            layer : this
        });
    },

    isAdded : function () {
        return this._added;
    },

    getSourceURL : function () {
        return this.store.data.wms.source;
    },

    getWMSLayerString : function () {
        return this.store.data.wms.layers;
    },

    getWMSExtraOptions : function () {
        return this.store.data.wms.options;
    },

    getWMSLegend : function () {
        return this.store.legend;
    },

  

});


















M.TileServiceLayer = M.Model.Layer.extend({

    type : 'tile_service',

    options : {
        minZoom : 0,
        maxZoom : 20
    },

    initialize : function (layer) {

        // set source
        this.store = layer; // db object
        
        // data not loaded
        this.loaded = false;
    },

    _addEvents : function () {
        M.DomEvent.on(this.layer, 'loading', this.setAttribution, this);
    },

    getAttribution : function () {
        var att = app.options.attribution ? app.options.attribution + ' | ' : '';
        return att;
    },

    setAttribution : function () {
        var att = this.getAttribution();
        var attributionControl = this.getAttributionControl();
        attributionControl.clear();
        attributionControl.addAttribution(att);
    },

    initLayer : function () {
        this.update();
    },

    update : function () {
        var map = app._map;

        // prepare raster
        this._prepareRaster();
    },

    getSourceURL : function () {
        var tile_service = M.parse(this.store.data.tile_service);
        return tile_service.tile_url;
    },

    getSubdomains : function () {
         var tile_service = M.parse(this.store.data.tile_service);
        return tile_service.subdomains;
    },

    _prepareRaster : function () {

        var tile_service = M.parse(this.store.data.tile_service);
        var url = tile_service.tile_url;
        var subdomains = tile_service.subdomains;

        // add vector tile raster layer
        this.layer = L.tileLayer(url, {
            subdomains : subdomains,
            maxRequests : 0,
            tms : false,
            maxZoom : this.options.maxZoom,
            minZoom : this.options.minZoom
        });

        this._addEvents();
    },

    deleteLayer : function () {

        // confirm
        var message = 'Are you sure you want to delete this layer? \n - ' + this.getTitle();
        if (!confirm(message)) return console.log('No layer deleted.');

        // get project
        var layerUuid = this.getUuid();
        var project = _.find(app.Projects, function (p) {
            return p.layers[layerUuid];
        });

        // delete layer
        project.deleteLayer(this);
    },

});
