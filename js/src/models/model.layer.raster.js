// postgis raster layer
Wu.RasterLayer = Wu.Model.Layer.extend({

    initialize : function (layer) {

        // set source
        this.store = layer; // db object
        
        // data not loaded
        this.loaded = false;

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

    },

    _mapClick : function (e) {
        if (!this._added) return console.log('_mapClick, not added, returning');
        if (!this.isQueryable()) return console.log('_mapClick, not queryable, returning');
        var latlng = e.latlng;
        console.log('_mapClick, latlng:', latlng);

        // check if within extent
        var extent = this.getExtent();
        console.log('_mapClick extent', extent);

        var inside = this._checkInside(latlng, extent);

        if (!inside) return console.log('_mapClick, not inside, returning');

        // click was inside raster data
        this._queryRaster({
            point : latlng,
            e : e
        });
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
        return false;
    },

    _queryRaster : function (options) {
        console.log('_queryRaster', options);

        var datasets = this.getRasterDeformationDatasets();
        var point = options.point;
        var e = options.e;

        if (!datasets) return console.log('no raster datasets to query!');

        // return;
        app.api.fetchRasterDeformation({
            datasets : datasets, // todo: perhaps better to implement fully on server-side
            point : point,
            layer_id : this.getLayerID(),
        }, function (err, results) {
            console.log('err, results', err, results);

            if (err) return console.error(err);

            var deformation_results = this._parseRasterQueryResults(results);

            this.createPopupSettings(deformation_results);

            e.data = deformation_results;
            e.layer = this;

            var event = e.originalEvent;
            this._event = {
                x : event.x,
                y : event.y
            };

            app.MapPane._addPopupContent(e);

        }.bind(this));
    },

    _parseRasterQueryResults : function (data) {

        console.log('_parseRasterQueryResults', data);

        var data = Wu.parse(data);

         // output format should be thus:


        var parsed = {};


        var lines = data.query;

        lines.forEach(function (l) {

            var parsed_date = moment(l.date).format('YYYYMMDD')
            var value = (l.value - 32767) / 100;

            parsed[parsed_date] = value;
        });

        console.log('pasred:', parsed);

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

        console.log('createPopupSettings defo', defo);

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


        // {
        //   "title": "",
        //   "description": false,
        //   "timeSeries": {
        //     "20130611": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130622": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130703": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130714": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130725": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130805": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130816": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130827": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130907": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130918": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20130929": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20131010": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20131021": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20131101": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140620": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140701": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140712": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140723": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140803": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140814": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140825": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20140905": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20141008": {
        //       "title": false,
        //       "on": true
        //     },
        //     "20141019": {
        //       "title": false,
        //       "on": true
        //     },
        //     "enable": true
        //   },
        //   "metaFields": {
        //     "20130611": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130622": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130703": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130714": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130725": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130805": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130816": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130827": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130907": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130918": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20130929": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20131010": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20131021": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20131101": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140620": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140701": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140712": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140723": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140803": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140814": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140825": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20140905": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20141008": {
        //       "title": false,
        //       "on": false
        //     },
        //     "20141019": {
        //       "title": false,
        //       "on": false
        //     },
        //     "gid": {
        //       "title": false,
        //       "on": true
        //     },
        //     "code": {
        //       "title": false,
        //       "on": true
        //     },
        //     "lon": {
        //       "title": false,
        //       "on": true
        //     },
        //     "lat": {
        //       "title": false,
        //       "on": true
        //     },
        //     "height": {
        //       "title": false,
        //       "on": true
        //     },
        //     "demerror": {
        //       "title": false,
        //       "on": true
        //     },
        //     "r": {
        //       "title": false,
        //       "on": true
        //     },
        //     "g": {
        //       "title": false,
        //       "on": true
        //     },
        //     "b": {
        //       "title": false,
        //       "on": true
        //     },
        //     "coherence": {
        //       "title": false,
        //       "on": true
        //     },
        //     "mvel": {
        //       "title": false,
        //       "on": true
        //     },
        //     "adisp": {
        //       "title": false,
        //       "on": true
        //     },
        //     "dtotal": {
        //       "title": false,
        //       "on": true
        //     },
        //     "d12mnd": {
        //       "title": false,
        //       "on": true
        //     },
        //     "d3mnd": {
        //       "title": false,
        //       "on": true
        //     },
        //     "d1mnd": {
        //       "title": false,
        //       "on": true
        //     }
        //   }
        // }

    },

    setTooltip : function (meta) {
        console.error('setTooltip !!!!!!!!!!!!!!', meta);
        this.store.tooltip = JSON.stringify(meta);
        // this.save('tooltip');
    },

    getTooltip : function () {

        // only for deformation raster
        if (this.isDefo()) {
       
            console.error('getTooltip defo raster', this);
            var json = this.store.tooltip;
            if (!json) return false;
            var meta = Wu.parse(json);
            return meta;
       

        } else {

            // normal
            var json = this.store.tooltip;
            if (!json) return false;
            var meta = Wu.parse(json);
            return meta;
        }

    },


    // todo: create Wu.Model.Layer.Raster.Deformation layer instead!
    isDefo : function () {
        if (this.store.layer_type == 'defo_raster') return true;
        return false;
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
            sets.push(Wu.parse(defo));
        });

        // sort
        var sorted = _.sortBy(sets, function (s) {
            return moment(s.date).valueOf()
        });

        return sorted;
    },

    _layerClick : function (e) {
        console.log('raste rlayer click', e);
    },

    _getLayerUuid : function () {
        return this.store.data.postgis.layer_id;
    },

    getMeta : function () {
        var metajson = this.store.metadata;
        var meta = Wu.parse(metajson);
        return meta;
    },

    getData : function () {
        return this.store.data.postgis;
    },

    getFileMeta : function () {
        var file = app.Account.getFile(this.store.file);
        var metajson = file.store.data.raster.metadata;
        var meta = Wu.parse(metajson);
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
        console.log('raster downloadLayer');
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
        Wu.Mixin.Events.fire('layerEnabled', { detail : {
            layer : this
        }}); 

    },

});




