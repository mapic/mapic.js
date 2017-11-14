M.Data = M.Data || {};
M.Data.Graph = M.Evented.extend({

    initialize : function () {
        console.log('M.Data.Graph');

        this._create();

    },


    _create : function () {

        // create fullscreen
        var fullscreen = this._fullscreen = new M.Fullscreen({
            title : '<i class="fa fa-bars file-option"></i>Graph Layer',
            titleClassName : 'slim-font'
        });

        this._fullscreen.data = {};

        // shortcuts
        var content = this._fullscreen._content;
       
        // create graph layer item
        this._createDataBox({
            container : content,
        });

        var project = app.activeProject;

        // save button
        var save_button = M.DomUtil.create('div', 'smooth-fullscreen-save', content, 'Create Layer');
        M.DomEvent.on(save_button, 'click', function () {

            var options = {
                projectUuid : project.getUuid(), // pass to automatically attach to project
                data : {
                    graph : M.stringify({
                        geojson : this._fullscreen.data.geojson,
                        csv : []
                    })
                },
                // metadata : layer.options.metadata,  // TODO
                title : 'test-geojson-title',
                description : 'test-geojson-description',
                file : null
            };

            app.api.createLayer(options, function (err, body) {
                if (err) return done(err);
                
                var layerModel = M.parse(body);


                // create layer on project
                var layer = project.addLayer(layerModel);

                // select project
                M.Mixin.Events.fire('layerAdded', { detail : {
                    projectUuid : project.getUuid(),
                    layerUuid : layerModel.uuid
                }});

            });


        }, this);

    },

    _createDataBox : function (options) {
        var container = options.container;

        // wrapper
        var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper file-options', container);

        // layer 
        var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', toggles_wrapper, 'Layer name');
        var name_input = M.DomUtil.create('input', 'smooth-input smaller-input', toggles_wrapper);
        name_input.setAttribute('placeholder', 'Enter layer name');

        // upload geojson button
        var upload_button = M.DomUtil.create('input', 'smooth-fullscreen-save', toggles_wrapper);
        upload_button.setAttribute('id', 'geojson-upload');
        upload_button.setAttribute('type', 'file');


        var data = this._fullscreen.data;

        M.DomEvent.on(upload_button, 'change', function () {
                    
            var ctx = this;
            
            var file = ctx.files[0];

            var reader = new FileReader();

            reader.onload = function (e) {

                var geojson = M.parse(e.currentTarget.result);

                data.geojson = geojson;

            }

            reader.readAsText(file);

        });

        // graph item
        var graph_wrapper = M.DomUtil.create('div', 'toggles-wrapper file-options', container);
        var remove_button = M.DomUtil.create('div', 'toggles-wrapper-remove-button close-smooth-fullscreen', graph_wrapper, 'x');

        M.DomEvent.on(remove_button, 'click', function () {
            console.log('remove_button')
        }, this);

        var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', graph_wrapper, 'Title');
        var name_input = M.DomUtil.create('input', 'smooth-input smaller-input ', graph_wrapper);
        name_input.setAttribute('placeholder', 'Y Axis label');
        var csv_input = M.DomUtil.create('textarea', 'smooth-input smaller-input margin-top-20', graph_wrapper);
        csv_input.setAttribute('placeholder', 'Paste .csv graph data');

        M.DomEvent.on(csv_input, 'change keyup keydown', function () {
            M.DomUtil.addClass(csv_input, 'graph-item');
        }, this);

        return toggles_wrapper;
    },





});

M.graphData = function (o) {
    return new M.Data.Graph(o);
};