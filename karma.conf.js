module.exports = function (config) {
  config.set({

    frameworks: ['mocha', 'chai'],

    files: [
      'js/lib/d3.js/d3.js',

      // c3
      'js/lib/c3/c3.js',
      'js/lib/dc.js/crossfilter.js',
      'js/lib/dc.js/dc.js',

      // dependencies 
      'js/lib/codemirror/mode/cartocss/jquery-2.1.1.min.js',
      'js/lib/lodash/lodash-4.16.4.js',
      'js/lib/async/async.js',
      
      // leaflet + mapbox
      'js/lib/leaflet.js/leaflet-src.js',
      'js/lib/leaflet.js/plugins/leaflet.utfgrid.js',
      'js/lib/leaflet.js/plugins/leaflet-draw/leaflet.draw-src.js',
      'js/lib/leaflet.js/plugins/leaflet.label-src.js',

      // tools
      'js/lib/dropzone.js/dropzone.min.js',
      'js/lib/list.js/list.min.js',
      'js/lib/sortable.js/Sortable.js',
      'js/lib/html.sortable.js/html.sortable.js',

      // resumable
      'js/lib/resumable/resumable.js',

      // codemirror
      'js/lib/codemirror/mode/cartocss/cartoref.js',
      'js/lib/codemirror/lib/codemirror.js',
      'js/lib/codemirror/mode/cartocss/runmode.js',
      'js/lib/codemirror/mode/cartocss/searchcursor.js',
      'js/lib/codemirror/mode/cartocss/codemirror.carto.js',
      'js/lib/codemirror/mode/cartocss/codemirror.carto.complete.js',
      'js/lib/codemirror/mode/cartocss/codemirror.search.js',
      'js/lib/codemirror/mode/cartocss/codemirror.palette.js',
      'js/lib/codemirror/mode/cartocss/sexagesimal.js',
      'js/lib/codemirror/mode/cartocss/spectrum.js',
      'js/lib/codemirror/mode/sql/sql.js',

      // extra
      'js/lib/opentip/opentip-native.js',
      'js/lib/jss.js/jss.js',  
      'js/lib/keymaster/keymaster.js', 
      'js/lib/moment.js/moment.min.js',
      'js/lib/sniffer/sniffer.module.js',
      'js/lib/cryptojs/sha3.js',
      'js/lib/nouislider/nouislider.js',
      'js/lib/jscookie/js.cookie.js',
      'js/lib/pikaday/pikaday.js',
      'js/lib/infinite/infinite.js',
      'js/lib/topojson/topojson.v1.min.js',
      'js/lib/chartist.js/chartist.js',
      'js/lib/turf.js/turf.min.js',
      'js/lib/forge/forge.bundle.js',
      'js/lib/tether/tether.js',
      'js/lib/tether/select.js',
      'js/lib/randomColor/randomColor.js',


      // Class 
      'js/src/core/class.js',
      'js/src/core/api.js',

      // socket.io
      'js/src/core/api.socket.js',

      // controller
      'js/src/core/controller.js',

      'js/src/core/data.js',
      'js/src/core/evented.js',
      'js/src/ext/resumable.js',
      'js/src/ext/phantom.js',
      'js/src/ext/d3list.js',
      
      // Panes
      'js/src/panes/pane.js',
      'js/src/panes/pane.progress.js',
      'js/src/panes/pane.map.js',
      'js/src/panes/pane.status.js',
      'js/src/panes/pane.start.js',
      'js/src/panes/pane.feedback.js',
      'js/src/panes/pane.share.js',
      'js/src/panes/pane.mapsettings.js',
      'js/src/panes/pane.fullscreen.js',
      'js/src/panes/pane.login.js',
      'js/src/panes/pane.account.js',
      'js/src/panes/pane.guide.js',

      // chrome
      'js/src/chrome/chrome.js',   
      'js/src/chrome/chrome.top.js',   
      'js/src/chrome/chrome.bottom.js',                        
      'js/src/chrome/chrome.left.js',  
      'js/src/chrome/chrome.right.js', 

      'js/src/chrome/data/chrome.data.js',

      'js/src/chrome/projects/chrome.projects.js',
      'js/src/chrome/users/chrome.users.js',
      'js/src/chrome/settings/chrome.settings.js',
      'js/src/chrome/settings/chrome.settings.filters.js',
      'js/src/chrome/settings/chrome.settings.cartocss.js',
      'js/src/chrome/settings/chrome.settings.tooltip.js',
      'js/src/chrome/settings/chrome.settings.settingsselector.js',
      'js/src/chrome/settings/chrome.settings.styler.js',
      'js/src/chrome/settings/styler.js',
      'js/src/chrome/settings/styler.polygon.js',
      'js/src/chrome/settings/styler.point.js',
      'js/src/chrome/settings/styler.line.js',
      'js/src/chrome/settings/styler.legend.js',
      'js/src/chrome/settings/styler.raster.js',
      'js/src/chrome/settings/chrome.settings.layers.js',
      'js/src/chrome/settings/chrome.settings.extras.js',


      // Controls 
      'js/src/controls/control.js',
      'js/src/controls/control.zoom.js',
      'js/src/controls/control.geojson.draw.js',
      'js/src/controls/control.draw.js',
      'js/src/controls/control.zindex.js',
      'js/src/controls/control.measure.js',
      'js/src/controls/control.geolocation.js',
      'js/src/controls/control.layermenu.js',
      'js/src/controls/control.description.js',
      'js/src/controls/control.mouseposition.js',
      'js/src/controls/control.baselayertoggle.js',
      'js/src/controls/control.style.js',
      'js/src/controls/control.tooltip.js',                
      'js/src/controls/control.spinningmap.js',
      'js/src/controls/control.graph.js',
      'js/src/controls/control.graph.snow.js',
      'js/src/controls/control.animator.js',
      'js/src/ext/popup.chart.js',
      'js/src/controls/control.chart.js',
      'js/src/controls/control.wms.js',
      

      // Models 
      'js/src/models/model.js',
      'js/src/models/model.project.js',
      'js/src/models/model.user.js',
      'js/src/models/model.layer.js',
      'js/src/models/model.layer.cube.js',
      'js/src/models/model.layer.vector.js',
      'js/src/models/model.layer.raster.js',
      'js/src/models/model.layer.providers.js',
      'js/src/models/model.layer.topojson.js',
      'js/src/models/model.layer.geojson.js',
      'js/src/models/model.layer.wms.js',
      'js/src/models/model.file.js',

      // Analytics
      'js/src/ext/analytics.js',

      // Satellite angle
      'js/src/ext/satelliteAngle.js',  

      // Buttons
      'js/src/ext/buttons.js',

      // Buttons
      'js/src/ext/dropdown.js',

      // Language file
      'js/src/lang/language.english.js',

      // Extend Leaflet
      'js/src/ext/extendLeaflet.js',
      
      // Momory
      'js/src/tests/memory.js',
      
      // App 
      'js/src/core/app.js',

      'test/config.mock.js',

      'test/**/*.spec.js'

    ],

    port: 9876,
    
    colors: true,

    reporters: ['mocha'],

    singleRun : true,

    browsers: ['PhantomJS'],

    plugins : ['karma-mocha', 'karma-chai', 'karma-jasmine', 'karma-phantomjs-launcher']

  });
  
};
