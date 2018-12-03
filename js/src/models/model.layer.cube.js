// metalayer with several postgis raster layers 
M.Model.Layer.CubeLayer = M.Model.Layer.extend({

    // languages
    localization : {
        lang : 'nor',
        eng : {
            clickToEnableMask : 'Click to enable mask.'
        },
        nor : {
            clickToEnableMask : 'Trykk for å velge maske.'
        },
    },
    locale : function () {
        return this.localization[this.localization.lang];
    },

    options : {
        
        // frames to cache [before, after]
        cacheSize : [0, 1], 
        
        // moment format at which to compare dates (year/day only here)
        timeFormat : 'YYYY-DDDD', 

        // default mask style 
        mask : {
            
            defaultStyle : {
                // fillColor : '#d35658',
                fillColor : 'green',
                fillOpacity : 0,
                color : '#16d6f3',
                opacity : 0.6,
                weight : 2,
            },

            hoverStyle : {
                // fillColor : '#d35658',
                fillColor : 'blue',
                fillOpacity : 0.2,
                color : '#d35658',
                opacity : 0.9,
                weight : 2,
            },

            selectedStyle : {
                fillColor : 'black',
                fillOpacity : 0,
                // color : 'red',
                color : 'green',
                opacity : 0.9,
                weight : 2,
            },

            selectedHoverStyle : {
                fillColor : 'black',
                fillOpacity : 0,
                // color : 'red',
                color : 'orange',
                opacity : 0.9,
                weight : 2,
            },

            // if you want click on separate features of mask
            separatedFeatures : false,

            // to have mask active by default
            constantMask : true,

            // fly to mask on click
            flyTo : false,

            // tooltip
            tooltip : true
        },

        // empty, transparent png
        emptyTile : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAB9JREFUaIHtwQENAAAAwqD3T20ON6AAAAAAAAAAAL4NIQAAAZpg4dUAAAAASUVORK5CYII=',
    },

    // _cache : [],

    _initialize : function (store) {

        // set store
        this._setStore(store);

        this._cache = [];

        this._data = {};

        this. _masks = [];
        this._maskLayers = [];
    },

    _setStore : function (store) {

        // set store        
        this.store = store;

        // parse cube json
        this._cube = M.parse(this.store.data.cube);

    },

    add : function (type) {
        this.addTo();
    },

    addTo : function () {
       
        // add to map
        this._addTo();

    },

    _addTo : function (type) {

        console.log('M.Model.Layer.CubeLayer: ', this);

        // ensure inited
        this.initLayer(function (err) {

            var map = app._map;

            // add leaflet layer group to map
            this._group.addTo(map);

            // hide layers
            this._group.eachLayer(this._hideLayer);

            // make sure cache is updated; got all correct layers loaded
            this._updateCache();

            // sets cursor at current frame (ie. show layer on map)
            this._updateCursor();

            // add to active layers
            app.MapPane.addActiveLayer(this);   // includes baselayers, todo: evented

            // add mask layer
            if (this.hasMask()) {

                // add mask layer
                this._maskLayers.forEach(function (maskLayer) {
                    maskLayer.add();
                });
            }

            // show legend
            this._showLegend();

            // mark added
            this._added = true;

            // fire layer enabled
            this.fire('enabled', {
                layer : this
            });

        }.bind(this));


    },

    hasMask : function () {
        var hasMask = (this._maskLayers && _.isArray(this._maskLayers) && _.size(this._maskLayers));
        return hasMask;
    },

    remove : function (map) {
        var map = map || app._map;

        // this._group.removeFrom(map);
        this._group && this._group.remove();

        // remove mask
        if (this.hasMask()) {
            this._maskLayers.forEach(function (maskLayer) {
                maskLayer.remove();
            });
        };

        // remove from active layers
        // todo: evented!
        app.MapPane.removeActiveLayer(this);    

        // remove from zIndex
        this._removeFromZIndex(); // todo: evented

        // hide legend
        this._hideLegend();

        // mark
        this._added = false;

        // fire layer enabled
        this.fire('disabled', {
            layer : this
        });
    },

    // add leaflet layer only
    _addThin: function () {
        if (!this._inited) this.initLayer();

        // only add to map temporarily
        app._map.addLayer(this.layer);
        this.layer.bringToFront();
    },

    // remove leaflet layer only
    _removeThin : function () {
        if (!this._inited) this.initLayer();

        // remove from map
        app._map.removeLayer(this.layer);
    },

    // fired when layer is added to map
    initLayer : function (done) {

        if (this._inited) {
            done && done();
            return;
        }

        // listen up
        this._listen();

        // init cursor
        this._initCursor();

        // init cache
        this._initCache();

        // run async ops
        async.series([

            // verify latest cube
            this._verifyCube.bind(this),
            
            // init mask async
            this._initMask.bind(this),
            
            // init graph async
            this._initGraph.bind(this)

        ], function (err) {

            // mark inited
            this._inited = true;

            // debug
            app._cubeDebug = this;

            // callback
            done && done();

        }.bind(this));

    },

    _verifyCube : function (done) {

        // get cube 
        var cube_id = this.getCubeId();

        app.api.getCube({
            cube_id : cube_id
        }, function (err, cube) {
            if (err) {
                console.log('err, cube', err, cube);

                // error msg
                var errorMsg = 'Please check your cube layer for errors. ';
                var cubeError = M.parse(cube);
                if (cubeError) {
                    errorMsg += '(' + cubeError.error + ')';
                }

                // set feedback
                app.feedback.err('Error with cube.', errorMsg);
            }

            if (this.store.data.cube == cube) {
                // console.log('Cube is same.');
            } else {

                // save updated cube
                this._saveCube(M.parse(cube));
            }

            done();

        }.bind(this));

    },

    _flush : function () {
        this.remove();
        app.MapPane._clearPopup(); // todo: evented
        this._removeGridEvents();
    },

    // for storing requested data
    // _data : {},

    _initGraph : function (done) {

        // create graph
        this._graph = new M.Graph.SnowCoverFraction({ 
            type     : 'annualCycles',
            cube     : this,
        });

    },

    _initCursor : function () {

        // init cursor
        this._cursor = 0;

        // init feature group
        this._group = L.featureGroup([]);//.addTo(app._map);

    },

    _initDatasets : function () {
        var datasets = this.getDatasets();
        var f = this.options.timeFormat;
        if (!_.size(datasets)) {
            console.log('no datasets yet!');
            app.FeedbackPane.setError({
                title : 'Missing datasets',
                description : 'There are no datasets in the layer. Please add datasets before continuing.'
            })
            this._datasets = [];
            return;
        }
        datasets.forEach(function (d, n) {

            // prepare format for quicker search 
            d.formattedTime = moment(d.timestamp).format(f);
            
            // prepare index for quicker search
            d.idx = n;

        });

        // set
        this._datasets = datasets;

        // return
        return datasets;
    },

    _initCache : function () {

        // set datasets
        this._initDatasets();

        // total num of cached frames
        var cacheSize = this.options.cacheSize[0] + this.options.cacheSize[1];

        // create cache
        _.times(cacheSize, function (n) {

            // create empty Leaflet layer
            var layer = L.tileLayer(this._getTileUrl(), {
                errorTileUrl : this.options.emptyTile,
                cube_id : this.getCubeId(),
                subdomains : app.options.servers.cubes.subdomains,
                maxRequests : 0,
                dataset_id : null,
                cache : null,
                mask_id : null
            });

            // add load event
            layer.on('load', this._onLayerLoaded, this);

            // add layer to feature group
            this._group.addLayer(layer); // will add layer to map, since group is already added to map

            // add to cache
            this._cache.push({
                layer : layer,
                dataset_id : null,
                idx : null
            });

        }.bind(this));

        // set default layer
        this.layer = this._cache[this.options.cacheSize[0]].layer;

        // hide by default
        this._group.eachLayer(this._hideLayer);

    },

    _initMask : function (done) {

        this._maskLayers = [];

        // get mask
        var masks = this.getMasks();

        // return if no mask
        if (!masks || _.isEmpty(masks)) return done();

        masks = _.isArray(masks) ? masks : [masks];

        masks.forEach(function (m) {

            // check if raster mask
            if (m.type == 'postgis-raster') return this._initRasterMask(m, done);

            // check if vector mask
            if (m.type == 'topojson') return this._initTopoJSONMask(m, done);

            // check if vector mask
            if (m.type == 'geojson') return this._initGeoJSONMask(m, done);

            console.error('Unsupported mask', m);

        }.bind(this));

        done && done();

        // select first mask by default
        this.setDefaultMask();

    },

    // _masks : [],
    // _maskLayers : [],

    _initRasterMask : function (mask, done) {
        console.error('todo: RASTER MASK');
    },

    _initTopoJSONMask : function (mask, done) {
        console.error('todo: topojson mask');
    },

    _initGeoJSONMask : function (mask, done) {

        // var maskStyling = this.getMaskStyling();

        // create mask (geojson) layer
        var maskLayer = new M.Model.Layer.GeoJSONMaskLayer({
            geojson : mask.geometry,
            style : this.getMaskStyling(),
            id : mask.id
        });

        // add to array
        this._maskLayers.push(maskLayer);

        // make sure on top
        maskLayer.layer.bringToFront();

        // set popup content
        maskLayer.layer.bindTooltip(function (layer) {

            var meta = mask.meta;

            // add title
            var title = meta && meta.title ? meta.title.camelize() : '';
            var tip = this.isMaskActive(mask) ? '' : this.locale().clickToEnableMask; 

            var html = '<div class="tooltip-snow">' + title + '<span class="tooltip-snow-span"><br>' + tip + '</span></div>';

            // return
            return html;
            
        }.bind(this), {
            // see http://leafletjs.com/reference-1.0.0.html#tooltip
            className : 'mask-tooltip',
            // permanent : true
        });

        // click events
        maskLayer.layer.on('click', this._onMaskClick.bind(this, maskLayer));
        maskLayer.layer.on('mouseover', this._onMaskMouseover.bind(this, maskLayer));
        maskLayer.layer.on('mouseout',  this._onMaskMouseout.bind(this, maskLayer));

        // callback
        done && done();
    },

    isMaskActive : function (mask) {
        var active = this.getActiveMask();
        if (active && active == mask.id) return true;
        return false;
    },

    _onMaskMouseover : function (maskLayer, e) {
        var style = maskLayer.selected ? this.options.mask.selectedHoverStyle : this.options.mask.hoverStyle;
        maskLayer.layer.setStyle(style);
    },

    _onMaskMouseout : function (maskLayer, e) {
        // var style = maskLayer.selected ? this.options.mask.selectedStyle : this.getMaskStyling();
        var style = maskLayer.selected ? this.getMaskStyling() : this.getMaskStyling();
        maskLayer.layer.setStyle(style);
    },

    _onMaskClick : function (maskLayer, e) {
        
        // turn off
        if (maskLayer.selected) {

            // do nothing, because we always want one mask to be selected (for now)

            // fly to mask
            this._flyToMask(maskLayer);

        // turn on
        } else {

            // reset all selected first
            this.unselectAllMasks();

            // select mask            
            this.selectMask(maskLayer);

            // fly to mask
            this._flyToMask(maskLayer);
        }
    },

    flyTo : function () {
        var maskLayer = this._maskLayers[0];
        if (!maskLayer) return;

        // fly
        var bounds = maskLayer.layer.getBounds();
        app._map.fitBounds(bounds);

    },

    _flyToMask : function (maskLayer) {
        if (!this.options.mask.flyTo) return;

        // get bounds, fly
        var bounds = maskLayer.layer.getBounds();
        app._map.flyToBounds(bounds);
    },

    setDefaultMask : function (maskLayer) {
        var maskLayer = maskLayer || this._maskLayers[0];
        if (!maskLayer) return;

        // select mask
        this.selectMask(maskLayer);

        // cause not hovering
        // maskLayer.layer.setStyle(this.options.mask.selectedStyle);
        maskLayer.layer.setStyle(this.getMaskStyling());
        
    },

    selectMask : function (maskLayer) {

        // set style
        maskLayer.layer.setStyle(this.options.mask.selectedHoverStyle);
        
        // mark selected
        maskLayer.selected = true;

        // get mask (with data)
        var mask = this.getMaskById(maskLayer.options.id);

        // fire mask selected
        this.fire('maskSelected', {
            mask : mask
        });

        // store 
        this.setActiveMask(mask.id);

        // update cache
        this._updateCache();

    },

    getMaskById : function (id) {
        return _.find(this.getMasks(), function (m) {
            return m.id == id;
        });
    },

    unselectMask : function (maskLayer) {
        maskLayer.layer.setStyle(this.getMaskStyling());
    },

    unselectAllMasks : function () {
        // reset all selected first
        this._maskLayers.forEach(function (m) {
            m.layer.setStyle(this.getMaskStyling());
            m.selected = false;
        }.bind(this));
    },

    _onMapClick : function (e) {
        // fires AFTER maskLayer events

        // not applicable if constantMask is active
        if (this.options.mask.constantMask) return;

        // this click was on mask
        if (this._clickedMasklayer) {

        // this click was only on map
        } else {

            // fire unselected
            this._maskUnselected();
        }

        // mark last click
        this._clickedMasklayer = false;
    },  

    // async, waiting, to get graph object
    _getGraph : function (done) {

        // get graph
        var graph = this._graph;

        // return graph
        if (graph) return done(null, graph);
       
        // or try again
        setTimeout(this._getGraph.bind(this, done), 300);
    },

    _maskSelected : function (layer) {

        // reset style for all layers
        this._maskLayer.layer.eachLayer(function (l) {
            l.setStyle(this.getMaskStyling());
        }.bind(this));

        this.fire('maskSelected', {
            layer : layer
        });
    },

    _maskUnselected : function (layer) {

        // reset style for all layers
        this._maskLayer.layer.eachLayer(function (l) {
            l.setStyle(this.getMaskStyling());
        }.bind(this));

        // // fire mask selected event
        // M.Mixin.Events.fire('maskUnselected', { detail : { 
        //     layer : layer 
        // }}); 

        // fire event on 
        this._graph.fire('maskSelected', {
            layer : layer
        });

    },

    _queryCube : function (options, done) {

        // query server for data
        app.api.queryCube(options, function (err, data) {
            if (err) return done(err);

            // parse
            var fractions = M.parse(data);

            // catch bad data
            if (!fractions) return done('Failed to parse data');

            // callback
            done && done(null, fractions);

        });

    },

    query : function (options, done) {
        
        // add cube id
        options.cube_id = this.getCubeId();

        // query cube
        app.api.queryCube(options, done);
    },

    getMasks : function () {
        return this._cube.masks;
    },

    addMask : function (data, done) {

        // add mask @ server
        app.api.addMask(data, function (err, result) {
            if (err) {
                console.error(err);
                done && done(err);
            }
            // parse
            var masked_cube = M.parse(result);

            // save updated cube
            this._saveCube(masked_cube);

            // callback
            done && done(null);

        }.bind(this));

    },

    _onTileUnload : function (e) {
        var layer = e.target;
    },

    _onTileLoad : function (e) {
        var layer = e.target;
    },

    _onLayerClick : function (e) {
    },

    _moveCursor : function (options) {

        // get options
        var timestamp = options.timestamp;

        // find index of dataset corresponding to current date
        var didx = this._findDatasetByTimestamp(timestamp);

        if (didx < 0) {
            console.error('no dataset corresponding to timestamp');
            app.FeedbackPane.setError({title : 'No raster available', description : 'There is no satellite imagery available for this date.'})

            // hide
            this._hideLayer(this.layer);

            // done
            return;
        }


        // set direction (for cache algorithm)
        this._cursorDirection = (didx > this._cursor) ? 1 : -1;

        // set
        this._cursor = didx;
       
        // make sure cache is updated; got all correct layers loaded
        this._updateCache();

        // sets cursor at current frame (ie. show layer on map)
        this._updateCursor();

    },

    // this is where layers are shown on map 
    // hides, displays layers, nothing else...
    _updateCursor : function () {

        // hide current layer
        if (this.layer) {
            this._hideLayer(this.layer);
        }

        // find dataset
        var dataset = this._datasets[this._cursor];

        // find cached frame
        var cache = _.find(this._cache, function (c) {
            if (!dataset || !dataset.id) return false;
            return c.dataset_id == dataset.id;
        });

        // get layer
        var layer = cache ? cache.layer : false;

        // should never happen, ideally
        if (!layer) {
            console.error('no layer @ cursor??');
            // console.log('--------------------------');
            // console.log('dataset:', dataset);
            // console.log('cache:', cache);
            // console.log('this._cache', this._cache);
            // console.log('cursor', this._cursor);
            // console.log('--------------------------');

            // fire missing layer event (for animator to fix manually)
            // M.Mixin.Events.fire('cubeCacheNoLayer', { detail : { 
            //     cube : this 
            // }});
            
            // done here
            return;
        }

        // show layer
        this._showLayer(layer);

        // set layer
        this.layer = layer;

        // log
        console.log('cursor @', this._cursor);
    },

    // update cache // todo: move cache to own Class ?
    _updateCache : function () {

        // determine which datasets should be in cache
        // todo: this is only true for the current year... what when changing years? 
        var a = _.slice(this._datasets, this._cursor, this._cursor + this.options.cacheSize[1]);
        var b = _.slice(this._datasets, this._cursor - this.options.cacheSize[0], this._cursor);

        // sort datasets
        var datasets = _.sortBy(_.uniq(a.concat(b)), function (d) {
            return _.findIndex(this._datasets, function (dd) {return d.id == dd.id});
        }, this);

        // cache datasets
        datasets.forEach(function (dataset) {

            // check if dataset already cached
            var cached = _.find(this._cache, function (c) {
                return c.dataset_id == dataset.id;
            });

            // if already in cache, all good

            if (cached) {

                // update layer with latest mask
                var cacheOptions = {
                    mask_id : this.getFilterMask() ? this.getActiveMask() : null,
                    loaded : false,
                    age : Date.now()
                }

                 // update layer
                cached.layer.setOptions(cacheOptions);
                
                return;

            } else {

                // set layer options
                var layerOptions = {
                    dataset_id : dataset.id,
                    cache : M.Util.getRandomChars(6),
                    mask_id : this.getFilterMask() ? this.getActiveMask() : null,
                }

                // (20) loaded: 107 -- bug
                // -----------------------
                // clues:
                // - has to do with cache that is not yet completely loaded
                // - when thus reused, shit happens
                // - seems if layer is overwritten, then as soon as first 20 tiles are loaded, 
                //  the next 20 tiles all fire "loaded" event.
                // - fix with https://github.com/systemapic/systemapic.js/issues/210

                // get available cache
                var cache = this._getAvailableCache();

                // cache.layer.off('load', this._onLayerLoaded, this);
                // cache.layer.off('load');
                // cache.layer.on('load', this._onLayerLoaded, this);

                // update cache
                cache.dataset_id = dataset.id;
                cache.age = Date.now();
                cache.idx = dataset.idx;
                cache.loaded = false;

                // update layer
                cache.layer.setOptions(layerOptions);

            }

        }.bind(this));

    },

    _onLayerLoaded : function (e) {

        // todo: `load` event is fired on a layer that doesn't have dataset_id (ie. hasn't been cached)
        // how is that possible?

        var layer = e.target;
        var dataset = _.find(this._datasets, {id : layer.options.dataset_id});
       
        if (!dataset) return;

        // mark cache loaded
        var cache = _.find(this._cache, {idx : dataset.idx});
        if (cache) {
            cache.loaded = true;
        }
    },

    _getAvailableCache : function () {

        // if going forward in time
        if (this._cursorDirection > 0) {

            // return lowest cached dataset index
            var cache = _.minBy(this._cache, function (c) {
                return c.idx;
            }); 
            return cache ? cache : this._cache[this._cache.length - 1]

        // if going backwards in time
        } else {

            // return highest cached dataset index
            var cache = _.maxBy(this._cache, function (c) {
                return c.idx;
            });
            return cache ? cache : this._cache[0];
        }
       
    },

    update : function () {
        var map = app._map;
    },

    getDatasets : function () {
        return this._cube.datasets;
    },

    getCubeId : function () {
        return this._cube.cube_id;
    },  

    _refreshCube : function () {
        // this._prepareRaster();
    },

    // event when slider is set
    _onSliderSet : function (e) {
        if (!this._added) return;

        // get timestamp
        var timestamp = e.detail.timestamp; // moment

        // move cursor
        this._moveCursor({
            timestamp : timestamp
        });

    },

    setCursor : function (timestamp) {
        this._moveCursor({
            timestamp : timestamp
        });
    },

    _findDatasetByTimestamp : function (t) {
        var f = this.options.timeFormat;
        var b = _.toString(moment(t).format(f)); // YYYY-DDDD of animation
        var didx = _.findIndex(this._datasets, function (d) { 
            return _.toString(d.formattedTime) == b;
        });
        return didx;
    },

    _findLatestDataset : function () {
        return _.maxBy(this._datasets, function (d) { 
            return d.idx;
        });
    },

    _findLatestDOY : function () {
        var latest = this._findLatestDataset();
        if (_.isUndefined(latest)) return 245;
        var doy = parseInt(latest.formattedTime.split('-')[1]);
        return doy;
    },

    _showLayer : function (layer) {
        var container = layer.getContainer();
        if (container) container.style.display = 'block';
    },

    _hideLayer : function (layer) {
        var container = layer.getContainer();
        if (container) container.style.display = 'none';
    },

    _getCursorLayer : function () {
        var cursor = this._cursor;
        var cache = _.find(this._cache, function (c) {
            return c.idx == cursor;
        });
        if (!cache) cache = this._cache[this._cursor];
        if (!cache) return false;
        return cache.layer;
    },

    isCube : function () {
        return true;
    },

    updateStyle : function (style) {

        var options = {
            cube_id : this.getCubeId(),
            style : style
        }

        // update cube on server
        app.api.updateCube(options, function (err, cubeJSON) {

            // catch errors
            if (err) return console.error('Error updating Cube Style:', err, cubeJSON);

            // parse
            var cube = M.parse(cubeJSON)

            // save updated cube
            this._saveCube(cube);

            // refresh layers
            this._refreshLayer();
            
        }.bind(this));
    },

    _saveCube : function (cube) {

        // save cube locally and to server
        this.store.data.cube = JSON.stringify(cube);
        this.save('data');

        // set updated cube
        this._cube = cube;

        // refresh datasets
        this._initDatasets();

        // return cube
        return this;
    },

    _refreshLayer : function () {

        // refresh all Leaflet layers
        this._cache.forEach(function (cache) {
            var layer = cache.layer;
            layer.setOptions({
                cache : M.Util.getRandomChars(6) // change url to avoid browser cache
            });
            layer.redraw();
        });

    },

    setDatasetDate : function (options, done) {

        // get date, dataset
        var date = options.date;
        var dataset = options.dataset;

        // set new date (format: "2016-04-01T00:00:00+02:00")
        dataset.timestamp = moment(date).format();

        // get all datasets
        var datasets = this.getDatasets();

        // find index 
        var idx = _.findIndex(datasets, function (d) {
            return d.id == dataset.id;
        });

        // update dataset
        datasets[idx] = dataset;

        // save cube on server
        this.updateDataset(datasets, done);
    },

    updateDataset : function (datasets, done) {

        var options = {
            cube_id : this.getCubeId(),
            datasets : datasets
        }

        // update cube on server
        app.api.updateCube(options, function (err, cubeJSON) {
            if (err) return console.error('Error updating Cube Style:', err, cubeJSON);

            // parse
            var cube = M.parse(cubeJSON)

            // save updated cube
            this._saveCube(cube);

            // refresh layers
            this._refreshLayer();

            // return
            done && done(err, cube);
            
        }.bind(this));
    },

    _getTileUrl : function () {
        var access_token = '?access_token=' + app.tokens.access_token;
        var url = app.options.servers.cubes.uri + '{cube_id}/{dataset_id}/{z}/{x}/{y}.png' + access_token + '&cache={cache}&mask_id={mask_id}';
        return url;
    },

    _showLegend : function () {
        if (!this._legendContainer) this._createLegend();

        // show
        this._legendContainer.style.display = 'block';
    },

    _hideLegend : function () {
        if (!this._legendContainer) return;

        // hide
        this._legendContainer.style.display = 'none';
    },

    // create legend
    _createLegend : function () {
        if (this._legendContainer) M.DomUtil.remove(this._legendContainer);

        // create legend container
        this._legendContainer = M.DomUtil.create('div', 'snow-raster-legend-container', app._map._controlContainer);

        // get gradient
        var gradient = this._getLegendGradient();

        // set style
        var gradientStyle = 'background: -webkit-linear-gradient(' + gradient + ');background: -o-linear-gradient(' + gradient + ');background: -moz-linear-gradient(' + gradient + ');'

        // set legend
        this._legendContainer.innerHTML = '<div class="info-legend-frame snow-raster"><div class="info-legend-val info-legend-min-val">1%</div><div class="info-legend-header scf">Snow</div><div class="info-legend-val info-legend-max-val">100%</div><div class="info-legend-gradient-container" style="' + gradientStyle + '"></div></div>'

    },

    _getLegendGradient : function () {

        // val = 100 means 0 for SCF styling
        var startValue = 0;

        // default
        var defaultGradient = '0deg, #8C8C8C, white';

        var style = M.parse(this.store.style);

        // return default gradient if no style set
        if (!style || !style.stops) return defaultGradient;

        // create gradient string
        var gradient = '0deg';
        _.forEach(style.stops, function (s) {
            var val = s.val;
            var color = 'rgba(' + s.col.r + ', ' + s.col.g + ', ' + s.col.b + ', ' + s.col.a + ')';
            var percent = val - startValue;
            gradient += ', ' + color + ' ' + percent + '%'
        });

        return gradient;
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

    getGraphEnabled : function () {

        var storeOptions = this.store.options;

        // on by default
        if (_.isUndefined(storeOptions)) return true;

        // ensure parsed
        if (_.isString(storeOptions)) {
            storeOptions = M.parse(storeOptions);
        }

        // on by default
        if (_.isUndefined(storeOptions.graphEnabled)) return true;
    
        // return set state
        return storeOptions.graphEnabled;
    },

    setGraphEnabled : function (state) {

        var storeOptions = this.store.options;

        // ensure exists
        if (_.isUndefined(storeOptions)) {
            storeOptions = {};
        }
       
        // ensure parsed
        if (_.isString(storeOptions)) {
            storeOptions = M.parse(storeOptions);
        }

        // set state
        storeOptions.graphEnabled = state;

        // stringify
        this.store.options = M.stringify(storeOptions);

        // save
        this.save('options');

    },

    setMaskStyling : function (styling) {
        var storeOptions = this.store.options;

        // ensure exists
        if (_.isUndefined(storeOptions)) {
            storeOptions = {};
        }
       
        // ensure parsed
        if (_.isString(storeOptions)) {
            storeOptions = M.parse(storeOptions);
        }

        // set state
        storeOptions.maskStyling = styling;

        // stringify
        this.store.options = M.stringify(storeOptions);

        // save
        this.save('options');
    },

    getMaskStyling : function () {
        var storeOptions = this.store.options;

        // on by default
        if (_.isUndefined(storeOptions)) return this.options.mask.defaultStyle;

        // ensure parsed
        if (_.isString(storeOptions)) {
            storeOptions = M.parse(storeOptions);
        }

        // return default
        if (_.isUndefined(storeOptions.maskStyling)) return this.options.mask.defaultStyle;
    
        // return set state
        return storeOptions.maskStyling;
    },


});