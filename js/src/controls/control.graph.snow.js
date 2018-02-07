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
// 
// 1. average - done
// 2. animator
// 3. 

moment().utc();

// created by cube layer
// Annual Graph (cyclical)
M.Graph.SnowCoverFraction = M.Graph.extend({

    // languages
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
    locale : function () {
        return this.localization[this.localization.lang];
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

        console.error('SNOW _initialize options', this.options);

        // set project
        this._project = app.activeProject;

        // create DOM
        this._initContainer();

        // plug animator
        this._plugAnimator();

        // events
        this.on('sliderMovement', this._onSliderMovement);

        this.options.cube.on('enabled', this._onLayerEnabled.bind(this));
        this.options.cube.on('disabled', this._onLayerDisabled.bind(this));

    },

    _onLayerEnabled : function () {
        console.log('LAYER ENABLED');
        if (this._container) this._container.style.display = 'block';
    },
    _onLayerDisabled : function () {
        console.log('LAYER DISABLED');
        if (this._container) this._container.style.display = 'none';
    },

    // get/set parsed based on mask.id
    parsed : function (parsed) {
        if (parsed) {
            this._parsed[this._mask.id] = parsed;
        } else {
            return this._parsed[this._mask.id];
        }
    },  

    parse : function (data, done) {

        // check store
        if (this.parsed()) return done(null, this.parsed());

        // query non-data year (ie. query from actual raster datasets)
        this.query_yearly('2017', function (err, queried_data) {
            if (err) return done(err);

            var parsed = {}

            // min/max/avg 
            parsed.mma = this.average(data);

            // resample to year/doy
            queried_data.forEach(function (q) {
                var item = {
                    scf : q.scf,
                    year : q.date.year(),
                    doy : q.date.dayOfYear()
                }
                data.push(item);
            });

            // yearly
            parsed.years = this.yearly(data);

            // store
            this.parsed(parsed);

            // return 
            done && done(null, parsed);

        }.bind(this));

    },

    query_yearly : function (year, done) {

        var query_options = {
            query_type : 'scf-geojson',
            mask_id : this._mask ? this._mask.id : false, //'mask-gkceetoa', // debug
            year : year,  
            day : this._current.day, // needed? 
            options : {
                currentYearOnly : true,
                filter_query : false,
                // force_query : true,
            },
        }

        // query data from cube
        this.cube().query(query_options, function (err, query_results) {
            if (err) return done(err);

            // parse
            var fractions = M.parse(query_results);

            // parse dates
            var parsed_data = this._parseDates(fractions);

            done && done(null, parsed_data);
        
        }.bind(this));

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
            console.log('this._current.year', this._current.year);
            var dummy_year = this._current.year ;
            if (n > 243) dummy_year = this._current.year - 1;

            // add to array
            average.push({
                doy   : doy,
                max  : parseFloat(max),
                min  : parseFloat(min),
                avg  : avg, 
                date : moment.utc().year(dummy_year).dayOfYear(doy), // year doesn't matter, as it's avg for all years
            });                                                              // however: need to add a YEAR/DATE when adding to graph, 
                                                                             // due to graph needing a date to know it should display data
            
        }.bind(this));

        console.log('average', average);

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

        // set data
        this.setData(mask.data, function (err) {

            // update line graph
            this._updateLineGraph();

            // set initial date
            this._setLastDate();

        }.bind(this));

    },

    _plugAnimator : function () {

        // // set animator
        // this._animator = this.options.animator;

        // // connect graph
        // this._animator.plugGraph(this); // todo: create event for this

        // // listen for animator events
        // this._animator.on('update', this.onUpdateTimeframe.bind(this));
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
        
        // mask meta
        // this._maskMeta               = M.DomUtil.create('div', 'big-graph-mask-meta-container',        this._infoContainer);
       
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
                // ah : this._animator.sliderInnerContainer.clientHeight,
                // aw : this._animator.sliderInnerContainer.clientWidth,
                // sw : this._animator.slider.target.clientWidth,
                // sbw : this._animator.sliderButtonsContainer.clientWidth,
                dl : this._dateTitle.offsetLeft,
                pt : this._pluginMainContainer.offsetTop,
                et : this._editorPane.offsetTop
            }
        }


        // calc movement
        var movement_x = e.clientX - this._resizeValues.x;
        var movement_y = e.clientY - this._resizeValues.y;
        // console.log('movement_x', movement_x)
        // console.log('movement_y', movement_y)

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

        // set size of bottom container
        // var bottom_container = this._animator.sliderInnerContainer;
        // var width = this._resizeValues.aw - movement_x;
        // if (width < 600) width = 600;
        // bottom_container.style.width = width + 'px';

        // set size of slider
        // var slider = this._animator.slider.target;
        // var width = this._resizeValues.sw - movement_x;
        // if (width < 420) width = 420;
        // slider.style.width = width + 'px';

        // set size of slider buttons
        // var slider_button = this._animator.sliderButtonsContainer;
        // var width = this._resizeValues.sbw - movement_x;
        // if (width < 530) width = 530;
        // slider_button.style.width = width + 'px';

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

        // // container
        // this._editorPane = M.DomUtil.create('div', 'big-graph-editor-pane');

        // // insert above outer container
        // this.options.appendTo.insertBefore(this._editorPane, this.options.appendTo.firstChild);

        // // title
        // this._editorPaneTitle = M.DomUtil.create('div', 'big-graph-editor-pane-title', this._editorPane, this.locale().layerOptions);

        // // mask filter
        // this._filterPane = M.DomUtil.create('div', 'big-graph-editor-filter-pane', this._editorPane);

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

        console.log('this._selectedYears', this._selectedYears);

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
        var minDate = moment("01-09-2017", "DD-MM-YYYY");
        var maxDate = moment("31-08-2018", "DD-MM-YYYY");

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


        // debug
        console.log('minDate, maxDate', minDate, maxDate);
        var minDate = moment("01-09-2017", "DD-MM-YYYY");
        var maxDate = moment("31-08-2018", "DD-MM-YYYY");
        console.log('minDate, maxDate', minDate, maxDate);

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
        // .style("top", "154px")
        .style("bottom", "34px")
        .style("left", "40px") // starting position
        .style("background", "#db5758");


        // remember state
        app._vl_state = false;
        var that = this;


        d3.select(".dc-chart")
        .on("mousemove", function(){  
            if (!app._vl_state) return;
            console.log('mousemove');
            
            mousex = d3.mouse(this)[0];

            // max/min
            if (mousex < 40) mousex = 40;
            if (mousex > 450) mousex = 450;

            mousex = mousex + 0;
            vertical.style("left", mousex + "px" )

            // calc day-of-year
            // todo: check if works with all screen sizes, since we're dealing with pixels??
            var p = parseInt(((mousex - 40) / 410) * 364) + 1

            that.fire('sliderMovement', {
                x : mousex,
                p : p
            });

        })
        .on("mouseover", function(){  
            if (!app._vl_state) return;
            
            mousex = d3.mouse(this)[0];

            // max/min
            if (mousex < 40) mousex = 40;
            if (mousex > 450) mousex = 450;

            mousex = mousex + 0;
            vertical.style("left", mousex + "px")

            console.log('mousex', mousex);

            // calc day-of-year
            // todo: check if works with all screen sizes, since we're dealing with pixels??
            var p = parseInt(((mousex - 40) / 410) * 364) + 1

            that.fire('sliderMovement', {
                x : mousex,
                p : p
            });

        })
        .on('click', function () {
            console.log('CLICK!');

            if (app._vl_state) {
                // turn OFF
                vertical.style("width", "2px" )
                app._vl_state = false;
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

        // todo: add labels on hover
        // chart.selectAll('path.line')
        // // chart.selectAll('g.stack_0')
        //     .on('mouseover.foo', function(d) {
        //         console.log('d', d, arguments);
        //         // chart.select('.display-qux').text(dateFormat(d.data.key) + ': ' + d.data.value);
        //     })
        //     .on('mouseout.foo', function(d) {
        //         console.log('d out', d);
        //         // chart.select('.display-qux').text('');
        //     });
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

        console.log('filtered cache', cache);

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

        console.log('clone: ', clone);
        console.log('this._currnet', this._current);

        // add data to line_crossfilter
        this.ndx.line_crossfilter.add(clone);

        // redraw
        dc.redrawAll();

        // calculate limit of dataset
        var limit = _.size(this.cache().mask()) + 1;

        // set limit
        this._setLimit(limit);

        // update titles
        this._updateTitles();
       
        // check if end of dataset
        this._checkEnds();

    },

    _filterSelectedYears : function (cache) {
        var selectedYears = this.getSelectedYears();
        console.log('selectedYears', selectedYears);
        var filtered = [];
        console.log('cache --->', cache);
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

        // debug
        // var current = {
        //     year : 2017,
        //     day : 300
        // }

        console.log('current --->', current);
        return current;
    },

    _setLastDate : function () {
        if (this._dateSet) return;

        // get end date
        var date = this.getDatasetsEndDate();

        // set date in graph
        this._setDate(date.year, date.day);

        // mark
        this._dateSet = true;
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
        var minDate = moment.utc().year(this._current.year).dayOfYear(1);
        var maxDate = moment.utc().year(this._current.year + 1).dayOfYear(-1); // last day of year

        // debug
        var minDate = moment("01-09-2017", "DD-MM-YYYY");
        var maxDate = moment("31-08-2018", "DD-MM-YYYY");

        // set date range to graph
        this._composite.x(d3.time.scale().domain([minDate,maxDate]));

        // set slider
        // this._animator.setSlider(day);

        // set cube cursor
        this.cube().setCursor(moment.utc().year(year).dayOfYear(day));

        // set slider
        // this._animator.setSlider(day);

        // update titles
        this._updateTitles();
    },

    onUpdateTimeframe : function (options) {
        var value = options.value;

        // set day
        this._current.day = value;

        // update line graph
        this._updateLineGraph({
            evented : true
        });

        // update titles
        this._updateTitles();
    },

    setTime : function (time) {

        // ensure proper time
        if (!time || !_.isObject(time)) return console.error('wrong time');

        // set current time
        this._current = this._current || {};
        this._current.day = time.day || this._current.day;
        this._current.year = time.year || this._current.year;

        // update line graph
        this._updateLineGraph({
            evented : true
        });

        // update titles
        this._updateTitles();
    },

    onUpdateTimeframe : function (options) {
        this.setTime({
            day : options.day, // value from animator
            year : options.year
        });
    },

    // for yearly movement, currently not in use
    _onSliderMoveBackward : function (e) {

        // set year
        this._current.year = this._current.year - 1;

        // update line graph
        this._updateLineGraph();

        // update titles
        this._updateTitles();
    },

    // for yearly movement, currently not in use
    _onSliderMoveForward : function (e) {

        // set year
        this._current.year = this._current.year + 1;

        // update line graph
        this._updateLineGraph();

        // update titles
        this._updateTitles();
    },

    _onAnimatorMovePreviousYear : function (e) {
        var day = e.detail.day;

        // set year
        this._current.year = this._current.year - 1;

        // set day
        this._current.day = day;

        // update line graph
        this._updateLineGraph();

        // update titles
        this._updateTitles();
    },

    _onAnimatorMoveNextYear : function (e) {
        var day = e.detail.day;

        // set year
        this._current.year = this._current.year + 1;

        // set day
        this._current.day = day;

        // update line graph
        this._updateLineGraph();

        // update titles
        this._updateTitles();
    },

    _getTitle : function () {
        return this.options.cube.getTitle();
    },

    _getDateTitle : function () {
        // get titles
        var date = moment.utc().year(this._current.year).dayOfYear(this._current.day);
        var dateTitle = date.format('Do MMMM, YYYY');
        var cache = this.cache().mask();
        var scf = _.find(cache, function (c) {
            return c.date.isSame(date, 'day');
        });
        var scfTitle = scf ? 'SCF: ' + (Math.round(scf.scf * 10) / 10) + '%' : '';
        // return dateTitle + ' &nbsp;&nbsp;&nbsp;   <span style="font-weight:900">SCF: ' + scfTitle + '</span>';

        return [dateTitle, scfTitle];
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
        console.log('_onSliderMovement', options);

        this._updateSCFTitle(options);
    },

    _updateSCFTitle : function (options) {
         var title = this._getSCFTitle(options);
    },

    _getSCFTitle : function (options) {
        console.log('_getSCFTitle options', options);

        // get titles
        var date = moment.utc().year(this._current.year).dayOfYear(this._current.day);
        var dateTitle = date.format('Do MMMM, YYYY');
        var cache = this.cache().mask();

        console.log('maseL', cache);

        var scf = _.find(cache, function (c) {
            return c.date.isSame(date, 'day');
        });

        var scfTitle = scf ? 'SCF: ' + (Math.round(scf.scf * 10) / 10) + '%' : '';

        return [dateTitle, scfTitle];
    },

    _updateTitles : function (options) {
        
        // clear old
        // this._maskMeta.innerHTML = '';

        // var meta = this.getMaskMeta();

        // _.forEach(meta, function (value, key, m) {
            
        //     // skip title
        //     if (key == 'title') return;

        //     // skip debugs
        //     if (key == value) return;

        //     // skip empty entries
        //     if (_.isEmpty(value)) return;

        //     // create meta div
        //     var div = M.DomUtil.create('div', 'big-graph-mask-meta-item', this._maskMeta);
        //     var html = '<span class="mask-item-title">' + _.capitalize(key) + ': </span>';
        //     html +=  '<span class="mask-item-value">' + _.capitalize(value) + '</span>';
        //     div.innerHTML = html;

        // }.bind(this))

        // layer title
        var layerhtml = '<span class="mask-item-title">' + this.locale().layerPrefix + ': </span>';
        layerhtml +=  '<span class="mask-item-value">' + _.capitalize(this._getTitle()) + '</span>';
        this._layerTitle.innerHTML = layerhtml;

        // mask title
        this._maskTitle.innerHTML = this._getMaskTitle();   

        // date        
        var datetitle = this._getDateTitle();
        var datehtml =  '<div class="date-item-scf">' + datetitle[1] + '</div>';
        datehtml += '<div class="date-item-date">' + datetitle[0] + '</div>';
        this._dateTitle.innerHTML = datehtml;

    },

    // todo: move query to separate fn (use one above)
    _updateLineGraph : function (options) {

        // if data is available, set graph
        if (this.cache().mask()) return this._setLineGraph();

        // return if already fetching data
        if (this._fetching) return console.error('already fetching data...');

        // mark fetching (to avoid parallel fetching)
        this._fetching = true;

        // data not available yet, need to fetch
        var query_options = {
            query_type : 'scf-geojson',
            mask_id : this._mask ? this._mask.id : false, //'mask-gkceetoa', // debug
            year : this._current.year,   
            day : this._current.day,
            options : {
                currentYearOnly : true,
                filter_query : false,
                // force_query : true,
            },
        }

        console.log('query_options', query_options);

        // query data from cube
        this.cube().query(query_options, function (err, query_results) {
            if (err) return console.error(err, query_results);

            // mark done fetching
            this._fetching = false;

            // parse
            var fractions = M.parse(query_results);

            console.log('fractions', fractions);

            // parse dates
            var cache = this._parseDates(fractions);

            console.log('fractions --> cache', cache);

            if (!cache || !_.isArray(cache) || !_.size(cache)) return;

            // set cache
            this.cache().mask(cache);

            // set line graph
            this._setLineGraph();

        }.bind(this));

    },

    // // get/set cache
    // cache : function (cache, year) {
    //     var year = year || this._current.year;
    //     if (cache) {
    //         this._cache.masks[this._mask.id] = this._cache.masks[this._mask.id] || {};
    //         this._cache.masks[this._mask.id][year] = cache;
    //     } else {     
    //         if (!this._cache || !this._cache.masks || !this._cache.masks[this._mask.id] || !this._cache.masks[this._mask.id][year]) return false;   
    //         return this._cache.masks[this._mask.id][year];
    //     }
    // },

    // todo: clean up this shiait
    cache : function () {
        return {
            data : function (data) {
                if (data) {
                    this._cache.data[this._mask.id] = this._cache.data[this._mask.id] || {};
                    this._cache.data[this._mask.id] = data;
                } else {
                    if (!this._cache || !this._cache.data || !this._cache.data[this._mask.id]) return false;   
                    return this._cache.data[this._mask.id];
                }
            }.bind(this),
           
            mask : function (cache, year) {
                var year = year || this._current.year;
                if (cache) {
                    this._cache.masks[this._mask.id] = this._cache.masks[this._mask.id] || {};
                    this._cache.masks[this._mask.id][year] = cache;
                } else {     
                    if (!this._cache || !this._cache.masks || !this._cache.masks[this._mask.id] || !this._cache.masks[this._mask.id][year]) return false;   
                    return this._cache.masks[this._mask.id][year];
                }
            }.bind(this),
        }
    },

    _setLimit : function (limit) {

        // set locally
        this._limit = limit;

        // set limits for slider
        // this._animator.setSliderLimit({
        //     limit : limit
        // });

    },

    _parseDates : function (cache) {
        if (!_.isArray(cache)) return;
        cache.forEach(function (c) {
            c.date = moment.utc(c.date);
        });
        return cache;
    },

    _checkEnds : function () {

        // get cached line graph data
        var cache = this.cache().mask();

        // filter out period
        var today = moment.utc().year(this._current.year).dayOfYear(this._current.day + 1);
        var period = _.find(cache, function (d) {
            return d.date.isSame(today, 'day');
        });

        // shade buttons if end of dataset
        if (period) {

            // unshade slider buttons
            this._unshadeButtons();

        } else {

            // shade slider buttons
            this._shadeButtons();
        }

        // update titles
        this._updateTitles();

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



