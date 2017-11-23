M.Data = M.Data || {};
M.Data.Graph = M.Evented.extend({

    DOM : {},
    
    data : {
        geojson : '',
        csv : []
    },

    initialize : function () {
        console.log('M.Data.Graph');

        // create page
        this._initContent();

    },

    _initContent : function () {

        // create fullscreen
        var fullscreen = this._fullscreen = new M.Fullscreen({
            title : '<i class="fa fa-bars file-option"></i>Graph Layer',
            titleClassName : 'slim-font'
        });

        // store
        this.DOM.fullscreen_content = this._fullscreen._content

        // create geojson input
        this._createGeoJSONInput();
       
        // create graph layer item
        this._createCSVInput();

        // save button
        var save_button = M.DomUtil.create('div', 'smooth-fullscreen-save', this.DOM.fullscreen_content, 'Create Layer');
        M.DomEvent.on(save_button, 'click', this._onSave, this);

    },

    _onSave : function () {

        // get project
        var project = app.activeProject;

        var data = this.data;

        console.log('_onSAve data', data);

        var title = this.DOM.title.value;

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
            description : 'test-geojson-description',
            file : null,
            // metadata : layer.options.metadata,  // TODO
        }, 

        // callback
        function (err, body) {
            if (err) return console.error(err, body);
            
            // parse
            var layerModel = M.parse(body);

            console.log('callback layerModel', layerModel);

            // create layer on project
            var layer = project.addLayer(layerModel);

            // select project
            M.Mixin.Events.fire('layerAdded', { detail : {
                projectUuid : project.getUuid(),
                layerUuid : layerModel.uuid
            }});

        });

        console.log('this._fullscreen', this._fullscreen);

        this._fullscreen.close();
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
        var upload_button = M.DomUtil.create('input', 'smooth-fullscreen-save', toggles_wrapper);
        upload_button.setAttribute('id', 'geojson-upload');
        upload_button.setAttribute('type', 'file');

        // on upload
        M.DomEvent.on(upload_button, 'change', function () {
            var ctx = this;
            var file = ctx.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var geojson = M.parse(e.currentTarget.result);

                // set geojson to data
                data.geojson = geojson;
            }
            reader.readAsText(file);
        });

    },  

    _createCSVInput : function (options) {

        // get container
        var container = this.DOM.fullscreen_content;

        // graph item
        var graph_wrapper = M.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var remove_button = M.DomUtil.create('div', 'toggles-wrapper-remove-button close-smooth-fullscreen', graph_wrapper, 'x');

        M.DomEvent.on(remove_button, 'click', function () {
            console.log('remove_button')
        }, this);

        var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', graph_wrapper, 'Title');
        var name_input = M.DomUtil.create('input', 'smooth-input smaller-input ', graph_wrapper);
        name_input.setAttribute('placeholder', 'Y Axis label');
       
        // upload csv button
        var upload_button = M.DomUtil.create('input', 'smooth-fullscreen-save', graph_wrapper);
        upload_button.setAttribute('id', 'geojson-upload');
        upload_button.setAttribute('type', 'file');

        // data
        var data = this.data;
        data.csv = data.csv || [];

        // on upload 
        M.DomEvent.on(upload_button, 'change', function () {
            var ctx = this;
            var file = ctx.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var parsed_csv = Papa.parse(e.currentTarget.result);

                if (_.size(parsed_csv.error)) {
                    console.error('error parsing csv', parsed_csv); // todo
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