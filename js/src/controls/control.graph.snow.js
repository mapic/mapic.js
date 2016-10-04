    

// --------------------------------------------
// THIS IS A CUSTOM PLUGIN CREATED FOR GLOBESAR 
// --------------------------------------------
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
//  + 

// events
// ------
//  - since object survives changing projects, the events must be silenced.

moment().utc();

// created by cube layer
// Annual Graph (cyclical)
Wu.Graph.SnowCoverFraction = Wu.Graph.extend({

    options : {
        fetchLineGraph : false, // debug, until refactored fetching line graph to cube
        editorOptions : {
            mask : true,
            avg : true
        },
        colors : [
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

        // plug animator
        this._plugAnimator();

    },

    parse : function (data, done) {

        console.log('this', this);

        // add current year (need to fetch from server)
        // 1. refactor cube.query to standalone
        // 2. set 2016 here
        // 3. fetch all line graph data from this parsed

        this.query_yearly('2016', function (err, queried_data) {
            if (err) console.error('query err', err);

            var parsed = {
                mma : this.average(data),
            }


            queried_data.forEach(function (q) {
                var item = {
                    scf : q.scf,
                    year : q.date.year(),
                    doy : q.date.dayOfYear()
                }
                data.push(item);
            });

            parsed.years = this.yearly(data);

            // return 
            done && done(null, parsed);

        }.bind(this));

        // return parsed;
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
            var fractions = Wu.parse(query_results);

            // parse dates
            var parsed_data = this._parseDates(fractions);

            done && done(null, parsed_data);
        
        }.bind(this));

    },


    yearly : function (data) {
        var range = this.getRange();
        // var years = _.range(range[0], this._range.datasets[1]+1); // hacky: takes first from data, last from dataset
        var years = _.range(range[0], range[1]+1); // hacky: takes first from data, last from dataset
        var yearly_data = [];

        _.times(365, function (i) {
            var doy = i+1;

            var item = {
                scf : {}, 
                date : moment.utc().year(2016).dayOfYear(doy) // fake year, correct doy
            }

            years.forEach(function (y) {
                var scf = _.find(data, function (d) {   // expensive op! todo: cut into years first
                    return d.year == y && d.doy == doy;
                });
                item.scf[y] = scf ? scf.scf : false;
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
            var max = _.max(today, function (d) {
                return d.scf;
            }).scf;

            // get this day's min
            var min = _.min(today, function (d) {
                return d.scf;
            }).scf;

            // get this day's avg
            var sum = 0;
            _.times(today.length, function (i) {
                sum += parseFloat(today[i].scf);
            });
            var avg = sum/today.length;
         
            // add to array
            average.push({
                doy   : doy,
                max  : parseFloat(max),
                min  : parseFloat(min),
                avg  : avg, 
                date : moment.utc().year(this._current.year).dayOfYear(doy), // year doesn't matter, as it's avg for all years
                                                                             // however: need to add a YEAR/DATE when adding to graph, 
                                                                             // due to graph needing a date to know it should display data
            });

        }.bind(this));

        return average;
    },


    setData : function (data, done) {

        // console.error('setData', data);



        // data is all data for mask
        // should define range already here,
        // as well as parse data

        // set timeframe
        // timeframe is for raster layers
        this._setTimeFrame();

        // parse
        this.parse(data, function (err, parsed) {

            this._parsed[this._mask.id] = parsed;

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

        // set animator
        this._animator = this.options.animator;

        // connect graph
        this._animator.plugGraph(this); // todo: create event for this

        // listen for animator events
        this._animator.on('update', this.onUpdateTimeframe.bind(this));
    },

    _listen : function () {

        // layer events 
        // (todo: rename options.cube to this._layer for more generic flow)
        this.options.cube.on('maskSelected', this.onMaskSelected.bind(this));
        this.options.cube.on('maskUnselected', this.onMaskUnselected.bind(this));
    },

    _initContainer : function () {
        if (this._container) return;

        this._container              = Wu.DomUtil.create('div', 'big-graph-outer-container',            this.options.appendTo);
        this._infoContainer          = Wu.DomUtil.create('div', 'big-graph-info-container',             this._container);
        
        this._pluginMainContainer    = Wu.DomUtil.create('div', 'big-graph-plugin-container',           this._container);
        this._pluginContainer        = Wu.DomUtil.create('div', 'big-graph-plugin-main-container',      this._pluginMainContainer);
        this._pluginLegendsContainer = Wu.DomUtil.create('div', 'big-graph-plugin-legends-container',   this._pluginMainContainer);
        this._pluginLegendsHeader    = Wu.DomUtil.create('div', 'graph-legend',                         this._pluginLegendsContainer);
        this._legendContainer        = Wu.DomUtil.create('div', 'graph-legend',                         this._pluginLegendsContainer);
               
        this._nameTitle              = Wu.DomUtil.create('div', 'big-graph-title',                      this._infoContainer, 'title');
        this._maskTitle              = Wu.DomUtil.create('div', 'big-graph-mask-title',                 this._infoContainer, 'title');
        this._maskDescription        = Wu.DomUtil.create('div', 'big-graph-mask-description',           this._infoContainer, 'title');
        this._dateTitle              = Wu.DomUtil.create('div', 'big-graph-current-day',                this._infoContainer, 'day');
        this._graphContainer         = Wu.DomUtil.create('div', 'big-graph-inner-container',            this._container);
        this._loadingBar             = Wu.DomUtil.create('div', 'graph-loading-bar',                    this._container);
        

        // add editor items
        if (this.isEditor()) this._addEditorPane();

        // add yearly graph
        // this._createAverageDataPane();

    },

    _addEditorPane : function () {

        // container
        this._editorPane = Wu.DomUtil.create('div', 'big-graph-editor-pane');

        // insert above outer container
        this.options.appendTo.insertBefore(this._editorPane, this.options.appendTo.firstChild);

        // title
        this._editorPaneTitle = Wu.DomUtil.create('div', 'big-graph-editor-pane-title', this._editorPane, 'Layer options');

        // mask filter
        this._filterPane = Wu.DomUtil.create('div', 'big-graph-editor-filter-pane', this._editorPane);

        // mask filter
        if (this.options.editorOptions.mask) {        
            var checkbox = this._createFilterCheckbox({
                appendTo : this._filterPane
            });
        }

        // // average data switch
        // if (this.options.editorOptions.avg) {        
        //     var checkbox_avgdata = this._createAverageDataCheckbox({
        //         appendTo : this._filterPane
        //     });
        // }
    },


    _createFilterCheckbox : function (options) {

        // create checkbox
        var checkbox = Wu.DomUtil.create('div', 'checkbox');
        var input = Wu.DomUtil.create('input', '', checkbox);
        input.setAttribute('type', 'checkbox');
        input.id = 'checkbox-' + Wu.Util.getRandomChars(5);
        
        // create label
        var label = Wu.DomUtil.create('label', '', checkbox);
        label.setAttribute('for', input.id);
        label.innerHTML = 'Only show data within mask.';

        // mark checked if active
        if (this.cube().getFilterMask()) {
            input.setAttribute('checked', '');
        }

        // check event
        Wu.DomEvent.on(checkbox, 'mouseup', function (e) {

            // toggle
            this.cube().setFilterMask(!this.cube().getFilterMask());

            // update cache
            this.cube()._updateCache();

        }.bind(this));

        // add to DOM
        options.appendTo.appendChild(checkbox);

        return checkbox;
    },


    // _createAverageDataCheckbox : function (options) {

    //     // create checkbox
    //     var checkbox = Wu.DomUtil.create('div', 'checkbox');
    //     var input = Wu.DomUtil.create('input', '', checkbox);
    //     input.setAttribute('type', 'checkbox');
    //     input.id = 'checkbox-' + Wu.Util.getRandomChars(5);
        
    //     // create label
    //     var label = Wu.DomUtil.create('label', '', checkbox);
    //     label.setAttribute('for', input.id);
    //     label.innerHTML = 'Enabled dropdown for yearly average data';

    //     // mark checked if active
    //     if (this.cube().getAverageDataOption()) {
    //         input.setAttribute('checked', '');
    //     }

    //     // check event
    //     Wu.DomEvent.on(checkbox, 'mouseup', function (e) {

    //         // toggle
    //         this.cube().setAverageDataOption(!this.cube().getAverageDataOption());

    //         // hide if not activated
    //         if (this.cube().getAverageDataOption()) {
    //             this._average_pane.container.style.display = 'block';
    //         } else {
    //             this._average_pane.container.style.display = 'none';
    //         }

    //     }.bind(this));

    //     // add to DOM
    //     options.appendTo.appendChild(checkbox);

    //     return checkbox;
    // },
   
    _createAverageDataPane : function () {
        if (this._average_pane) return;

        // range
        // var years = _.range(2000, 2017);
        var range = this.getRange();
        var years = _.range(range[0], range[1] + 1);

        // create pane
        var pane = this._average_pane = {};
        pane.container = Wu.DomUtil.create('div', 'average-data-pane-container', this._pluginContainer);

        // create title
        var title = Wu.DomUtil.create('div', 'average-data-pane-title', pane.container, 'Yearly graphs');

        // create select
        var btn_group = Wu.DomUtil.create('div', 'btn-group', pane.container);
        var btn = Wu.DomUtil.create('button', 'btn btn-default dropdown-toggle', btn_group, 'Select year(s)');
        btn.setAttribute('data-toggle', 'dropdown');
        var span = Wu.DomUtil.create('span', 'caret', btn);
        var ul = Wu.DomUtil.create('ul', 'dropdown-menu bullet pull-left pull-top', btn_group);

        // years
        years.forEach(function (y, i) {
            var li = Wu.DomUtil.create('li', '', ul);
            var input = Wu.DomUtil.create('input', '', li);
            input.id = 'years-dropdown-' + y;
            input.setAttribute('type', 'checkbox');
            input.setAttribute('name', y);
            input.setAttribute('value', y);
            var label = Wu.DomUtil.create('label', '', li, y);
            label.setAttribute('for', input.id);

            // event
            Wu.DomEvent.on(input, 'click', function (e) {
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

        // // hide if not activated
        // if (this.cube().getAverageDataOption()) {
        //     this._average_pane.container.style.display = 'block';
        // } else {
        //     this._average_pane.container.style.display = 'none';
        // }
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
        console.log('toggle', year, checked);

        // remember
        this._selectedYears[year] = checked;

        // set line graph to selected years
        this._setLineGraph();

        // set legend
        this._setLegends();
    },

    _setLegends : function () {
        var selectedYears = this.getSelectedYears();
        var range = this.getRange();
        var allYears = _.range(range[0], range[1] + 1);

        // create legends
        allYears.forEach(function (s, i) {

            // if should be active
            if (_.indexOf(selectedYears, s) >= 0) {

                var div = this._legendsDOM[s];

                if (div) {
                    // show if already created
                    Wu.DomUtil.removeClass(div, 'displayNone');
                } else {

                    // create legend
                    var legend = Wu.DomUtil.create('div', 'graph-legend-module', this._legendContainer);
                    var legend_color = Wu.DomUtil.create('div', 'graph-legend-color', legend);
                    var legend_text = Wu.DomUtil.create('div', 'graph-legend-text', legend, s);

                    // set color
                    legend_color.style.background = this.options.colors[i];

                    // rememeber
                    this._legendsDOM[s] = legend;
                }
            } else {

                // hide
                var div = this._legendsDOM[s];
                if (div) Wu.DomUtil.addClass(div, 'displayNone');
            }
        }.bind(this));
    },
 
    _legendsDOM : {},

    isEditor : function () {
        return app.activeProject.isEditor();
    },


    // should run only once! 
    // 
    _createGraph : function (data) {
        // if (!this._annualAverageData) return;

        // store crossfilters, dimensions, etc
        this.ndx = {};

        // AVERAGE CROSSFILTER
        // -------------------        
        // this._annualAverageData array = 
        // [{
        //     avg : 79.990875,
        //     date : Moment,
        //     max : 89.6246,
        //     min : 64.1556,
        //     no : 1,
        // }] // x 365

        // create average (background chart) crossfilter
        // this.ndx.average_crossfilter = crossfilter(this._annualAverageData); // this._annualAverageData is avgs for 365 days
        this.ndx.average_crossfilter = crossfilter(data.mma); // this._annualAverageData is avgs for 365 days

        // set dimensions (?)
        var average_dimension = this.ndx.average_crossfilter.dimension(function(d) { return d.date; });

        // create groups (?)
        var average_max_group = average_dimension.group().reduceSum(function(d) { return d.max });
        var average_min_group = average_dimension.group().reduceSum(function(d) { return d.min });
        var average_avg_group = average_dimension.group().reduceSum(function(d) { return d.avg });

        // get max/min date (?)
        var minDate = average_dimension.bottom(1)[0].date;  // this is jan 1 2015.. shouldn't be a YEAR per say, since it messes with the line graph (which needs to be in same year to display)
        var maxDate = average_dimension.top(1)[0].date;     

 


        // YEARLY LINE CROSSFILTER
        // -----------------------
        // line_data array = 
        // [{
        //     SCF : 77.6827,
        //     date : Thu Jan 01 2015 18:17:07 GMT+0100 (CET),
        // }] // x 365

        // create red line (this year's data) crossfilter
        this.ndx.line_crossfilter = crossfilter([]);

        // create line dimension
        var line_dimension = this.ndx.line_crossfilter.dimension(function(d) { return d.date; });

        // create line group
        var line_groups = [];
        // var range = _.range(2000, 2017); // todo: get range dynamically
        var range = this.getRange();
        var line_group_range = _.range(range[0], range[1] + 1);
        line_group_range.forEach(function (r) {
            line_groups.push(line_dimension.group().reduceSum(function(d) { return d.scf[r]; }));
        });

        // var line_group  = line_dimension.group().reduceSum(function(d) { return d.scf[2014]; });
        // var line_group2 = line_dimension.group().reduceSum(function(d) { return d.scf[2015]; });

        // create point group (for last red triangle)
        // var point_group = line_dimension.group().reduceSum(function(d) { return d.scf });



        // COMPOSITE CHART
        // ---------------

        // create composite chart @ container
        var composite = this._composite = dc.compositeChart(this._graphContainer)

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

        // colors, to always have same for same year
        var yearly_colors = this.options.colors;

        // add yearly lines to composite array
        line_groups.forEach(function (lg, i) {
            compose_charts.push(dc.lineChart(composite)
            .group(lg)
            .colors(yearly_colors[i])
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            .dotRadius(2)
            .renderDataPoints(false)
            .xyTipsOn(false))
        });

        // create composite graph
        composite
        .width(500).height(220)
        .dimension(average_dimension)
        .x(d3.time.scale().domain([minDate,maxDate]))
        .y(d3.scale.linear().domain([0, 100]))
        .clipPadding(10)    
        .elasticY(false)
        .elasticX(false)
        .on('renderlet', this._gridlines)
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

    },

    _onGridMousemove : function (e) {
        console.log('_onGridMousemove', e);
    },

    _gridlines : function (table) {
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
        if (!this._graphInited) return;

        // Clear old data
        this.ndx.line_crossfilter.remove();

        // // create line dimension
        // var line_dimension = this.ndx.line_crossfilter.dimension(function(d) { 
        //     return d.date; 
        // });

        // // create line group
        // var line_group = line_dimension.group().reduceSum(function(d) { return d.scf / 2; });


        // // create line dimension
        // var line_dimension = this.ndx.line_crossfilter.dimension(function(d) { 
        //     return d.date; 
        // });

        // // create line group
        // var line_group = line_dimension.group().reduceSum(function(d) { return d.scf / 2; });

        // need to have ALL line graph data for all years in cache
        // incl. old (from this._data) as well as current year (from query)
        // then, here - all data is removed, and then added for each active year...


        // get cached line graph data
        var cache = this.cache().mask();

        var parsed_cache = this._parsed[this._mask.id];

        // var cache = parsed_cache.years['2016'];

        // var all_scf_years = this.get_all_scf_years();

        var cache = this._filterSelectedYears(parsed_cache.years);

        // console.log('parsed cache: miles', parsed_cache);


        // var selectedYears = this.getSelectedYears();
        // console.log('UPDATING LINE --> selected years :', selectedYears);

        // filter out period
        // var today = moment().year(this._current.year).dayOfYear(this._current.day);
        // var today = moment().dayOfYear(this._current.day); // works without year also!

        // // filter out data
        // var period = _.filter(cache, function (d) { 
        //     return d.date.isBefore(today);
        // });
        // var period2 = _.filter(cache, function (d) {
        //     return d.date.isAfter(today);
        // });


        // var merged = parsed_cache.years['2016'].concat(parsed_cache.years['2015']);

        // add data to line_crossfilter
        // this.ndx.line_crossfilter.add(period);
        // this.ndx.line_crossfilter.add(merged);
        this.ndx.line_crossfilter.add(cache);


        // console.log('added period', period);
        // console.log('added merged', merged);
        // this.ndx.line_crossfilter.add(parsed_cache.years['2015']);

        // redraw
        console.time('redraw');
        dc.redrawAll();
        console.timeEnd('redraw');

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
        var year_container = Wu.DomUtil.create('div', 'graph-legend-header', this._pluginLegendsHeader, rangeText);
        var average_container = Wu.DomUtil.create('div', 'graph-legend-module', this._pluginLegendsHeader);
        var minmax_container = Wu.DomUtil.create('div', 'graph-legend-module', this._pluginLegendsHeader);
        var minmax_color = Wu.DomUtil.create('div', 'graph-legend-color', minmax_container);
        var average_color = Wu.DomUtil.create('div', 'graph-legend-color', average_container);
        this._legends.minmax_text = Wu.DomUtil.create('div', 'graph-legend-text', minmax_container);
        this._legends.average_text = Wu.DomUtil.create('div', 'graph-legend-text', average_container);

        // set values
        this._legends.minmax_text.innerHTML = 'Min/max';
        this._legends.average_text.innerHTML = 'Average';

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
        return {
            year : date.year(),
            day : date.dayOfYear()
        }
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
        this._range.data[this._mask.id] = this.setDataRange();

        // return if already set
        if (this._current && this._current.year && this._current.day) return; 

        // set current time to last day in dataset timeseries
        this._current = this.getDatasetsEndDate();

        // set range
        this._range.datasets = this.setDatasetRange();

        console.log('this._range', this._range);
    },

    _range : {
        datasets : [],
        data : {} // by mask
    },

    getRange : function () {
        var range = [this._range.data[this._mask.id][0], this._range.datasets[1]];
        return range;
    },

    setDatasetRange : function () {
        var datasets = this.cube().getDatasets();
        var last = _.last(datasets);
        var first = _.first(datasets);
        var firstYear = moment.utc(first.timestamp).year();
        var lastYear = moment.utc(last.timetamp).year();
        return [firstYear, lastYear];
    },

    setDataRange : function () {
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

        // set date range to graph
        this._composite.x(d3.time.scale().domain([minDate,maxDate]));

        // set slider
        this._animator.setSlider(day);

        // set cube cursor
        this.cube().setCursor(moment.utc().year(year).dayOfYear(day));

        // set slider
        this._animator.setSlider(day);

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
        var dateTitle = date.format('MMMM Do YYYY');
        var cache = this.cache().mask();
        var scf = _.find(cache, function (c) {
            return c.date.isSame(date, 'day');
        });
        var scfTitle = scf ? (Math.round(scf.scf * 10) / 10) + '%' : '';
        return dateTitle + ' &nbsp;&nbsp;&nbsp;   <span style="font-weight:900">SCF: ' + scfTitle + '</span>';
    },

    _getMaskTitle : function () {
        if (!this._mask) return;
        var d = this._mask.title;
        if (_.isString(d)) return d.camelize();
        return '';

    },

    _getMaskDescription : function () {
        if (!this._mask) return;
        var d = this._mask.description;
        if (_.isString(d)) return d.camelize();
        return '';
    },

    _updateTitles : function (options) {

        // set titles
        this._nameTitle.innerHTML = this._getTitle();
        this._maskTitle.innerHTML = this._getMaskTitle();
        this._maskDescription.innerHTML = this._getMaskDescription();
        this._dateTitle.innerHTML = this._getDateTitle();
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

        // query data from cube
        this.cube().query(query_options, function (err, query_results) {
            if (err) return console.error(err, query_results);

            // mark done fetching
            this._fetching = false;

            // parse
            var fractions = Wu.parse(query_results);

            // parse dates
            var cache = this._parseDates(fractions);

            if (!cache || !_.isArray(cache) || !_.size(cache)) return;

            // set cache
            this.cache().mask(cache);

            // set line graph
            this._setLineGraph();

        }.bind(this));

    },

    // get/set cache
    cache : function (cache, year) {
        var year = year || this._current.year;
        if (cache) {
            this._cache.masks[this._mask.id] = this._cache.masks[this._mask.id] || {};
            this._cache.masks[this._mask.id][year] = cache;
        } else {     
            if (!this._cache || !this._cache.masks || !this._cache.masks[this._mask.id] || !this._cache.masks[this._mask.id][year]) return false;   
            return this._cache.masks[this._mask.id][year];
        }
    },

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
        this._animator.setSliderLimit({
            limit : limit
        });

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
        Wu.Mixin.Events.fire('shadeButtons'); // refactor
    },

    _unshadeButtons : function () {
        Wu.Mixin.Events.fire('unshadeButtons');
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



