M.Layer = M.Layer || {};
M.Layer.Graph = M.Model.Layer.GeoJSONMaskLayer.extend({

    type : 'graph',

    options : {
        style : {
            fillColor : 'white',
            color: 'white',
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

        // set options
        M.setOptions(this, options);

        // set store
        this.store = options;

        // parse data
        this.data = M.parse(this.store.data.graph);

        // set map
        this._map = app._map;

        // init layer
        this._initLayer();


    },

    _initLayer : function () {

        // ensure simple geometry of geojson (as far as possible) // todo: move to import
        var geojson = this.ensureFlat(this.data.geojson);

        // create geojson layer
        this.layer = L.geoJson(geojson);

        // set default style
        this.layer.setStyle(this.options.style);

        // events
        this.layer.on('mouseover', this._onLayerMouseOver, this);
        this.layer.on('mouseout', this._onLayerMouseOut, this);
        this.layer.on('click', this._onLayerClick, this);
    },

    _onLayerMouseOver : function () {
        this.layer.setStyle(this.options.hoverStyle);
    },
    _onLayerMouseOut : function () {
        this.layer.setStyle(this.options.style);
    },
    _onLayerClick : function () {
    },

    _onResizerStart : function (e) {
        if (this._resizerActive) return;
        this._resizerActive = true;
        M.DomEvent.on(app._appPane, 'mousemove', this._onResizerMove, this);
        M.DomEvent.on(app._appPane, 'mouseup', this._onResizerStop, this);
    },
    _onResizerStop : function () {
        this._resizerActive = false;
        this._resizerStartPosition = false;
        M.DomEvent.off(app._appPane, 'mouseup', this._onResizerStop, this);
        M.DomEvent.off(app._appPane, 'mousemove', this._onResizerMove, this);
    },
    _onResizerMove : function (e) {
        var pos = e.screenX;

        if (this._resizerStartPosition === false) {
            this._resizerStartPosition = pos;
            this._resizerStartWidth = 50;
        }

        var movement = this._resizerStartPosition - pos;
        var zoom = parseInt(movement / 10) + this._resizerStartWidth;
        app._graphWrapper.style.width = zoom + '%';

    },
    _resizerStartPosition : false,

    setGraphTitle : function (title) {
       
        // save csv
        try {
            this.data.csv[0].csv.data[0][1] = title;
            this.store.data.graph = M.stringify(this.data);
            this.save('data');
            return this;
        } catch (e) {
            console.error('Could not save!', e);
            return false;
        }
    },

    getGraphTitle : function () {
        var csv = this.data.csv[0];
        var y_axis_label = csv.y_axis_label;
        var graph_title = csv.csv.data[0][1];

        return graph_title;
    },

    getGraphYAxisTitle : function () {
        var csv = this.data.csv[0];
        var y_axis_label = csv.y_axis_label;
        return y_axis_label;
    },

    setGraphYAxisTitle : function (title) {
        // save csv
        try {
            this.data.csv[0].y_axis_label = title;
            this.store.data.graph = M.stringify(this.data);
            this.save('data');
            return this;
        } catch (e) {
            console.error('Could not save!', e);
            return false;
        }
    },

    _addGraphs : function () {

        // wrapper for all graphs
        if (!app._graphWrapper) { 
            app._graphWrapper = M.DomUtil.create('div', 'data-graph-wrapper', app._appPane);
            app._resizer =  M.DomUtil.create('div', 'data-graph-wrapper-resizer', app._graphWrapper);
        
            M.DomEvent.on(app._resizer, 'mousedown', this._onResizerStart, this);
        }

        // create wrapper
        this._graphContainer = M.DomUtil.create('div', 'data-graph-container', app._graphWrapper);

        // create chart per csv
        _.each(this.data.csv, function (o) {

            // create graph
            var graph = M.graphCSV(o, this._graphContainer);
            
        }.bind(this));

    },

    _removeGraphs : function () {
        if (!this._graphContainer) return;
        M.DomUtil.remove(this._graphContainer);
    },

    add : function () {

        // add layer to map
        app._map.addLayer(this.layer);

        // add graphs
        this._addGraphs();

        // add to active layers
        app.MapPane.addActiveLayer(this);   // includes baselayers, todo: evented

        console.log('Model.Layer.Graph', this);

    },

    _flush : function () {
        this.remove();
    },

    remove : function () {

        // remove layer from map
        app._map.removeLayer(this.layer);

        // remove graphs
        this._removeGraphs();
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


M.Graph = M.Graph || {};
M.Graph.CSV = M.Evented.extend({

    options : {
        colors : {
            red: 'rgb(255, 99, 132)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            orange: 'rgb(255, 159, 64)',
            yellow: 'rgb(255, 205, 86)',
            purple: 'rgb(153, 102, 255)',
            grey: 'rgb(201, 203, 207)'
        }
    },

    initialize : function (data, container) {

        // set data
        this.data = data;

        // set container
        this._container = container;

        // create graph content
        this._initContent();

    },

    _initContent : function () {

        // create unique canvas id
        this._canvasID = 'canvas-' + M.Util.getRandomChars(5);
        
        // create canvas
        this._canvas = M.DomUtil.create('canvas', this._canvasID, this._container).getContext('2d');

        // create chart data
        var chart = this._createChartData();

        var y_axis_label =  this.data.y_axis_label;

        // var gridLinesColor = 'rgba(255, 255, 255, 0.4)';
        var gridLinesColor = 'rgba(0, 0, 0, 0.4)';

        // chart config
        var config = {
            type: 'line',
            data : chart.data,
            options: {
                title:{
                    text: chart.title,
                    display : true,
                    fontSize : 16,
                },
                scales: {
                    xAxes: [{
                        gridLines : {
                            color : gridLinesColor
                        },
                        type: 'time',
                        display : true,
                        ticks: {
                            callback: function(value, i, values) {
                                // console.log('valuye', value);
                                var date = moment(i, 'DDD');
                                var date_of_month = date.date();
                                if (date_of_month == 1) return date.format('MMM');
                            },
                            source: 'data',
                        },
                    }],
                    yAxes: [{
                        gridLines : {
                            color : gridLinesColor,
                        },
                        scaleLabel: {
                            display: true,
                            labelString: this.data.y_axis_label // user-defined label
                        }
                    }]
                },
                tooltips : {
                    bodySpacing : 4,
                    xPadding : 16,
                    yPadding : 16,
                    titleFontSize : 15,
                    bodyFontSize : 15,
                    bodySpacing : 10,
                    titleMarginBottom : 12,
                    backgroundColor : 'rgba(0,0,0,0.7)',
                    callbacks : {
                        title : function (tooltipItem, data) {
                            var item = tooltipItem[0];
                            var index = item.datasetIndex;
                            var date = moment(item.xLabel, 'DDD').format('D. MMM');
                            var dataset_title = data.datasets[index].label;
                            var title = date + ', ' + dataset_title
                            return title;
                        },
                        label : function (tooltipItem, data) {
                            return _.capitalize(y_axis_label) + ': ' + tooltipItem.yLabel;
                        },
                    }
                }
            }
        };

        // globals options
        Chart.defaults.global.defaultFontColor = 'black';

        // create chart
        this.chart = new Chart(this._canvas, config);

    },

    _createChartData : function () {

        // clone
        var csv = _.cloneDeep(this.data.csv.data);

        // get title
        var column_title = csv[0][1];

        // remove title from csv
        var csv = _.drop(csv);

        // format each date into proper moment date
        var grouped_datasets = {};
        _.each(csv, function (c) {
            var datestring = c[0];
            var value = c[1];
            var moment_date = moment(datestring, 'DD/MM/YYYY');
            var year = moment_date.format('YYYY');
            grouped_datasets[year] = grouped_datasets[year] || {};
            grouped_datasets[year][moment_date.format('DDD')] = value;
            // grouped_datasets[year][moment_date] = value;
        });

        // fill in the blanks in days-of-year
        var filled_datasets = _.cloneDeep(grouped_datasets);
        _.each(filled_datasets, function (y) {
            _.times(365, function (i) {
                var n = i+1;
                y[n] = y[n] || 'NaN';
            });
        });

        // create labels
        var x_axis_labels = [];
        _.times(365, function (i) {
            x_axis_labels.push(i+1);
        });
        
        // set chart data
        var chart = {
            data : {
                labels : x_axis_labels,
                datasets : []
            },
            title : column_title
        }

        // create datasets
        // https://canvasjs.com/docs/charts/basics-of-creating-html5-chart/date-time-axis/
        var i = 0;
        _.each(filled_datasets, function (f, key_year) {
            var color = _.values(this.options.colors)[i++];
            var d = {
                label : key_year,
                backgroundColor : color,
                borderColor : color,
                fill : false,
                data : _.values(f),
                spanGaps : true,
                borderWidth : 1,
                cubicInterpolationMode: 'monotone'
            };
            chart.data.datasets.push(d);
        }.bind(this));

        return chart;
    },

});
M.graphCSV = function (o, c) {
    return new M.Graph.CSV(o, c);
}