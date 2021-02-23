M.Model.Layer.GeoJSONMaskLayer = M.Model.Layer.extend({

    type : 'geojson-mask',

    options : {
        style : {
            fillColor : 'blue',
            weight : 0.5,
            fillOpacity : 0.6,

        }
    },

    initialize : function (options) {
        
        // set options
        M.setOptions(this, options);

        // set map
        this._map = app._map;

        // init layer
        this._initLayer();

    },

    _initLayer : function () {

        // ensure simple geometry of geojson (as far as possible) // todo: move to import
        var geojson = this.ensureFlat(this.options.geojson);

        if (_.isString(geojson)) {
            geojson = M.parse(geojson);
        }

        // create geojson layer
        this.layer = L.geoJson(geojson);

        // set default style
        this.layer.setStyle(this.options.style);
    },

    ensureFlat : function (geojson) {
        // return geojson;
        // combine features of feature collection
        // todo: may not work with multipolygons
        if (_.size(geojson.features) > 1 && geojson.type == 'FeatureCollection') {
            geojson = this.mergePolygons(geojson);
        }
        return geojson;
    },

    // merge multifeatured polygon into flat polygon
    // ---------------------------------------------
    // geojson can be uploaded with multiple features, they are merged here...
    // 
    // see https://github.com/Turfjs/turf/blob/393013ff3f24c71fb7dd9dac99435271d94c0e06/CHANGELOG.md#301
    // and http://morganherlocker.com/post/Merge-a-Set-of-Polygons-with-turf/
    mergePolygons : function (polygons) {
        var merged = _.clone(polygons.features[0]);
        var features = polygons.features;
        for (var i = 0, len = features.length; i < len; i++) {
            var poly = features[i];
            if (poly.geometry) merged = turf.union(merged, poly);
        }
        return merged;
    },

    getLayer : function () {
        return this.layer;
    },

    add : function () {
        this._map.addLayer(this.layer);
    },

    remove : function () {
        this._map.removeLayer(this.layer);
    },

});



M.Model.Layer.GeoJSONLayer = M.Model.Layer.extend({

    type : 'geojson',

    options : {
        style : {
            fillColor : 'blue',
            weight : 0.5,
            fillOpacity : 0.6,

        }
    },

    initialize : function (layer) {
        
        // set store
        this.store = layer;

        // init layer
        this._initLayer();

    },

    _initLayer : function () {
        if (!this.store || !this.store.data || !this.store.data.geojson7946) return console.error('Invalid GeoJSON', this);

        if (this.layer) this.remove();

        // parse geojson
        this._geojson = M.parse(this.store.data.geojson7946.geojson);

        // create geojson layer
        this.layer = L.geoJson(this._geojson);

        // set style
        this.setStyle();

        // set popup
        this.refreshPopup();

    },

    refresh : function () {
        this.refreshPopup();
        this.setStyle();
        this._initLayer();
    },

    refreshPopup : function () {
        if (this._popup) this.layer.unbindPopup();
        this.setPopup();
    },

    setStyle : function () {
        var style = this.getStyle();
        this.layer.setStyle(style);
    },

    setPopup : function () {
        var popup = this.store.data.geojson7946.popup;
        if (!popup) return;
        if (!this._geojson) return;

        // set properties.popup
        this._geojson.properties = this._geojson.properties || {};
        this._geojson.properties.popup = popup;

        this.layer.bindPopup(popup, {
            className : 'geojson-popup'
        });
    },

    getStyle : function () {

        // lookup saved style
        var style = this.store.data.geojson7946.style;
        
        // return default style
        if (!style) return this.options.style;
        
        // saved style might function string
        if (_.includes(style, 'function')) {
            try {

            var style_fn = 'var geojson_style_function = ' + style;
            eval(style_fn);
            return geojson_style_function;

            } catch (e) {
                console.error('error parsing style function: ', style_fn);
                return this.option.style;
            }

        }

        // saved style might be json
        var parsed_style = M.parse(style);
        if (parsed_style) {
            return parsed_style;
        } else {

            console.error('error parsing style: ', style);

            // default
            return this.options.style;
        }
    },

    getStyleString : function (){
        var style = this.getStyle();
        if (_.isObject(style)) {
            var string = M.stringify(style);
            if (!string) {
                string = style.toString();
            }
            return string;
        }
        return style;

    },

    getLayer : function () {
        return this.layer;
    },

    add : function () {
        // add to map
        this._addTo();
        
        // add to controls
        this.addToControls();
       
    },

    _addTo : function (type) {
        if (!this.layer) this._initLayer();

        var map = app._map;

        // leaflet fn
        map.addLayer(this.layer);

        // add to active layers
        app.MapPane.addActiveLayer(this);   // includes baselayers

        // fire event
        M.Mixin.Events.fire('layerEnabled', { detail : {
            layer : this
        }}); 

    },

    remove : function (map) {

        // leaflet fn
        if (app._map.hasLayer(this.layer)) {
            app._map.removeLayer(this.layer);
        }
        // remove from active layers
        app.MapPane.removeActiveLayer(this);    

        // remove from zIndex
        this._removeFromZIndex();

        // remove from descriptionControl if avaialbe
        var descriptionControl = app.MapPane.getControls().description;
        if (descriptionControl) descriptionControl._removeLayer(this);

        // fire layer enabled
        this.fire('disabled', {
            layer : this
        });
    },

    getGeoJSON : function () {
        return this.store.data.geojson7946.geojson;
    },

    getPopup : function () {
        return this.store.data.geojson7946.popup;
    },  

    getLegend : function () {
        return this.store.legend;
    },  

    getLegendImage : function () {
        return this.store.legend;
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

    isGeoJSON : function () {
        return true;
    },


});





