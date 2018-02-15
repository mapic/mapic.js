// -----------------------------------------------
// THIS IS A CUSTOM PLUGIN CREATED FOR SNOW RASTER 
// -----------------------------------------------
//
// - it communicates with new API endpoints which must be present on the server-side
// - all interaction with layer (adding masks, filter) should happen through this plugin
//
//
// annual graph control
// --------------------
//
//  + should be able to display an average of many years, ie. a background-image
//      - this could be of many years, or just the last year, or anything really, 
//      but it's a background image, which is good to have on a annual graph control
//  + should be able to display "current year" linegraph, on top of the background. good for showing this year's trend
//  + should be able to scroll thru different years, ie. 2014, 2013 etc.. so although the background doesn't change, the 
//      linechart is representing a specific year, and control should be aware of this
//  + should take a dataset for background (avg) to display
//  + should take a dataset for linechart - which is just an array of points in time - and display this for the current year
//  + everything is for the current year, it's an annual graph after all, so that's the reference point
//  + should listen to events for all kinds of actions - ie. be controlled by events, not by fn's

// events
// ------
//  - since object survives changing projects, the events must be silenced.

// update:
// https://github.com/mapic/mapic/issues/57

moment().utc();

// created from cube layer
// Annual Graph (cyclical)
M.Graph.SnowCoverFraction = M.Graph.extend({

    // languages
    locale : function () {
        return this.localization[this.localization.lang];
    }, 
    localization : {
        // lang : 'nor',
        lang : 'eng',
        eng : {
            yearlyGraphs : 'Yearly graphs',
            selectYear : 'Select year(s)',
            minmax : 'Min/max',
            average : 'Average',
            layerPrefix : 'Data',
            showData : 'Only show data within mask',
            layerOptions : 'Layer options'
        },
        nor : {
            yearlyGraphs : 'Årlige verdier',
            selectYear : 'Velg år',
            minmax : 'Min/maks',
            average : 'Gjennomsnitt',
            layerPrefix : 'Data',
            showData : 'Vis kun data innenfor masken',
            layerOptions : 'Alternativer for kartlag'

        },
    },

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

        // create DOM
        this._initContainer();

        // set cache
        this._initCache();

        // events
        this.on('sliderMovement', this._onSliderMovement);
        this.on('sliderClick', this._onSliderClick);
        this.options.cube.on('enabled', this._onLayerEnabled.bind(this));
        this.options.cube.on('disabled', this._onLayerDisabled.bind(this));

    },

    _onLayerEnabled : function () {
        if (this._container) this._container.style.display = 'block';
    },
    _onLayerDisabled : function () {
        if (this._container) this._container.style.display = 'none';
    },

    // get/set parsed based on mask.id
    parsed : function (parsed) {
        console.error('parsed()', parsed, this._mask.id);
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

        console.log('A001 ===> data: ', data);
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

        console.log('A002 ==> parsed.mma', parsed.mma);
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

        console.log('A004 ==> parsed.years', parsed.years);
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
        var range = this.getRange();
        var years = _.range(range[0], range[1]+1); 
        var yearly_data = [];

        // optimize data search, divide into years
        var dataRange = this.dataRange();
        var yearly_range = _.range(dataRange[0], dataRange[1] + 1);
        var opti_data = {};
        yearly_range.forEach(function (r) {
            opti_data[r] = _.filter(data, function (d) {
                return d.year == r;
            });
        });

        _.times(365, function (i) {
            var doy = i+1;

            var item = {
                scf : {}, 
                date : moment.utc().year(2017).dayOfYear(doy) // fake year, correct doy
            }

            years.forEach(function (y) {
                var scf = _.find(opti_data[y], function (d) {   // expensive op! todo: cut into years first
                    return d.doy == doy;
                });
                item.scf[y] = scf ? parseFloat(scf.scf) : false;
            }.bind(this))            

            yearly_data.push(item);

        }.bind(this));

        return yearly_data;
    },


    // calculate min/max/avg of scf per year
    average : function (data) {

        // clear
        var average = [];

        // for each day
        _.times(365, function (n) {

            var doy = n+1;

            // get this day's values
            var today = _.filter(data, function (d) {
                return d.doy == doy;
            });

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
         
            // sept - aug year
            var dummy_year = this._current.year ;
            if (n > 243) dummy_year = this._current.year - 1;

            // add to array
            average.push({
                doy   : doy,
                max  : parseFloat(max),
                min  : parseFloat(min),
                avg  : avg, 
                date : moment.utc().year(dummy_year).dayOfYear(doy),        // year doesn't matter, as it's avg for all years
            });                                                             // however: need to add a YEAR/DATE when adding to graph, 
                                                                            // due to graph needing a date to know it should display data
        }.bind(this));

        return average;
    },

    setData : function (data, done) {

        // set timeframe & range
        this._setTimeFrame();

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

    _parsed : {},

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

        console.log('setMask ... mask', mask);

        // set data
        this.setData(mask.data, function (err) {

            // update line graph
            this._updateLineGraph();

        }.bind(this));

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
        this._mainContainer          = M.DomUtil.create('div', 'snow-graph-container', app._appPane);
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
        
        // add editor items
        if (this.isEditor()) this._addEditorPane();

        // add resize event
        M.DomEvent.on(this._resizer, 'mousedown', this._initResize, this);
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
                et : this._editorPane.offsetTop
            }
        }

        // calc movement
        var movement_x = e.clientX - this._resizeValues.x;
        var movement_y = e.clientY - this._resizeValues.y;

        // set size of container
        var height = this._resizeValues.h - movement_y;
        var width = this._resizeValues.w - movement_x;
        if (height < 360) height = 360;
        if (width < 600) width = 600;
        this._container.style.height = height + 'px';
        this._container.style.width = width + 'px';

        // set size of chart
        var chart_width = this._resizeValues.cw - movement_x; // 500
        var chart_height = this._resizeValues.ch - movement_y; // 220
        if (chart_width < 500) chart_width = 500;
        if (chart_height < 220) chart_height = 220;
        this._composite.width(chart_width).height(chart_height);
        dc.renderAll();

        // set text offsets
        var left = this._resizeValues.dl - movement_x;
        if (left < 330) left = 330;
        this._dateTitle.style.left = left + 'px';

        // set editor pane offset
        var top = this._resizeValues.et + movement_y;
        if (top > -365) top = -365;
        this._editorPane.style.top = top + 'px';

    },

    _addEditorPane : function () {
        // mask filter
        if (this.options.editorOptions.mask) {        
            var checkbox = this._createFilterCheckbox({
                appendTo : this._container
            });
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
        if (this._average_pane) return;

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

        // years
        years.forEach(function (y, i) {
          
            var li = M.DomUtil.create('li', '', ul);
            var input = M.DomUtil.create('input', '', li);
            var label = M.DomUtil.create('label', '', li, y);

            input.id = 'years-dropdown-' + y;
            input.setAttribute('type', 'checkbox');
            input.setAttribute('name', y);
            input.setAttribute('value', y);
            label.setAttribute('for', input.id);

            // event
            M.DomEvent.on(input, 'click', function (e) {
                var checked = e.target.checked;

                // toggle
                this._averageDataToggle(y, checked);

            }.bind(this))

            // set default year (hacky, but what to do)
            if (i == years.length-1) {
                setTimeout(function () {
                    input.click();
                }, 300);
            }

        }.bind(this));

    },

    _selectedYears : {},

    getSelectedYears : function () {
         var s = [];
        _.forEach(this._selectedYears, function (v, k) {
            if (v) s.push(parseInt(k));
        });
        return s;
    },

    _averageDataToggle : function (year, checked) {

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

        // create legends
        allYears.reverse().forEach(function (s, i) {

            // if should be active
            if (_.indexOf(selectedYears, s) >= 0) {

                var div = this._legendsDOM[s];

                if (div) {
                    // show if already created
                    M.DomUtil.removeClass(div, 'displayNone');
                } else {

                    // create legend
                    var legend = M.DomUtil.create('div', 'graph-legend-module', this._legendContainer);
                    var legend_color = M.DomUtil.create('div', 'graph-legend-color', legend);
                    var legend_text = M.DomUtil.create('div', 'graph-legend-text', legend, s);

                    // set color
                    legend_color.style.background = this.getColor(i);

                    // rememeber
                    this._legendsDOM[s] = legend;
                }
            } else {

                // hide
                var div = this._legendsDOM[s];
                if (div) M.DomUtil.addClass(div, 'displayNone');
            }
        }.bind(this));
    },
 
    _legendsDOM : {},

    isEditor : function () {
        return app.activeProject.isEditor();
    },

    _getHydrologicalYear : function () {
        var today = moment();
        var year = today.year();
        var isAfter = today.isSameOrAfter(moment().year(year).date(1).month(9));
        this._current.hydrological_year = isAfter ? year : year - 1;
        var hy = this._current.hydrological_year;

        var h = {
            year : hy,
            minDate : moment('01-09-' + hy, "DD-MM-YYYY"),
            maxDate : moment('01-09-' + (hy + 1), "DD-MM-YYYY")
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
        var minDate = average_dimension.bottom(1)[0].date;  // this is jan 1 2015.. shouldn't be a YEAR per say, since it messes with the line graph (which needs to be in same year to display)
        var maxDate = average_dimension.top(1)[0].date;     
        
        // debug
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
        var composite = this._composite = dc.compositeChart(this._graphContainer);

        // define compose charts
        var compose_charts = [

            // max 
            dc.lineChart(composite)
            .group(average_max_group)
            .colors('#DDDDDD')
            .renderArea(true)
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)   
            .renderDataPoints(false)
            .xyTipsOn(false),

            // min 
            dc.lineChart(composite)
            .group(average_min_group)
            .colors('#3C4759')
            .renderArea(true)       
            .renderDataPoints(false)
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            .xyTipsOn(false),

            // avg 
            dc.lineChart(composite)
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
        line_groups.forEach(function (lg, i) {
            compose_charts.push(dc.lineChart(composite)
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
        .on('renderlet', this._onRenderlet)
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
        dc.renderAll(); 

        // update titles
        this._updateTitles();

        // update legend
        this._updateLegend();

        // mark inited
        this._graphInited = true;

        // add vertical red line to graph
        this._addVerticalLine();
    },

    _addVerticalLine : function () {

        // remove vertical line if already existing
        var existing = M.DomUtil.get('chart-vertical-line');
        if (existing) M.DomUtil.remove(existing);

        // define vertical line
        var vertical = d3.select(".dc-chart")
        .append("div")
        .attr("id", "chart-vertical-line")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "2px")
        .style("height", "180px")
        .style("bottom", "34px")
        .style("left", "40px") // starting position
        .style("background", "#db5758");

        // remember state
        app._vl_state = false;
        var that = this;

        d3.select(".dc-chart")
        .on("mousemove", function(){  
            if (!app._vl_state) return;
            
            // get mouse pos
            mousex = d3.mouse(this)[0];

            // max/min
            if (mousex < 40) mousex = 40;
            if (mousex > 450) mousex = 450;

            // set position of line
            vertical.style("left", mousex + "px" )

            // calc day-of-year
            // todo: check if works with all screen sizes, since we're dealing with pixels??
            var p = parseInt(((mousex - 40) / 410) * 364) + 1

            // fire event
            that.fire('sliderMovement', {
                x : mousex,
                p : p
            });

        })
        .on("mouseover", function(){  
            if (!app._vl_state) return;
            
            // get mouse pos
            mousex = d3.mouse(this)[0];

            // max/min
            if (mousex < 40) mousex = 40;
            if (mousex > 450) mousex = 450;

            // set position of line
            vertical.style("left", mousex + "px")

            // calc day-of-year
            // todo: check if works with all screen sizes, since we're dealing with pixels??
            var p = parseInt(((mousex - 40) / 410) * 364) + 1

            // fire
            that.fire('sliderMovement', {
                x : mousex,
                p : p
            });

        })
        .on('click', function () {

            if (app._vl_state) {
                // turn OFF
                vertical.style("width", "2px" )
                app._vl_state = false;

                // fire
                that.fire('sliderClick');

            } else {
                // turn ON
                vertical.style("width", "1px" )
                app._vl_state = true;

                // set to mousepointer on click
                mousex = d3.mouse(this)[0] + 0;
                vertical.style("left", mousex + "px")

            }
        });

    },

    _onGridMousemove : function (e) {
        // console.log('_onGridMousemove'); 
    },

    _onRenderlet : function (chart) {
        // hack gridlines on top
        var h = document.getElementsByClassName('grid-line horizontal')[0];
        var v = document.getElementsByClassName('grid-line vertical')[0];
        h.parentNode.appendChild(h);
        v.parentNode.appendChild(v);
    },

    // run each time linegraph changes at all
    // eg. when clicking on slider
    // this needs to happen, because we only want to show data
    _setLineGraph : function (options) {
        console.error('##########  _setLineGraph');
        console.log('this._parsed', this._parsed);
        console.log('this._mask', this._mask);
        console.log('this._mask.id', this._mask.id);
        console.log('parsed_cache', this._parsed[this._mask.id]);
        console.log('---')
        if (!this._graphInited) return;


        // Clear old data
        this.ndx.line_crossfilter.remove();

        // get cached line graph data
        var parsed_cache = this._parsed[this._mask.id];
        var cache = this._filterSelectedYears(parsed_cache.years);

        // filter out current year's data @ current year's date
        // with filter @ composite
        var currentYear = this._current.year;
        var currentDay = this._current.day;
        var today = moment().year(currentYear).dayOfYear(currentDay);
        var clone = cache.slice();
        clone.forEach(function (c) {
            if (c.date.isAfter(today)) {
               c.scf[currentYear] = false;
            }
        });

        // add data to line_crossfilter
        this.ndx.line_crossfilter.add(clone);

        // redraw
        dc.redrawAll();

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
        var rangeText = [range[0], range[1]-1].join('-');
        
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

    _cache : {
        masks : {},
        data : {}
    },

    getDatasetsEndDate : function () {
        // get datasets
        var datasets = this.cube().getDatasets();

        // get last dataset
        var last = _.last(datasets);

        // get date
        var date = moment.utc(last.timestamp);

        // return day/year    
        var current = {
            year : date.year(),
            day : date.dayOfYear()
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

    _range : {
        datasets : [],
        data : {} // by mask
    },

    getRange : function () {
        var range = [this._range.data[this._mask.id][0], this._range.datasets[1]];
        return range;
    },

    datasetRange : function () {
        var datasets = this.cube().getDatasets();
        var last = _.last(datasets);
        var first = _.first(datasets);
        var firstYear = moment.utc(first.timestamp).year();
        var lastYear = moment.utc(last.timetamp).year();
        return [firstYear, lastYear];
    },

    dataRange : function () {
        var data = this._mask.data;
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
            dateTitle : dateTitle
        }
    },

    _getSCFValue : function (date) {
        var doy = date.dayOfYear();
        var year = date.year();
        var data = this._parsed[this._mask.id].years;
        var data2 = data[doy];
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
  
    _initCache : function () {
        var masks = this.options.cube._cube.masks;
        _.each(masks, function (m) {
            this._cache.masks[m.id] = m;
        }.bind(this));
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

