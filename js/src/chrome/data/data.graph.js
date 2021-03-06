M.Data = M.Data || {};
M.Data.Graph = M.Evented.extend({

    DOM : {},
    
    data : {
        geojson : '',
        csv : []
    },

    initialize : function () {

        // create page
        this._initContent();

    },

    _initContent : function () {

        // create fullscreen
        var fullscreen = this._fullscreen = new M.Fullscreen({
            title : '<i class="fa fa-bars file-option"></i>Water Info Layer',
            titleClassName : 'slim-font'
        });

        // store
        this.DOM.fullscreen_content = this._fullscreen._content

        // create header
        this._createHeader();

        // create geojson input
        this._createGeoJSONInput();
       
        // create graph layer item
        this._createCSVInput();

        // save button
        var save_button = M.DomUtil.create('div', 'smooth-fullscreen-save right-20', this.DOM.fullscreen_content, 'Create Layer');
        M.DomEvent.on(save_button, 'click', this._onSave, this);

    },

    _isValidGeoJSON : function (data) {
        var geojson = data.geojson;
        if (!_.has(geojson, 'type')) return false;
        if (!_.has(geojson, 'features')) return false;
        return true;
    },

    _invalidGeojson : function () {
        app.FeedbackPane.setError({
            title : 'Invalid GeoJSON', 
            description : 'Please try adding another GeoJSON file...'
        });
    },
    _invalidCSV : function () {
        app.FeedbackPane.setError({
            title : 'Invalid CSV', 
            description : 'Please try adding another CSV file...'
        });
    },

    _createMetadata : function (geojson) {

        var geojsonLayer = L.geoJson(geojson);
        var bounds = geojsonLayer.getBounds();
        var extent_string = _.split(bounds.toBBoxString(), ',')
        var extent = []
        _.each(extent_string, function (e) {
            extent.push(parseFloat(e))
        });

        var extent_geojson = turf.bboxPolygon(extent).geometry;

        // set metadata
        var metadata = M.stringify({
            extent : extent, 
            extent_geojson : extent_geojson
        });

        return metadata;
    },

    _onSave : function () {

        // get project
        var project = app.activeProject;

        var data = this.data;

        var title = this.DOM.title.value || 'New CSV Graph layer';

        // check valid geojson
        if (!this._isValidGeoJSON(data)) return this._invalidGeojson();

        var metadata = this._createMetadata(data.geojson);

        // create layer @ api
        app.api.createLayer({
            projectUuid : project.getUuid(), // pass to automatically attach to project
            data : {
                graph : M.stringify({
                    geojson : data.geojson,
                    csv : data.csv
                })
            },
            title : title,
            description : '',
            file : null,
            metadata : metadata,  // TODO
        }, 

        // callback
        function (err, body) {
            if (err) return console.error(err, body);
            
            // parse
            var layerModel = M.parse(body);

            // create layer on project
            var layer = project.addLayer(layerModel);

            // select project
            M.Mixin.Events.fire('layerAdded', { detail : {
                projectUuid : project.getUuid(),
                layerUuid : layerModel.uuid
            }});

            // feedback
            app.FeedbackPane.setMessage({title : 'Success!', description : 'Water Info Layer created'})

        });

        this._fullscreen.close();
    },

    _createHeader : function () {
        // get container
        var container = this.DOM.fullscreen_content;
        var info_text = M.DomUtil.create('div', 'info-text', container);
        info_text.innerHTML = 'Please see <a href="https://github.com/mapic/mapic/wiki/Water-Info-Layer" target="_blank">Water Info Layer</a> in the wiki for more information on how to use this layer.'
    },

    _createGeoJSONInput : function (options) {

        // get container
        var container = this.DOM.fullscreen_content;

        // get data
        var data = this.data;

        // wrapper
        var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper file-options', container);

        // layer 
        var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', toggles_wrapper, 'Layer name');
        var name_input = M.DomUtil.create('input', 'smooth-input smaller-input', toggles_wrapper);
        name_input.setAttribute('placeholder', 'Enter layer name');

        this.DOM.title = name_input;

        // upload geojson button
        var upload_btn_text = M.DomUtil.create('div', 'upload-btn-label', toggles_wrapper, 'Upload GeoJSON mask:');
        var upload_button = M.DomUtil.create('input', 'smooth-fullscreen-save', toggles_wrapper);
        upload_button.setAttribute('id', 'geojson-upload');
        upload_button.setAttribute('type', 'file');

        var that = this;

        // on upload
        M.DomEvent.on(upload_button, 'change', function () {
            var ctx = this;
            var file = ctx.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var geojson = M.parse(e.currentTarget.result);

                // set geojson to data
                data.geojson = geojson;

                // check valid geojson
                if (!that._isValidGeoJSON(data)) that._invalidGeojson();

            }
            reader.readAsText(file);
        });

    },  

    _createCSVInput : function (options) {

        // get container
        var container = this.DOM.fullscreen_content;

        // graph item
        var graph_wrapper = M.DomUtil.create('div', 'toggles-wrapper file-options', container);
        // var remove_button = M.DomUtil.create('div', 'toggles-wrapper-remove-button close-smooth-fullscreen', graph_wrapper, 'x');

        var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', graph_wrapper, 'Title');
        var name_input = M.DomUtil.create('input', 'smooth-input smaller-input ', graph_wrapper);
        name_input.setAttribute('placeholder', 'Y Axis label');
       
        // upload csv button
        var upload_btn_text = M.DomUtil.create('div', 'upload-btn-label', graph_wrapper, 'Upload CSV data:');
        var upload_button = M.DomUtil.create('input', 'smooth-fullscreen-save', graph_wrapper);
        upload_button.setAttribute('id', 'geojson-upload');
        upload_button.setAttribute('type', 'file');

        // data
        var data = this.data;
        data.csv = data.csv || [];

        var that = this;

        // on upload 
        M.DomEvent.on(upload_button, 'change', function () {
            var ctx = this;
            var file = ctx.files[0];
            
            if (file.type != 'text/csv') return that._invalidCSV();

            var reader = new FileReader();
            reader.onload = function (e) {
                var parsed_csv = Papa.parse(e.currentTarget.result);
                
                if (_.size(parsed_csv.error)) {
                    that._invalidCSV();
                }

                // push to stack
                data.csv.push({
                    y_axis_label : name_input.value,
                    csv : parsed_csv
                });
            }
            reader.readAsText(file);
        });
    },

});

M.graphData = function (o) {
    return new M.Data.Graph(o);
};