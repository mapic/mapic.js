M.Layer = M.Layer || {};
M.Layer.Graph = M.Model.Layer.GeoJSONMaskLayer.extend({

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

    add : function () {
        app._map.addLayer(this.layer);
    },

    remove : function () {
        app._map.removeLayer(this.layer);
    },

});