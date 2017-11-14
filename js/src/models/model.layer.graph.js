M.Layer = M.Layer || {};
M.Layer.Graph = M.Model.Layer.GeoJSONMaskLayer.extend({

    options : {
        style : {
            fillColor : 'red',
            color: 'red',
            weight : 2.5,
            opacity: 0.8,
            fillOpacity : 0.01,

        },
        hoverStyle : {
            fillColor : 'white',
            color: 'white',
            weight : 2.5,
            opacity: 0.8,
            fillOpacity : 0.01,

        }
    },

    initialize : function (options) {

        console.log('M.Layer.Graph', options, this);
        
        // set options
        M.setOptions(this, options);

        this.store = options;

        // set geojson
        this.options.geojson = M.parse(options.data.graph).geojson;

        // set map
        this._map = app._map;

        // init layer
        this._initLayer();

    },

    _initLayer : function () {

        // ensure simple geometry of geojson (as far as possible) // todo: move to import
        var geojson = this.ensureFlat(this.options.geojson);

        // create geojson layer
        this.layer = L.geoJson(geojson);

        // set default style
        this.layer.setStyle(this.options.style);

        this.layer.on('mouseover', this._onMouseOver, this);
        this.layer.on('mouseout', this._onMouseOut, this);
        this.layer.on('click', this._onClick, this);
    },

    _onMouseOver : function () {
        this.layer.setStyle(this.options.hoverStyle);
    },
    _onMouseOut : function () {
        this.layer.setStyle(this.options.style);
    },
    _onClick : function () {
        console.log('click');
    },

    add : function () {
        app._map.addLayer(this.layer);
    },

    remove : function () {
        app._map.removeLayer(this.layer);
    },

});