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
        console.log('click');
    },

    _addGraphs : function () {
        console.log('_addGraphs');
        console.log('csv:', this.data.csv);

        // create wrapper
        this._graphContainer = M.DomUtil.create('div', 'data-graph-container', app._appPane);

        // create chart per csv
        _.each(this.data.csv, function (o) {

            // create graph
            var graph = M.graphCSV(o, this._graphContainer);
            
        }.bind(this));

    },

    _removeGraphs : function () {
        M.DomUtil.remove(this._graphContainer);
    },

    add : function () {

        // add layer to map
        app._map.addLayer(this.layer);

        // add graphs
        this._addGraphs();
    },

    remove : function () {

        // remove layer from map
        app._map.removeLayer(this.layer);

        // remove graphs
        this._removeGraphs();
    },

});


M.Graph = M.Graph || {};
M.Graph.CSV = M.Evented.extend({

    options : {
        colors : {
            red: 'rgb(255, 99, 132)',
            orange: 'rgb(255, 159, 64)',
            yellow: 'rgb(255, 205, 86)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            purple: 'rgb(153, 102, 255)',
            grey: 'rgb(201, 203, 207)'
        }
    },

    initialize : function (data, container) {
        console.log('M.Graph.CSV', data, container);

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
        var chart_data = this._createChartData();

        // chart config
        var config = {
            type: 'line',
            data : chart_data,
 
            options: {
                title:{
                    text: "Chart.js Time Scale"
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time : {
                            format: 'D. MMM YYYY',
                            tooltipFormat: 'D. MMM YYYY'
                        },
                        // distribution: 'series', // even spread
                        distribution: 'linear',
                        ticks: {
                            callback: function(value, i, values) {
                                // format x-axis dates
                                var v = values[i].value;
                                return moment(v).format('D. MMM YY')
                            },
                            source: 'labels'
                        },
                        scaleLabel: {
                            display: false, // don't show title label for y-axis
                            // labelString: 'Date'
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: this.data.y_axis_label // user-defined label
                        }
                    }]
                },
            }
        };

        // create chart
        this.chart = new Chart(this._canvas, config);

    },

    _createChartData : function () {

        var csv_data = this.data.csv.data;

        // get labels
        var labels = _.first(csv_data);

        var zipped = _.zip(csv_data);

        // sort into colums
        var sorted = {};
        _.each(csv_data, function (c) {
            _.each(c, function (o, i) {
                sorted[i] = sorted[i] || [];
                sorted[i].push(o);
            });
        });

        // format dates
        var dl = [];
        _.each(_.drop(sorted[0]), function (d) {
            dl.push(moment(d));
        });

        // set chart data
        var chart_data = {
            labels : dl,
            datasets : []
        };

        // clone remaining values
        var sorted_values = _.cloneDeep(sorted);

        // remove first date key
        _.unset(sorted_values, '0');

        // parse rest of data
        _.each(sorted_values, function (s) {
            var label = s[0];
            var color = _.sample(this.options.colors);
            var d = {
                label : s[0],
                backgroundColor :color,
                borderColor : color,
                fill : false,
                data : _.drop(s)
            }

            // push to stack
            chart_data.datasets.push(d);
        
        }.bind(this));

        return chart_data;
    },
});
M.graphCSV = function (o, c) {
    return new M.Graph.CSV(o, c);
}