// -----------------------------------------------
// THIS IS A CUSTOM PLUGIN CREATED FOR SNOW RASTER 
// -----------------------------------------------
// update:
// https://github.com/mapic/mapic/issues/57
moment().utc();

// Annual Graph (hydrological year)
// created from cube layer
M.Graph.SnowCoverFraction = M.Graph.extend({

    // languages
    locale : function () {
        return this.localization[this.localization.lang];
    }, 
    localization : {
        lang : 'nor',
        // lang : 'eng',
        eng : {
            yearlyGraphs : 'Yearly graphs',
            selectYear : 'Select year(s)',
            minmax : 'Min/max',
            average : 'Average',
            layerPrefix : 'Data',
            showData : 'Only show data within mask',
            layerOptions : 'Layer options',
            layerTooltip : 'Forklaring: <br><br>Dette laget viser Snow Cover Fraction (SCF) både som graf og som satellitt-bilder på kart. <br><br>Trykk på grafen for å forandre dato.<br><br>Trykk på årstall-boksen for å vise flere år samtidig.'
        },
        nor : {
            yearlyGraphs : 'Årlige verdier',
            selectYear : 'Velg år',
            minmax : 'Min/maks',
            average : 'Gjennomsnitt',
            layerPrefix : 'Data',
            showData : 'Vis kun data innenfor masken',
            layerOptions : 'Alternativer for kartlag',
            layerTooltip : 'Forklaring: <br><br>Dette laget viser Snow Cover Fraction (SCF) både som graf og som satellitt-bilder på kart. <br><br>Trykk på grafen for å forandre dato.<br><br>Trykk på årstall-boksen for å vise flere år samtidig.'
        },
    },

    // _legendsDOM : {},

    options : {
        fetchLineGraph : false, // debug, until refactored fetching line graph to cube
        editorOptions : {
            mask : true,
            avg : true
        },
        colors : [
            '#e31a1c', // red
            '#ff7f00', // orange
            '#33a02c', // green
            '#1f78b4', // blue
            '#F9DC5C',
            '#BE5035',
            '#F4FFFD',
            '#011936',
            '#465362',
            '#93E1D8',
            '#29E7CD',
            '#2D1E2F',
            '#FCF6B1',
            '#F39C6B',
            '#FF3864',
            '#284B63',
            '#56494C',
            '#5C5D8D',
            '#8DE4FF',
            'red',
            'yellow',
        ]
    },

    _initialize : function () {

        // set project
        this._project = app.activeProject;

        // set layer
        this._layer = this.options.cube;

        this._legendsDOM = {};
        this._selectedYears = {};
        this._parsed = {};
        this._slider = {
            vertical : null,
            left : 0,
            state : false
        };
        this._range = {
            datasets : [],
            data : {} // by mask
        };


        // create DOM
        this._initContainer();

        // create dc
        this.dc = dc;


        // events
        this.on('sliderMovement', this._onSliderMovement);
        this.on('sliderClick', this._onSliderClick);
        this.options.cube.on('enabled', this._onLayerEnabled.bind(this));
        this.options.cube.on('disabled', this._onLayerDisabled.bind(this));

        M.Mixin.Events.on('toggleGraphContainer', this._onToggleGraphContainer, this);

    },

    _onLayerEnabled : function () {
        if (this._mainContainer) this._mainContainer.style.display = 'block';
        if (this._topHeader) this._topHeader.style.display = 'inline-block';
    },
    _onLayerDisabled : function () {
        if (this._mainContainer) this._mainContainer.style.display = 'none';
        if (this._topHeader) this._topHeader.style.display = 'none';
    },

    // get/set parsed based on mask.id
    parsed : function (parsed) {
        if (parsed) {
            this._parsed[this._mask.id] = parsed;
        } else {
            return this._parsed[this._mask.id];
        }
    },  

    // todo: possible bug with parsing of average data
    // make sure that "parsed()" is adding to unique mask ids above...
    parse : function (data, done) {

        // check store
        if (this.parsed()) return done(null, this.parsed());

      

        var parsed = {}

        // console.log('A001 ===> data: ', data);
        // [
        //   {
        //     "year": "2001",
        //     "doy": "1",
        //     "scf": "84.54",
        //     "ccf": "100.00",
        //     "age": "1.00"
        //   },
        //   {
        //     "year": "2001",
        //     "doy": "2",
        //     "scf": "84.54",
        //     "ccf": "98.19",
        //     "age": "1.97"
        //   }, ... // until last data in 2017

        // min/max/avg 
        parsed.mma = this.average(data);

        // console.log('A002 ==> parsed.mma', parsed.mma);
        // [
        //   {
        //     "doy": 1,
        //     "max": 86.32,
        //     "min": 67.35,
        //     "avg": 77.41277777777776,
        //     "date": "2018-01-01T19:37:59.497Z"
        //   },
        //   {
        //     "doy": 2,
        //     "max": 88.57,
        //     "min": 66.63,
        //     "avg": 77.43722222222225,
        //     "date": "2018-01-02T19:37:59.499Z"
        //   }, 
        /// ... times 365


        // console.log('A003 ==> queried_data', queried_data);
        // [
        //   {
        //     "date": "2017-09-01T00:00:00.000Z",
        //     "scf": 2.48452938117525
        //   },
        //   {
        //     "date": "2017-09-02T00:00:00.000Z",
        //     "scf": 2.6203198127925162
        //   },
        // ... times the number of days left in the last year, eg. 122

        // resample to year/doy
        // queried_data.forEach(function (q) {
        //     var item = {
        //         scf : q.scf,
        //         year : q.date.year(),
        //         doy : q.date.dayOfYear()
        //     }
        //     data.push(item);
        // });

        // yearly
        parsed.years = this.yearly(data);

        // console.log('A004 ==> parsed.years', parsed.years);
        // [
        //   {
        //     "scf": {
        //       "2001": 84.54,
        //       "2002": 83.71,
        //       "2003": 86.32,
        //       "2004": 83.44,
        //       "2005": 75.89,
        //       "2006": 82.96,
        //       "2007": 72.87,
        //       "2008": 81.24,
        //       "2009": 78.63,
        //       "2010": 83.21,
        //       "2011": 73.05,
        //       "2012": 82.75,
        //       "2013": 80.78,
        //       "2014": 67.35,
        //       "2015": 69.78,
        //       "2016": 69.78,
        //       "2017": 69.78,
        //       "2018": false
        //     },
        //     "date": "2017-01-01T19:41:59.663Z"
        //   }, ... times 365....! 

        // store
        this.parsed(parsed);

        // return 
        done && done(null, parsed);

    },

    yearly : function (data) {

        // get range
        var range = this.getRange();
        var years = _.range(range[0], range[1]+1); 

        // optimize data search, divide into years
        var dataRange = this.dataRange(); // [2001, 2018]
        var yearly_range = _.range(dataRange[0], dataRange[1] + 1); // [2001, 2002, ... 2018]

        // get hydrological year
        var hy = this._getHydrologicalYear();

        var opti_data = {};
        yearly_range.forEach(function (r) {
            opti_data[r] = _.filter(data, function (d) {
                return d.year == r;
            });
        });

        var yearly_data_2 = [];
        var hydrological_doy;
        _.times(365, function (i) {
            var dohy = i;
            var hydrological_date = moment.utc().year(hy.year).date(1).month(8).add(dohy, 'days');
            hydrological_doy = hydrological_date.dayOfYear();

            yearly_data_2[i] = {
                scf : {},
                date : hydrological_date
            };
        })

        _.forEach(years, function (y) { // [2001, 2002...2017, 2018]

            _.times(365, function (i) {

                // get hydrological date
                var dohy = i;  
                var hydrological_date = moment.utc().year(hy.year).date(1).month(8).add(dohy, 'days');
                hydrological_doy = hydrological_date.dayOfYear();

                // aug-dec
                // doy 243 = 31. aug
                // doy 244 = 1. sept
                if (hydrological_doy >= 244 && hydrological_doy <= 365) {
                    var scf = _.find(opti_data[y], function (d) {
                        return d.doy == hydrological_doy-1;
                    });
                }

                // jan-sept y+1
                if (hydrological_doy > 0 && hydrological_doy <= 243 ) {
                    var scf = _.find(opti_data[y+1], function (d) {
                        return d.doy == hydrological_doy-1;
                    });
                }

                // set 
                yearly_data_2[i].scf[y] = scf ? parseFloat(scf.scf) : false;


            });

        });
        
        // return yearly_data;
        return yearly_data_2;
    },



    // calculate min/max/avg of scf per year
    average : function (data) {

        // clear
        var average = [];

        // get hydrological year
        var hy = this._getHydrologicalYear();

        // error handling
        var errorDays = [];

        // for each day
        _.times(365, function (n) {

            var doy = n+243;
            if (doy > 365) doy -= 365;

            // get this day's values
            var today = _.filter(data, function (d) {
                return d.doy == doy;
            });

            // return if no today
            if (_.isEmpty(today)) {
                errorDays.push(doy);
                return;
            }

            // get this day's max
            var max = _.maxBy(today, function (d) {
                return parseFloat(d.scf);
            }).scf;

            // get this day's min
            var min = _.minBy(today, function (d) {
                return parseFloat(d.scf);
            }).scf;

            // get this day's avg
            var sum = 0;
            _.times(today.length, function (i) {
                sum += parseFloat(today[i].scf);
            });
            var avg = sum/today.length;
         
            // moment.utc().year(hy.year).date(1).month(8).add(i, 'days');
            var hydro_date = moment.utc().year(hy.year).date(1).month(8).add(n, 'days');

            // add to array
            average.push({
                doy   : doy,
                max  : parseFloat(max),
                min  : parseFloat(min),
                avg  : avg, 
                date : hydro_date,        // year doesn't matter, as it's avg for all years
                // date : moment.utc().year(dummy_year).dayOfYear(doy),        // year doesn't matter, as it's avg for all years
            });                                                             // however: need to add a YEAR/DATE when adding to graph, 
                                                                            // due to graph needing a date to know it should display data
        }.bind(this));

        if (!_.isEmpty(errorDays)) {
            app.feedback.err('Error in JSON data', 'Failed to create averages due to missing days in the data.');
        };

        return average;
    },

    setData : function (data, done) {

        // set timeframe & range
        this._setTimeFrame();

        if (_.isString(data)) {
            data = M.parse(data);
        }

        // parse
        this.parse(data, function (err, parsed) {
            if (err) console.error('this.parse err', err);

            // create avg pane
            this._createAverageDataPane();

            // create graph (mma)
            this._createGraph(parsed);

            // return
            done && done();

        }.bind(this));
    },

    // _parsed : {},

    onMaskSelected : function (options) {
        this.setMask(options.mask);
    },

    onMaskUnselected : function (options) {
    },

    // called when clicking mask on map
    // or when defaultMask is set on cube
    // without mask, there's no graph... 
    setMask : function (mask) {

        // set current mask
        this._mask = mask;

        // set data
        this.setData(mask.data, function (err) {

            // update line graph
            this._updateLineGraph();

            // adjust slider
            this._adjustSlider();

        }.bind(this));

    },

    _adjustSlider : function () {
        if (this._slider.left) this._slider.vertical.style("left", this._slider.left + 'px');
    },

    _listen : function () {

        // layer events 
        // (todo: rename options.cube to this._layer for more generic flow)
        this.options.cube.on('maskSelected', this.onMaskSelected.bind(this));
        this.options.cube.on('maskUnselected', this.onMaskUnselected.bind(this));
        
    },

    _initContainer : function () {
        if (this._container) return;

        // todo: refactor the DOM, incl. animator
        app._graphContainer = app._graphContainer || M.DomUtil.create('div', 'graph-container', app._appPane);
        this._mainContainer          = M.DomUtil.create('div', 'snow-graph-container',                 app._graphContainer);
        this._container              = M.DomUtil.create('div', 'big-graph-outer-container',            this._mainContainer);
        this._infoContainer          = M.DomUtil.create('div', 'big-graph-info-container',             this._container);

        // resizer
        this._resizer                = M.DomUtil.create('div', 'big-graph-resizer', this._container, '<i class="fa fa-bars" aria-hidden="true"></i>');

        // plugin container
        this._pluginMainContainer    = M.DomUtil.create('div', 'big-graph-plugin-container',           this._container);
        this._pluginContainer        = M.DomUtil.create('div', 'big-graph-plugin-main-container',      this._pluginMainContainer);
        this._pluginLegendsContainer = M.DomUtil.create('div', 'big-graph-plugin-legends-container',   this._pluginMainContainer);
        this._pluginLegendsHeader    = M.DomUtil.create('div', 'graph-legend',                         this._pluginLegendsContainer);
        this._legendContainer        = M.DomUtil.create('div', 'graph-legend',                         this._pluginLegendsContainer);
        
        // mask titles
        this._maskTitle              = M.DomUtil.create('div', 'big-graph-mask-title',                 this._infoContainer, '');
        this._layerTitle             = M.DomUtil.create('div', 'big-graph-title',                      this._infoContainer, '');
        
        // date text
        this._dateTitle              = M.DomUtil.create('div', 'big-graph-current-day',                this._container, '');
       
        // container for graph
        this._graphContainer         = M.DomUtil.create('div', 'big-graph-inner-container',            this._container);
        this._graphContainer.setAttribute('id', 'graph-container-' + this.options.cube.getUuid().substring(6, 14));    

        // help button
        this._helpButton            = M.DomUtil.create('div', 'graph-help-button', this._container);
        this._helpTooltip           = M.DomUtil.create('div', 'graph-help-tooltip', this._helpButton, '<i class="fa fa-info-circle" aria-hidden="true"></i>');
        this._helpTooltipText       = M.DomUtil.create('div', 'graph-help-tooltiptext', this._helpTooltip, this.locale().layerTooltip);

        // add editor items
        if (this.isEditor()) this._addEditorPane();

        // add standalone top header
        // this._topHeader = M.DomUtil.create('div', 'graph-top-header-container', app._graphContainer);
        this._topHeader = app.Chrome.Top._registerButton({
            name : 'SCF',
            className : 'chrome-button graph-scf-button',
            trigger : this._onTopHeaderClick,
            context : this,
            project_dependent : false,
            setLast : true
        });

        // set default resize width
        this._resize_width = this._container.offsetWidth;

        // add resize event
        M.DomEvent.on(this._resizer, 'mousedown', this._initResize, this);

        // show/hide by default
        var state = this._layer.getGraphEnabled();
        if (!state) this._hideGraphContainer(); 
    },

    _onTopHeaderClick : function () {

    },

    _initResize : function () {
        M.DomEvent.on(app._appPane, 'mousemove', this._doResize, this);
        M.DomEvent.on(app._appPane, 'mouseup', this._stopResize, this);
        this._resizer.style.cursor = 'nwse-resize';
    },

    _stopResize : function () {
        M.DomEvent.off(app._appPane, 'mousemove', this._doResize, this);
        M.DomEvent.off(app._appPane, 'mouseup', this._stopResize, this);
        this._resizeValues = false;
    },

    _doResize : function (e) {

        var container = this._container;

        // remember inital values
        if (!this._resizeValues) {
            this._resizeValues = {
                x : e.clientX,
                y : e.clientY,
                h : container.clientHeight,
                w : container.clientWidth,
                ch : this._composite.height(),
                cw : this._composite.width(),
                dl : this._dateTitle.offsetLeft,
                pt : this._pluginMainContainer.offsetTop,
                // et : this._editorPane.offsetTop
            }
        }

        // calc movement
        var movement_x = e.clientX - this._resizeValues.x;
        var movement_y = e.clientY - this._resizeValues.y;

        // set size of container
        var height = this._resizeValues.h - movement_y;
        var width = this._resizeValues.w - movement_x;
        if (height < 300) height = 300;
        if (width < 600) width = 600;
        this._container.style.height = height + 'px';
        this._container.style.width = width + 'px';

        // set size of chart
        var chart_width = this._resizeValues.cw - movement_x; // 500
        var chart_height = this._resizeValues.ch - movement_y; // 220
        if (chart_width < 500) chart_width = 500;
        if (chart_height < 220) chart_height = 220;
        this._composite.width(chart_width).height(chart_height);
        this.dc.renderAll();

        // set text offsets
        var left = this._resizeValues.dl - movement_x;
        if (left < 330) left = 330;
        this._dateTitle.style.left = left + 'px';

        // set vertical line height
        var s = this._slider.vertical[0][0];
        s.style.height = (chart_height - 40) + 'px';

        // set vertical line left
        var rof = this._container.offsetWidth - 190;
        var s_b = ((this._p * rof) / 364) + 40
        this._slider.vertical.style("left", s_b + 'px');
    },

    _addEditorPane : function () {
        // mask filter
        if (this.options.editorOptions.mask) {        
            var checkbox = this._createFilterCheckbox({
                appendTo : this._container
            });
        }
    },

    _hideGraphContainer : function () {
        M.DomUtil.addClass(this._mainContainer, 'hidden-scf-graph');
    },

    _showGraphContainer : function () {
        M.DomUtil.removeClass(this._mainContainer, 'hidden-scf-graph');
    },

    _onToggleGraphContainer : function (e) {
        var state = e.detail.state;
        if (state) {
            this._showGraphContainer();
        } else {
            this._hideGraphContainer();
        }
    },

    _createFilterCheckbox : function (options) {

        // create checkbox
        var checkbox = M.DomUtil.create('div', 'checkbox filter-chart-checkbox');
        var input = M.DomUtil.create('input', '', checkbox);
        input.setAttribute('type', 'checkbox');
        input.id = 'checkbox-' + M.Util.getRandomChars(5);
        
        // create label
        var label = M.DomUtil.create('label', '', checkbox);
        label.setAttribute('for', input.id);
        label.innerHTML = this.locale().showData;

        // mark checked if active
        if (this.cube().getFilterMask()) {
            input.setAttribute('checked', '');
        }

        // check event
        M.DomEvent.on(checkbox, 'mouseup', function (e) {

            // toggle
            this.cube().setFilterMask(!this.cube().getFilterMask());

            // update cache
            this.cube()._updateCache();

        }.bind(this));

        // add to DOM
        options.appendTo.appendChild(checkbox);

        return checkbox;
    },
   
    _createAverageDataPane : function () {
        if (this._average_pane) {
            return;
        }

        // range
        // var years = _.range(2000, 2017);
        var range = this.getRange();
        var years = _.range(range[0], range[1] + 1);

        // create pane
        var pane = this._average_pane = {};
        pane.container = M.DomUtil.create('div', 'average-data-pane-container', this._pluginContainer);

        // create title
        var title = M.DomUtil.create('div', 'average-data-pane-title', pane.container, this.locale().yearlyGraphs);

        // create select
        var btn_group = M.DomUtil.create('div', 'btn-group', pane.container);
        var btn = M.DomUtil.create('button', 'btn btn-default dropdown-toggle', btn_group, this.locale().selectYear);
        btn.setAttribute('data-toggle', 'dropdown');
        var span = M.DomUtil.create('span', 'caret', btn);
        var ul = M.DomUtil.create('ul', 'dropdown-menu bullet pull-left pull-top', btn_group);

        var cube_id = this._layer.getUuid();

        // years
        years.forEach(function (y, i) {

            var year_name = y + '-' + (parseInt(y)+1);
          
            var li = M.DomUtil.create('li', '', ul);
            var input = M.DomUtil.create('input', '', li);
            var label = M.DomUtil.create('label', '', li, year_name);

            input.id = 'years-dropdown-' + y + '-' + cube_id;
            input.setAttribute('type', 'checkbox');
            input.setAttribute('name', year_name);
            input.setAttribute('value', year_name);
            label.setAttribute('for', input.id);

            // event
            M.DomEvent.on(input, 'click', function (e) {
                var checked = e.target.checked;

                // toggle
                var err = this._averageDataToggle(y, checked);
                if (err) e.target.checked = false;

            }.bind(this))

            // set default year (hacky, but what to do)
            if (i == years.length-1) {
                setTimeout(function () {
                    input.click();
                }, 300);
            }

        }.bind(this));

    },

    // _selectedYears : {},

    getSelectedYears : function () {
         var s = [];
        _.forEach(this._selectedYears, function (v, k) {
            if (v) s.push(parseInt(k));
        });
        return s;
    },

    _averageDataToggle : function (year, checked) {

        // count and limit checked years
        var cyc = _.size(_.filter(this._selectedYears))
        if (cyc > 4 && checked) return true;

        // remember
        this._selectedYears[year] = checked;

        // set line graph to selected years
        this._setLineGraph();

        // set legend
        this._setLegends();

    },

    getColor : function (i) {
        return this.options.colors[i];
    },

    _setLegends : function () {
        var selectedYears = this.getSelectedYears();
        var range = this.getRange();
        var allYears = _.range(range[0], range[1] + 1);
        var that = this;

        // create legends
        allYears.reverse().forEach(function (s, i) {

            // if should be active
            if (_.indexOf(selectedYears, s) >= 0) {

                var div = that._legendsDOM[s];

                if (div) {
                    // show if already created
                    M.DomUtil.removeClass(div, 'displayNone');

                } else {

                    // create legend
                    var legend = M.DomUtil.create('div', 'graph-legend-module', that._legendContainer);
                    var legend_color = M.DomUtil.create('div', 'graph-legend-color', legend);
                    var legend_name = s.toString() + '-' + (parseInt(s) + 1);
                    var legend_text = M.DomUtil.create('div', 'graph-legend-text', legend, legend_name);

                    // set color
                    legend_color.style.background = that.getColor(i);

                    // rememeber
                    that._legendsDOM[s] = legend;
                }
            } else {

                // hide
                var div = that._legendsDOM[s];
                if (div) M.DomUtil.addClass(div, 'displayNone');
            }
        }.bind(this));
    },
 

    isEditor : function () {
        return app.activeProject.isEditor();
    },

    _getHydrologicalYear : function () {
        var today = moment();
        var year = today.year();
        var isSameOrAfter = today.isSameOrAfter(moment().year(year).date(1).month(8)); // 0-11 months
        this._current.hydrological_year = isSameOrAfter ? year : year - 1;
        var hy = this._current.hydrological_year;

        var h = {
            year : hy,
            minDate : moment('01-09-' + hy, "DD-MM-YYYY"),
            maxDate : moment('31-08-' + (hy + 1), "DD-MM-YYYY")
        }
        return h;
    },

    // should run only once! 
    _createGraph : function (data) {

        // store crossfilters, dimensions, etc
        this.ndx = {};

        // create average (background chart) crossfilter
        this.ndx.average_crossfilter = crossfilter(data.mma); // this._annualAverageData is avgs for 365 days

        // set dimension
        var average_dimension = this.ndx.average_crossfilter.dimension(function(d) { return d.date; });

        // create groups 
        var average_max_group = average_dimension.group().reduceSum(function(d) { return d.max });
        var average_min_group = average_dimension.group().reduceSum(function(d) { return d.min });
        var average_avg_group = average_dimension.group().reduceSum(function(d) { return d.avg });

        // get max/min date 
        var minDate = this._getHydrologicalYear().minDate;
        var maxDate = this._getHydrologicalYear().maxDate;

        // create red line (this year's data) crossfilter
        this.ndx.line_crossfilter = crossfilter([]);

        // create line dimension
        var line_dimension = this.ndx.line_crossfilter.dimension(function(d) { return d.date; });

        // create line group
        var line_groups = [];
        var range = this.getRange();
        var line_group_range = _.range(range[0], range[1] + 1);
        line_group_range.reverse().forEach(function (r) {
            line_groups.push(line_dimension.group().reduceSum(function(d) { return d.scf[r]; }));
        });

        // create composite chart @ container
        var composite = this._composite = this.dc.compositeChart(this._graphContainer);

        // define compose charts
        var compose_charts = [

            // max 
            this.dc.lineChart(composite)
            .group(average_max_group)
            .colors('#DDDDDD')
            // .colors('black')
            .renderArea(true)
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)   
            .renderDataPoints(false)
            .xyTipsOn(false),

            // min 
            this.dc.lineChart(composite)
            .group(average_min_group)
            .colors('#3C4759')
            // .colors('red')
            .renderArea(true)       
            .renderDataPoints(false)
            // .renderHorizontalGridLines(true)
            .renderHorizontalGridLines(false)
            .renderVerticalGridLines(true)
            .xyTipsOn(false),

            // avg 
            this.dc.lineChart(composite)
            .group(average_avg_group)
            .colors('white')
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            .renderDataPoints(false)
            .xyTipsOn(false),

        ]

        // get dates
        var minDate = this._getHydrologicalYear().minDate;
        var maxDate = this._getHydrologicalYear().maxDate;

        // helper fn to filter out falsey values in line graph
        function remove_falseys(source_group) {
            return {
                all : function () {
                    return source_group.all().filter(function(d) {
                        return d.value != false;
                    });
                }
            };
        }

        // add yearly lines to composite array
        var that = this;
        line_groups.forEach(function (lg, i) {
            compose_charts.push(that.dc.lineChart(composite)
            .group(remove_falseys(lg))
            .colors(this.getColor(i))
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            .dotRadius(2)
            .renderDataPoints(false)
            .xyTipsOn(false))
        }.bind(this));

        // create composite graph
        composite
        .width(500).height(220)
        .dimension(average_dimension)
        .x(d3.time.scale().domain([minDate,maxDate]))
        .y(d3.scale.linear().domain([0, 100]))
        .clipPadding(10)    
        .elasticY(false)
        .elasticX(false)
        .on('renderlet', this._onRenderlet.bind(this))
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .brushOn(false)
        .yAxisLabel('SCF (%)')
        .transitionDuration(0)          
        .compose(compose_charts);
    
        // add axis
        composite
        .xAxis()
        .tickFormat(d3.time. format('%b'));
        
        // render
        this.dc.renderAll(); 

        // update titles
        this._updateTitles();

        // update legend
        this._updateLegend();

        // mark inited
        this._graphInited = true;

        // add vertical line to graph
        this._addVerticalLine();
    },
 
    _addVerticalLine : function () {

        // remove vertical line if already existing
        var vertical_line_id = 'chart-vertical-line-' + this.options.cube.getUuid().substring(6, 14);
        var existing = M.DomUtil.get(vertical_line_id);

        if (existing) {
            M.DomUtil.remove(existing);
        }

        // define vertical line
        var chart_id = 'graph-container-' + this.options.cube.getUuid().substring(6, 14);
        var vertical = d3.select("#" + chart_id)
        .append("div")
        .attr("id", vertical_line_id)
        // .attr("id", "chart-vertical-line")
        .attr("class", 'vertical-scf-graph-line')
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "4px")
        .style("height", "180px")
        .style("bottom", "34px")
        .style("left", "40px") // starting position
        .style("background", "rgb(6, 137, 128)");

        // remember state
        var that = this;
        this._slider.vertical = vertical;

        // d3.select(".dc-chart")
        d3.select("#" + chart_id)
        .on("mousemove", function(){  
            if (!that._slider.state) return;

            var cow = that._container.offsetWidth - 150;

            // get mouse pos
            mousex = d3.mouse(this)[0];

            // max/min
            if (mousex < 40) mousex = 40;
            if (mousex > cow) mousex = cow;

            // set position of line
            vertical.style("left", mousex + "px" )

            // calc day-of-year
            // todo: check if works with all screen sizes, since we're dealing with pixels??
            var rof = that._container.offsetWidth - 190;
            var p = parseInt(((mousex - 40) / rof) * 364);

            // fire event
            that.fire('sliderMovement', {
                x : mousex,
                p : p
            });

        })
        .on("mouseover", function(){  
            if (!that._slider.state) return;

            var cow = that._container.offsetWidth - 150;
            
            // get mouse pos
            mousex = d3.mouse(this)[0];

            // max/min
            if (mousex < 40) mousex = 40;
            if (mousex > cow) mousex = cow;

            // set position of line
            vertical.style("left", mousex + "px")

            // calc day-of-year
            // todo: check if works with all screen sizes, since we're dealing with pixels??
            var rof = that._container.offsetWidth - 190;
            var p = parseInt(((mousex - 40) / rof) * 364) + 1

            // fire
            that.fire('sliderMovement', {
                x : mousex,
                p : p
            });

        })
        .on('click', function () {

            if (that._slider.state) {
                // turn OFF
                vertical.style("width", "2px" )
                that._slider.state = false;

                // fire
                that.fire('sliderClick');
                that._slider.left = mousex;

            } else {
                // turn ON
                vertical.style("width", "1px" )
                that._slider.state = true;

                // set to mousepointer on click
                mousex = d3.mouse(this)[0] + 0;
                vertical.style("left", mousex + "px")
                that._slider.left = mousex;

            }
        });


        // set to current date
        var today = moment().dayOfYear();
        var diff = today - 245;
        if (diff < 0) {
            var p = 365 + diff;
        } else {
            var p = diff;
        }

        // fire event
        that.fire('sliderMovement', {
            p : p
        });
        var todaymousex = (p * 82 / 73) + 40;
        this._slider.vertical.style("left", todaymousex + "px");

        // set cursor and dataet to current date
        var date = this._getSliderDate(this._p);
        this.cube().setCursor(date);

    },

    _onGridMousemove : function (e) {
        // console.log('_onGridMousemove'); 
    },

    _onRenderlet : function (chart) {
        // hack gridlines on top
        var chart_id = 'graph-container-' + this.options.cube.getUuid().substring(6, 14);
        var p = M.DomUtil.get(chart_id);
        var h = p.getElementsByClassName('grid-line horizontal')[0];
        var v = p.getElementsByClassName('grid-line vertical')[0];
        h.parentNode.appendChild(h);
        v.parentNode.appendChild(v);
    },

    // run each time linegraph changes at all
    // eg. when clicking on slider
    // this needs to happen, because we only want to show data
    _setLineGraph : function (options) {
        if (!this._graphInited) return;

        // Clear old data
        this.ndx.line_crossfilter.remove();

        // get cached line graph data
        var parsed_cache = this._parsed[this._mask.id];
        var cache = this._filterSelectedYears(parsed_cache.years);

        // add data to line_crossfilter
        this.ndx.line_crossfilter.add(cache);

        // redraw
        this.dc.redrawAll();

        // update titles
        this._updateTitles();
       
    },

    _filterSelectedYears : function (cache) {
        var selectedYears = this.getSelectedYears();
        var filtered = [];
        cache.forEach(function (c) {
            var item = {
                date : c.date, 
                scf : {}
            }
            selectedYears.forEach(function (s) {
                item.scf[s] = c.scf[s];
            });
            filtered.push(item);
        });
        return filtered;
    },

    _updateLegend : function () {
        if (this._legends) return;

        this._legends = {};

        // get data range
        var range = this.getRange();
        var rangeText = [range[0], range[1]+1].join('-');
        
        // create divs
        var year_container = M.DomUtil.create('div', 'graph-legend-header', this._pluginLegendsHeader, rangeText);
        var average_container = M.DomUtil.create('div', 'graph-legend-module', this._pluginLegendsHeader);
        var minmax_container = M.DomUtil.create('div', 'graph-legend-module', this._pluginLegendsHeader);
        var minmax_color = M.DomUtil.create('div', 'graph-legend-color', minmax_container);
        var average_color = M.DomUtil.create('div', 'graph-legend-color', average_container);
        this._legends.minmax_text = M.DomUtil.create('div', 'graph-legend-text', minmax_container);
        this._legends.average_text = M.DomUtil.create('div', 'graph-legend-text', average_container);

        // set values
        this._legends.minmax_text.innerHTML = this.locale().minmax; //'Min/max';
        this._legends.average_text.innerHTML = this.locale().average; //'Average';

        // set colors
        minmax_color.style.background = '#DCDCD7';
        average_color.style.background = 'white';

    },

    cube : function () {
        return this.options.cube;
    },

    getDatasetsEndDate : function () {
        // get datasets
        var datasets = this.cube().getDatasets();

        // get last dataset
        var last = _.last(datasets);

        // get date
        var year = last ? moment.utc(last.timestamp).year() : 2018;
        var day = last ? moment.utc(last.timestamp).dayOfYear() : 244;

        // return day/year    
        var current = {
            // year : date.year(),
            year : year,
            // day : date.dayOfYear()
            day : day
        }

        return current;
    },

    _setTimeFrame : function () {

        // set avg data range
        this._range.data[this._mask.id] = this.dataRange();

        // return if already set
        if (this._current && this._current.year && this._current.day) return; 

        // set current time to last day in dataset timeseries
        this._current = this.getDatasetsEndDate();

        // set range
        this._range.datasets = this.datasetRange();
    },

    // _range : {
    //     datasets : [],
    //     data : {} // by mask
    // },

    getRange : function () {
        var range = [this._range.data[this._mask.id][0], this._range.datasets[1]];
        return range;
    },

    datasetRange : function () {
        var datasets = this.cube().getDatasets();
        var last = _.last(datasets);
        var first = _.first(datasets);
        var firstYear = first ? moment.utc(first.timestamp).year() : 2018;
        var lastYear = last ? moment.utc(last.timetamp).year() : 2018;
        return [firstYear, lastYear];
    },

    dataRange : function () {
        var data = this._mask.data;
        if (_.isString(data)) {
            data = M.parse(data);
        }
        var first = _.first(data);
        var last = _.last(data);
        var firstYear = moment.utc().year(first.year).dayOfYear(first.doy);
        var lastYear = moment.utc().year(last.year).dayOfYear(last.doy);
        return [firstYear.year(), lastYear.year()];
    },

    _setDate : function (year, day) {

        // set dates
        this._current.year = year || this._current.year;
        this._current.day = day || this._current.day;

        // set graph dates
        var minDate = this._getHydrologicalYear().minDate;
        var maxDate = this._getHydrologicalYear().maxDate;

        // set date range to graph
        this._composite.x(d3.time.scale().domain([minDate,maxDate]));

        // set cube cursor
        this.cube().setCursor(moment.utc().year(year).dayOfYear(day));

        // update titles
        this._updateTitles();
    },

    _getTitle : function () {
        return this.options.cube.getTitle();
    },

    getMaskMeta : function () {
        if (!this._mask) return;
        return this._mask.meta;
    },

    _getMaskTitle : function () {
        if (!this._mask) return;
        var meta = this.getMaskMeta();
        var d = meta ? meta.title : '';
        if (_.isString(d)) return d.camelize();
        return '';
    },

    _getMaskDescription : function () {
        if (!this._mask) return;
        var meta = this.getMaskMeta();
        var d = meta ? meta.description : '';
        if (_.isString(d)) return d.camelize();
        return '';
    },

    // new slider event
    _onSliderMovement : function (options) {
        this._p = options.p;
        this._updateSCFTitle(options);
    },

    _onSliderClick : function (options) {
        var date = this._getSliderDate(this._p);
        this.cube().setCursor(date);
    },

    _updateSCFTitle : function (options) {
        var title = this._getSCFTitle(options);
        var datehtml =  '<div class="date-item-scf">' + title.scfTitle + '</div>';
        datehtml += '<div class="date-item-date">' + title.dateTitle + '</div>';
        this._dateTitle.innerHTML = datehtml;

        this._topHeader.innerHTML = 'SCF @ ' + title.date.format('Do MMM YYYY');
    },

    _getSliderDate : function (p) {
        // get day of hydrological year
        var dohy = p;

        // get hydrological year
        var hy = this._getHydrologicalYear().year;

        // get date
        var date1 = moment.utc().year(hy).date(1).month(8);
        var date = date1.add(dohy, 'days');
        return date;
    },

    _getSCFTitle : function (options) {

        // get date on slider
        var date = this._getSliderDate(options.p);
        var dateTitle = date.format('Do MMMM, YYYY');

        // get scf
        var scf = this._getSCFValue(date);
        var scfTitle = 'SCF ' + scf + ' %';

        // return date/scf
        return {
            scfTitle : scfTitle, 
            dateTitle : dateTitle,
            date : date
        }
    },

    _getSCFValue : function (date) {
        var doy = date.dayOfYear();
        var year = date.year();
        var data = this._parsed[this._mask.id].years;

        var offset = doy + 122;
        if (offset > 365) {
            offset = offset - 365;
        }
        var data2 = data[offset]; // offset with 

        
        if (!data2) return false;
        var scf = data2.scf[year];
        scf = _.isNumber(scf) ? scf.toFixed(2) : '-';
        return scf;
    },

    _updateTitles : function (options) {
        
        // layer title
        var layerhtml = '<span class="mask-item-title">' + this.locale().layerPrefix + ': </span>';
        layerhtml +=  '<span class="mask-item-value">' + _.capitalize(this._getTitle()) + '</span>';
        this._layerTitle.innerHTML = layerhtml;

        // mask title
        this._maskTitle.innerHTML = this._getMaskTitle();   
    },

    _updateLineGraph : function (options) {
        this._setLineGraph();
    },
  
    _parseDates : function (cache) {
        if (!_.isArray(cache)) return;
        cache.forEach(function (c) {
            c.date = moment.utc(c.date);
        });
        return cache;
    },
  
    _shadeButtons : function () {
        M.Mixin.Events.fire('shadeButtons'); // refactor
    },

    _unshadeButtons : function () {
        M.Mixin.Events.fire('unshadeButtons');
    },

    getCurrentDate : function () {
        return moment.utc().dayOfYear(this._current.day).year(this._current.year);
    },

    _onLoadedGraph : function () {
        this.hideLoading();
    },

    _onLoadingGraph : function () {
        this.showLoading();
    },

    showLoading : function () {
        return;
    },

    hideLoading : function () {
        return;
    },

});

