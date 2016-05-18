Wu.Animator = Wu.Evented.extend({

    options : {

        // Animation frames per second
        fps : 2,

        // Max value for steps on slider
        maxLength : 365,

        // Defines what kind of graph we want
        graphType : 'annualCycles',

        // how often to register updates when sliding
        sliderThrottle : 500

    },

    _initialize : function (options) {

        // listen to local events
        this.listen();

        // fetching data is async, so must wait for callback
        this._fetchData(this._renderData.bind(this));

        // todo: fetching data should query raster itself. in other words, must be connected to cube layer directly, 
        // and fetch data thru it.

    },

    listen : function () {
        Wu.Mixin.Events.on('shadeButtons', this._onShadeButtons, this);
        Wu.Mixin.Events.on('unshadeButtons', this._onUnshadeButtons, this);
    },

    _onShadeButtons : function () {
        // this.tapBackward.style.color = '#292929';
        this.tapForward.style.color = '#292929';
    },

    _onUnshadeButtons : function () {
        // this.tapBackward.style.color = '#FCFCFC';
        this.tapForward.style.color = '#FCFCFC';
    },

    // fetch data from server
    _fetchData : function (done) { // todo: query raster instead

        // get data from server
        app.api.getCustomData({
            name : this.options.data
        }, done);

    },

    // Callback for when data is ready
    _renderData : function (err, data) {
        if (err) return console.error(err);

        // set data
        this._data = Wu.parse(data);

        // create slider
        this._createSlider();

        // add hooks
        this._addHooks();       

        // create graph
        this._createGraph();
     
        // mark inited
        this._inited = true;
    },

    // Set Frames Per Second
    setFPS : function (fps) {

        // set locally
        this.options.fps = fps;

        // propagate
        Wu.Mixin.Events.fire('setFPS', {detail : {
            fps : fps
        }});
    },  

    _createSlider : function () {

        // create divs
        this.sliderOuterContainer       = Wu.DomUtil.create('div', 'big-slider-outer-container', app._appPane);
        var sliderInnerContainer        = Wu.DomUtil.create('div', 'big-slider-inner-container', this.sliderOuterContainer);
        var slider                      = Wu.DomUtil.create('div', 'big-slider', sliderInnerContainer);
        this.sliderButtonsContainer     = Wu.DomUtil.create('div', 'big-slider-button-container', sliderInnerContainer);
        this.stepBackward               = Wu.DomUtil.create('div', 'big-slider-step-backward', this.sliderButtonsContainer, '<i class="fa fa-fast-backward"></i>');
        this.tapBackward                = Wu.DomUtil.create('div', 'big-slider-tap-backward', this.sliderButtonsContainer, '<i class="fa fa-step-backward"></i>');
        this.playButton                 = Wu.DomUtil.create('div', 'big-slider-play-button', this.sliderButtonsContainer, '<i class="fa fa-play"></i>');        
        this.tapForward                 = Wu.DomUtil.create('div', 'big-slider-tap-forward', this.sliderButtonsContainer, '<i class="fa fa-step-forward"></i>');
        this.stepForward                = Wu.DomUtil.create('div', 'big-slider-step-forward', this.sliderButtonsContainer, '<i class="fa fa-fast-forward"></i>');
        this.tickContainer              = Wu.DomUtil.create('div', 'big-slider-tick-container', sliderInnerContainer);

        // Set number of slider steps
        var dataLength = (_.size(this._data) > this.options.maxLength) ? this.options.maxLength : _.size(this._data);

        // create slider
        this.slider = noUiSlider.create(slider, {
            start: [this._sliderValue],
            range: {
                'min': 1,
                'max': dataLength
            },
            step : 1
        });

        // hide by default if option set
        if (this.options.hide) this.hide();

        // debug: hide play buttons
        this.playButton.style.display = 'none';
        this.stepBackward.style.display = 'none';
        this.stepForward.style.display = 'none';

    },

    _createGraph : function () { // todo: should separate these more

        // create graph
        // this.graph = new Wu.Graph.Year({
        this.graph = new Wu.Graph.Annual({ // todo: clean the f up
            data     : this._data,
            appendTo : this.sliderOuterContainer,
            type     : this.options.graphType,
            cube     : this.options.cube
        });
    },


    _addHooks : function () {

        // dom events
        Wu.DomEvent.on(this.stepBackward, 'click', this.moveBackward, this);
        Wu.DomEvent.on(this.tapBackward,  'click', this.stepOneBackward, this);
        Wu.DomEvent.on(this.stepForward,  'click', this.moveForward, this);
        Wu.DomEvent.on(this.tapForward,   'click', this.stepOneForward, this);
        Wu.DomEvent.on(this.playButton,   'click', this.play, this);

        // slider events
        this.slider.on('update', this._sliderUpdateEvent.bind(this));
        this.slider.on('set', this._sliderSetEvent.bind(this));

        // listen for events
        Wu.Mixin.Events.on('setSlider', this.setSlider, this);
        Wu.Mixin.Events.on('updateSliderButtons', this.updateButtons, this);
    },




    // @ only update graph
    // event that runs when sliding (ie. a lot!)
    // see http://refreshless.com/nouislider/events-callbacks/
    _sliderUpdateEvent : function (value) {
        console.log('_sliderUpdateEvent', value);
        if (!this._inited) return;

        console.log('ok');

        // set slider value
        this._sliderValue = value ? Math.round(value) : 0;

        // fire slider update event (for graph)
        Wu.Mixin.Events.fire('sliderUpdate', { detail : {
            value : this._sliderValue,
        }});
    },

    // @ event: update layers
    // event that runs when new value is set (either after slide, or with .set())
    _sliderSetEvent : function (value, handle, unencoded, tap) {
        if (!this._inited) return;

        // set slider value
        this._sliderValue = value ? Math.round(value) : 0;

        // get current date
        var timestamp = this._getCurrentDate();

        // add delay if tap (to )
        setTimeout(function () {

             // fire slider set event
            Wu.Mixin.Events.fire('sliderSet', { detail : {
                value : this._sliderValue,
                timestamp : timestamp
            }});

        }.bind(this), tap ? 300 : 0);
       
    },

    // todo: slider should know which date it is without asking graph
    _getCurrentDate : function () {
    	var date = this.graph.getCurrentDate(this._sliderValue);
    	return date;
    },

    // Enable layer
    _layerEnabled : function (e) {

    	// get event payload
        var layer = e.detail.layer;
        var show = e.detail.showSlider;

        // set current layer
        this._currentLayer = layer;

        // set title 
        this.setTitle(layer.getTitle());

        // show
        if (show) this.show();
    },

    // Disable layer
    _layerDisabled : function (e) {
        var layer = e.detail.layer;

        // hide if current layer
        if (layer.getUuid() == this._currentLayer.getUuid()) {
                this.hide();
        }
    },

    // Set slider value
    setSlider : function (e) {

        // get/set value
        var value = (e && e.detail) ? e.detail.value : e;
        this._sliderValue = value;

        // set slider
        this.slider.set(this._sliderValue);
    },

    updateButtons : function (e) {

        var disableForward  = e.detail.diableForward;
        var disableBackward = e.detail.diableBackward

        if (disableForward) { 
            Wu.DomUtil.addClass(this.stepForward, 'disable-button');
        } else { 
            Wu.DomUtil.removeClass(this.stepForward, 'disable-button'); 
        }

        if (disableBackward) { 
            Wu.DomUtil.addClass(this.stepBackward, 'disable-button');
        } else { 
            Wu.DomUtil.removeClass(this.stepBackward, 'disable-button'); 
        }
    },

    // Set title
    setTitle : function (title) {

    	// return if no layer
        if (!this._currentLayer) return;

        // fire event
        Wu.Mixin.Events.fire('setSliderTitle', {detail : {
            title : title
        }});
    },

    // These are the actions for the play, pause, step forward and backward buttons
    play : function () {        
        this.playing ? this.stopPlaying() : this.startPlaying();
    },

    startPlaying : function () {

        // set pause icon
        this.playButton.innerHTML = '<i class="fa fa-pause"></i>';

        // mark as playing
        this.playing = true;

        // move frame @ fps
        this.playInterval = setInterval(function() {

            // check if last day of year
            if (this._sliderValue == 365) {     // todo: move to next year...?

                // stop playing
                return clearInterval(this.playInterval);

            } else {                

                // move cursor forward
                this.stepOneForward();
            }           

        }.bind(this), (1000/this.options.fps)) 

        // fire animation play
        Wu.Mixin.Events.fire('animationPlay');
    },

    stopPlaying : function () {

        // set play icon
        this.playButton.innerHTML = '<i class="fa fa-play"></i>';

        // stop playing
        clearInterval(this.playInterval);
        this.playing = false;

        // fire animation stop
        Wu.Mixin.Events.fire('animationStop');
    },

    stepOneForward : function () {      
        var value = this._sliderValue + 1;

        if ( value > this.options.maxLength ) {
                this.stepAfterEnd()
                value = 1;

        }

        this.slider.set(value);

    },

    stepOneBackward : function () {
        var value = this._sliderValue - 1;
        
        if ( value <= 0 ) {
                this.stepBeforeBeginning();
                value = this.options.maxLength;
        }

        this.slider.set(value);

    },

    stepBeforeBeginning : function () {
        Wu.Mixin.Events.fire('stepBeforeBeginning');
    },

    stepAfterEnd : function () {
        Wu.Mixin.Events.fire('stepAfterEnd');
    },    

    moveBackward : function () {
        Wu.Mixin.Events.fire('sliderMoveBackward');
    },

    moveForward : function () {
        Wu.Mixin.Events.fire('sliderMoveForward');
    },  

    // Update message box, if it exists before
    update : function (message, severity) {},

    remove : function (id) {},

    hide : function () {
        this.sliderOuterContainer.style.display = 'none';
    },

    show : function () {
        if (!this._inited) return;
        this.sliderOuterContainer.style.display = 'block';
    },  

});

