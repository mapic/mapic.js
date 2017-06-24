// app.MapPane.baselayerToggle
L.Control.Sentinel = Wu.Control.extend({

    type : 'sentinel',

    options: {
        collapsed: true,
        position: 'topleft',
        autoZIndex: true
    },

    onAdd: function () {
        // create div
        var className = 'leaflet-control-sentinel';
        var container = this._container = L.DomUtil.create('div', className);
        return container;
    },

    _addHooks : function () {
        // add events
        Wu.DomEvent.on(this._container, 'click', this.toggle, this);
        Wu.DomEvent.on(this._container, 'dblclick', Wu.DomEvent.stop, this);

        // add stops
        Wu.DomEvent.on(this._container, 'mousedown dblclick mouseup click', Wu.DomEvent.stopPropagation, this);
    },

    addTo: function (map) {

        console.log('sentinel addTo');

        this._map = map;

        var container = this._container = this.onAdd(map),
            pos = this.getPosition(),
            corner = map._controlCorners[pos];

        L.DomUtil.addClass(container, 'leaflet-control leaflet-control-sentinel');

        // add to dom
        corner.appendChild(container);

        container.innerHTML = '<i class="fa fa-globe" aria-hidden="true"></i>';

        return this;
    },

    _on : function () {
        console.log('sentinel _on');
        this._show();
    },
    _off : function () {
        console.log('sentinel _off');
        this._hide();
    },
    _show : function () {
        this._container.style.display = 'block';
        if (this._sentinelLayer) this._sentinelLayer.addTo(this._map);
        this._refresh();
    },
    _hide : function () {
        this._container.style.display = 'none';
        if (this._sentinelLayer) this._sentinelLayer.remove();
    },

    _addTo : function () {
        this.addTo(app._map);
        this._addHooks();
        this._added = true;
    },

    _refresh : function () {
        if (!this._added) this._addTo();

        // get control active setting from project
        var active = this._project.getControls()[this.type];
        
        // if not active in project, hide
        if (!active) return this._hide();

        // remove old content
        this._flush();

        // init content
        this._initContent();

    },

    _flush : function () {
    },

    _initContent : function () {
    },

    toggle : function (e) {
        console.log('toggle e', e);
        this._isOpen ? this.collapse() : this.expand();
    },

    collapse : function () {
        console.log('close');
        this._isOpen = false;
        Wu.DomUtil.removeClass(this._container, 'open');
        if (this._sentinelInput) Wu.DomUtil.removeClass(this._sentinelInput, 'open');
        if (this._sentinelLayer) this._sentinelLayer.remove();
    },

    expand : function () {
        this._isOpen = true;
        Wu.DomUtil.addClass(this._container, 'open');

        console.log('open!');
        if (!this._sentinelLayer) this._addSentinelLayer();

        if (this._sentinelLayer) this._sentinelLayer.addTo(this._map);


        if (this._sentinelInput) Wu.DomUtil.addClass(this._sentinelInput, 'open');
    },

    _addSentinelLayer : function () {

        // settings
        var settings = {};
        settings.mapCenter = { lat: 40.4, lng: -3.730000000000018 };
        settings.defaultZoom = 12;
        settings.shMinZoom = 7;
        settings.shMaxZoom = 16;

        var map = this._map;

        // Sentinel Hub WMS service
        var baseUrl = 'https://services.sentinel-hub.com/v1/wms/2e10894a-1c69-84e9-48b9-c53ef763d872?SERVICE=WMS&REQUEST=GetMap&showLogo=false&LAYERS=NATURAL_COLOR__TRUE_COLOR_&FORMAT=image/jpeg'; 
        var url = baseUrl + '&TIME=2016-06-26/2016-06-29';
        
        // layer
        var sentinelHub = this._sentinelLayer = L.tileLayer.wms(url);
        var container = this._container;

        this._sentinelInput = L.DomUtil.create('input', 'date-picker', container);
        this._sentinelInput.setAttribute('placeholder', 'Date of Sentinel Data');

        L.DomEvent.on(this._sentinelInput, 'click', L.DomEvent.stop);

        // date picker
        var picker = new Pikaday({ 
            field: this._sentinelInput,
            onSelect: function(date) {
                
                // parse date
                var d = moment(date);
                var date_a = d.format("YYYY-MM-DD");
                
                // add one week in range
                var date_b = d.add(1, 'w').format("YYYY-MM-DD");
                
                // create url
                var url = baseUrl + '&TIME=' + date_a + '/' + date_b;
                
                // update url
                sentinelHub.setUrl(url);
            }
        });
// 
    },

});

L.control.sentinel = function (options) {
    return new L.Control.Sentinel(options);
};