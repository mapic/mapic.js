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
        // console.log('click');
    },

    _addGraphs : function () {

        // create wrapper
        this._graphContainer = M.DomUtil.create('div', 'data-graph-container', app._appPane);

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

        var gridLinesColor = 'rgba(255, 255, 255, 0.4)';

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
                        ticks: {
                            callback: function(value, i, values) {
                                var date = moment(i, 'DDD');
                                var date_of_month = date.date();
                                if (date_of_month == 1) return date.format('MMM');
                            },
                            source: 'data'
                        },
                    }],
                    yAxes: [{
                        gridLines : {
                            color : gridLinesColor
                        },
                        scaleLabel: {
                            display: true,
                            labelString: this.data.y_axis_label // user-defined label
                        }
                    }]
                },
                tooltips : {
                    callbacks : {
                        title : function (tooltipItem, data) {
                            var item = tooltipItem[0];
                            var index = item.datasetIndex;
                            var date = moment(item.xLabel, 'DDD').format('D. MMM');
                            var dataset_title = data.datasets[index].label;
                            var title = chart.title + ': ' + date + ', ' + dataset_title
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
        Chart.defaults.global.defaultFontColor = 'white';


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
            var year = moment(datestring).format('YYYY');
            grouped_datasets[year] = grouped_datasets[year] || {};
            grouped_datasets[year][moment(datestring).format('DDD')] = value;
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
        var i = 0;
        _.each(filled_datasets, function (f, key_year) {
            var color = _.values(this.options.colors)[i++];
            var d = {
                label : key_year,
                backgroundColor : color,
                borderColor : color,
                fill : false,
                data : _.values(f),
                spanGaps : true
            };
            chart.data.datasets.push(d);
        }.bind(this));

        return chart;
    },

});
M.graphCSV = function (o, c) {
    return new M.Graph.CSV(o, c);
}