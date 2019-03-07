// postgis raster layer
M.RasterLayer = M.Model.Layer.extend({

    _type : 'raster-layer',
    type : 'raster',

    initialize : function (layer) {

        // set source
        this.store = layer; // db object
        
        // data not loaded
        this.loaded = false;

        // debug
        // console.log('M.RasterLayer', this);

    },

    initLayer : function () {
        this.update();
    },

    update : function () {
        var map = app._map;

        this._fileUuid = this.store.file;
        this._defaultCartoid = 'raster';

        // prepare raster
        this._prepareRaster();

    },

    _prepareRaster : function () {

        // set ids
        var fileUuid    = this._fileUuid;   // file id of geojson
        var cartoid     = this.store.data.cartoid || this._defaultCartoid;
        var tileServer  = app.options.servers.tiles.uri;
        var subdomains  = app.options.servers.tiles.subdomains;
        var access_token = '?access_token=' + app.tokens.access_token;
        var layerUuid = this._getLayerUuid();
        var url = app.options.servers.tiles.uri + '{layerUuid}/{z}/{x}/{y}.png' + access_token;

        // add vector tile raster layer
        this.layer = L.tileLayer(url, {
            fileUuid: fileUuid,
            layerUuid : layerUuid,
            subdomains : subdomains,
            maxRequests : 0
        });

        // hacky click event (cause no utf-grid)
        app._map.on('click', this._mapClick, this);

        app._map.on('mousemove', _.throttle(this._onMapMousemove, 100), this);

    },

    // todo: this is expensive! 
    _onMapMousemove : function (e) {
        if (!this._added) return;
        if (!this.isQueryable()) return;
    
        // check if within extent
        var extent = this.getExtent();
        var inside = this._checkInside(e.latlng, extent);
        
        // return if correct
        if (inside && this._cursorInside) return;
        if (!inside && !this._cursorInside) return;

        if (inside) {

            // set crosshair
            app._map._controlContainer.style.cursor = 'crosshair';
        } else {

            // set pointer
            app._map._controlContainer.style.cursor = 'pointer';
        }

        this._cursorInside = inside;
    },

    _mapClick : function (e) {

        if (!this._added) return;
        if (!this.isQueryable()) return;
        var latlng = e.latlng;

        // check if within extent
        var extent = this.getExtent();

        var inside = this._checkInside(latlng, extent);

        if (!inside) return;

        // click was inside raster data
        this._queryRaster({
            point : latlng,
            e : e
        });
    },

    getLegendImage : function () {
        var legendImage = this.store.legend;
        if (_.isUndefined(legendImage)) return '';
        return legendImage;
    },

    _checkInside : function (point, polygon) {
        var point = turf.point([point.lng, point.lat]);
        var poly = turf.bboxPolygon(polygon);
        var inside = turf.inside(point, poly);
        return inside;
    },

    isQueryable : function () {
        // should be able to query deformation rasters
        if (this.isDefo()) return true;
        if (this.isDefault()) return true;
        return false;
    },

    _queryRaster : function (options) {

        if (this.isDefo()) return this._queryDeformationRaster(options);
        if (this.isDefault()) return this._queryRasterPoint(options);
    },

    _queryRasterPoint : function (options) {

        app.api.queryRasterPoint({
            point : options.point,
            layer_id : this.getLayerID(),
        }, function (err, results) {
            if (err) return console.error(err);

            var query_result = M.parse(results);

            if (!query_result || query_result.err) return console.error('bad query');

            var map = app._map;
            var lngLat = query_result.data.lngLat;
            var value = query_result.data.value;
            var latlng = [lngLat.lat, lngLat.lng];

            // open simple popup
            var popup = L.popup({
                className : 'raster-point-popup',
            })
            .setLatLng(latlng)
            .setContent('Queried point value: ' + value)
            .openOn(map);
        });
    },

    _queryDeformationRaster : function (options) {

        var datasets = this.getRasterDeformationDatasets();
        var point = options.point;
        var e = options.e;

        if (!datasets) return console.log('no raster datasets to query!');

        // set progress
        app.ProgressBar.timedProgress(3000)

        // return;
        app.api.fetchRasterDeformation({
            datasets : datasets, // todo: perhaps better to implement fully on server-side
            point : point,
            layer_id : this.getLayerID(),
        }, function (err, results) {
            if (err) return console.error(err);
            
            // hide progress
            app.ProgressBar.hideProgress();

            var deformation_results = this._parseRasterQueryResults(results);

            this.createPopupSettings(deformation_results);

            e.data = deformation_results;
            e.layer = this;

            var event = e.originalEvent;
            this._event = {
                x : event.x,
                y : event.y
            };

            // add popup
            app.MapPane._addPopupContent(e);

        }.bind(this));
    },

    _parseRasterQueryResults : function (data) {

        var data = M.parse(data);
        var parsed = {};
        var lines = data.query;

        lines.forEach(function (l) {
            var parsed_date = moment(l.date).format('YYYYMMDD')
            var value = (l.value - 32767) / 100;
            parsed[parsed_date] = value;
        });

        return parsed;

        // {
        //     "20130611": 0,
        //     "20130622": 0.083,
        //     "20130703": 0.196,
        //     "20130714": 0.317,
        //     "20130725": 0.42,
        //     "20130805": 0.489,
        //     "20130816": 0.522,
        //     "20130827": 0.538,
        //     "20130907": 0.576,
        //     "20130918": 0.675,
        //     "20130929": 0.873,
        //     "20131010": 1.189,
        //     "20131021": 1.609,
        //     "20131101": 2.073,
        //     "20140620": 2.094,
        //     "20140701": 2.233,
        //     "20140712": 2.429,
        //     "20140723": 2.654,
        //     "20140803": 2.871,
        //     "20140814": 3.049,
        //     "20140825": 3.17,
        //     "20140905": 3.232,
        //     "20141008": 3.238,
        //     "20141019": 3.261,
        //     "gid": 9006,
        //     "code": "9005",
        //     "lon": 14.294259,
        //     "lat": 66.2049106456587,
        //     "height": 529.67,
        //     "demerror": 4,
        //     "r": 0.937,
        //     "g": 1,
        //     "b": 0.059,
        //     "coherence": 0.958,
        //     "mvel": 2.4,
        //     "adisp": 0.202,
        //     "dtotal": 3.261,
        //     "d12mnd": 2.586,
        //     "d3mnd": 0.607,
        //     "d1mnd": 0.091,
        //     "geom": null,
        //     "the_geom_3857": null,
        //     "the_geom_4326": null,
        //     "lng": 14.2942593005056
        // }



    },

    createPopupSettings : function (defo) {

        var p = {
            title : "",
            description : false,
            timeSeries : {
                enable : true, 
                // ...
            },
            metaFields : {}
        };

        _.forOwn(defo, function (value, key) {

            p.timeSeries[key] = {
                title : false,
                on : true
            }
        });

        // save
        this.setTooltip(p);



    },

    setTooltip : function (meta) {
        this.store.tooltip = JSON.stringify(meta);
        // this.save('tooltip');
    },

    getTooltip : function () {

        // only for deformation raster
        if (this.isDefo()) {
       
            var json = this.store.tooltip;
            if (!json) return false;
            var meta = M.parse(json);
            return meta;
       
        } else {

            // normal
            var json = this.store.tooltip;
            if (!json) return false;
            var meta = M.parse(json);
            return meta;
        }

    },


    // todo: create M.Model.Layer.Raster.Deformation layer instead!
    isDefo : function () {
        if (this.store.layer_type == 'defo_raster') return true;
        return false;
    },

    isDefault : function () {
        if (this.store.layer_type == 'defo_raster') return false;
        return true;
    },

    // todo: clean up!
    getLayerID : function () {
        return this._getLayerUuid();
    },

    getRasterDeformationDatasets : function () {

        // get sets
        var defo_rasters = this.store.defo_rasters;
        if (!_.size(defo_rasters) || !_.isArray(defo_rasters)) return false;

        // 
        var sets = [];
        defo_rasters.forEach(function (defo) {
            sets.push(M.parse(defo));
        });

        // sort
        var sorted = _.sortBy(sets, function (s) {
            return moment(s.date).valueOf()
        });

        return sorted;
    },

    _layerClick : function (e) {
    },

    _getLayerUuid : function () {
        return this.store.data.postgis.layer_id;
    },

    getMeta : function () {
        var metajson = this.store.metadata;
        var meta = M.parse(metajson);
        return meta;
    },

    getData : function () {
        return this.store.data.postgis;
    },

    getFileMeta : function () {
        var file = app.Account.getFile(this.store.file);
        var metajson = file.store.data.raster.metadata;
        var meta = M.parse(metajson);
        return meta;
    },

    getExtent : function () {
        var meta = this.getMeta();
        var extent_geojson = meta.extent_geojson;
        if (!extent_geojson) return false;
        var coordinates = extent_geojson.coordinates;
        if (!coordinates) return false;
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
    },

    isRaster : function () {
        return true;
    },

    setData : function (data) {
        if (!data) return console.error('no styloe to set!');
        this.store.data.postgis = data;
        this.save('data');
    },
    setStyle : function (data) {
        console.error('deprecated??');
        return this.setData(data);
    },

    // on change in style editor, etc.
    updateStyle : function (style) {

        var layerUuid = style.layerUuid;
        var postgisOptions = style.options;

        // save 
        this.setData(postgisOptions);

        // update layer option
        this._refreshLayer(layerUuid);
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

    addTo : function () {
        if (!this._inited) this.initLayer();

        // add to map
        this._addTo();
        
        // add to controls
        this.addToControls();
    },

    _addTo : function (type) {
        if (!this._inited) this.initLayer();

        var map = app._map;

        // leaflet fn
        map.addLayer(this.layer);

        // add gridLayer if available
        if (this.gridLayer) {
            map.addLayer(this.gridLayer);
        }

        // add to active layers
        app.MapPane.addActiveLayer(this);   // includes baselayers

        // update zindex
        // this._addToZIndex(type);
        
        this._added = true;

        // fire event
        M.Mixin.Events.fire('layerEnabled', { detail : {
            layer : this
        }}); 

    },

});




