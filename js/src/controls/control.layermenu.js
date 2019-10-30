// app.MapPane.layerMenu
L.Control.Layermenu = M.Control.extend({

	type : 'layermenu',

	options: {
		position : 'bottomright' 
		// position : 'bottomleft' 
	},

	onAdd : function (map) {

		// add html
		this._innerContainer = M.DomUtil.create('div', 'leaflet-control-layermenu');
		this._layermenuOuter = M.DomUtil.create('div', 'scroller-frame');
		this._innerScroller = M.DomUtil.create('div', 'inner-scroller', this._layermenuOuter);
		this._content = M.DomUtil.createId('div', 'layer-menu-inner-content', this._innerScroller);
		this._bottomContainer = M.DomUtil.create('div', 'layers-bottom-container', this._layermenuOuter);
		this._innerContainer.appendChild(this._layermenuOuter);

		// mark open
		this._isOpen = true;
		this.registerTopButton();

		// add some divsscroller-frame
		this.initLayout();

		// stops
		M.DomEvent.on(this._innerContainer, 'mouseup', M.DomEvent.stop, this);

		// nb! content is not ready yet, cause not added to map! 
		return this._innerContainer;

	},

	registerTopButton : function () {

		var top = app.Chrome.Top;

		// add a button to top chrome
		this._layerButton = top._registerButton({
		    name : 'layer',
		    className : 'chrome-button layer',
		    trigger : this.toggleLayerMenu,
		    context : this,
		    project_dependent : false
		});

		this._layerButton.innerHTML = '<i class="top-button systemapic-icons systemapic-icon-layers"></i> <span class="layer-button-text">Layers</div>';

	},

	toggleLayerMenu : function () {
		this._isOpen ? this.close() : this.open();
	},

	open : function  () {

		// fire event
		M.Mixin.Events.fire('_openLayerMenu'); 		

		// set classes
		M.DomUtil.removeClass(this._innerContainer, 'displayNone');
		M.DomUtil.removeClass(this._layerButton, 'rounded-layer-button');

		// mark open
		this._isOpen = true;

		// calc height
		this.calculateHeight();

		
		app.log('opened:layermenu');
	}, 

	close : function () {

		// mark closed
		this._isOpen = false;

		// set classes
		M.DomUtil.addClass(this._innerContainer, 'displayNone');
		M.DomUtil.addClass(this._layerButton, 'rounded-layer-button');

		// calc height
		this.calculateHeight();

		app.log('closed:layermenu');

	},

	_addTo : function () {
		this.addTo(app._map);
		this._addHooks();
		this._added = true;

		// shortcut
		app.Layermenu = this;
	},

	_flush : function () {
		this.layers = {};
		this._content.innerHTML = '';
	},

	_onLayerEdited : function (e) {

		var layer = e.detail.layer;
		this._refresh();
	},

	_refresh : function (hide) {

		// should be active
		if (!this._added) this._addTo();

		// if not active in project, hide
		if (!this._isActive()) return this._hide();

		// remove old content
		this._flush();

		// add new content		
		this._initContent();

		// show
		!hide && this._show();

		// close by default
		if (!this.editMode) this.closeAll();

		// open in editMode
		if (this.editMode) this._forceOpen();

		// enable layers that are active by default
		// this._enableDefaultLayers();

	},

	_forceOpen : function () {
		M.DomUtil.removeClass(this._parentWrapper, 'displayNone');
	},

	_enableDefaultLayers : function () {

		// get enabled layers
		var active = _.filter(this.layers, function (l) {
			if (!l) return false;
			if (!l.item) return false;
			return l.item.enabled;
		});

		// sort layers by z-index
		var sortedByZindex = _.sortBy(active, function (l) {
			return parseInt(l.item.zIndex);
		});

		// enable each layer
		sortedByZindex.forEach(this.enableLayer, this);

	},

	// refresh for names etc, but keep active layers
	_refreshContent : function (hide) {
		this._refresh(hide);
		this._addAlreadyActive();
	},

	_isActive : function () {
		if (!this._project) return false;
		return this._project.getControls()[this.type];
	},

	_on : function () {
		this._refresh();
		this._addAlreadyActive();
	},

	_off : function () {
		this._hide();

	},

	initLayout : function () {	

		// Create the header    
		this._layerMenuHeader = M.DomUtil.createId('div', 'layer-menu-header');
		
		// Create the 'uncollapse' button ... will put in DOM l8r
		this._openLayers = M.DomUtil.createId('div', 'open-layers');
		this._openLayers.innerHTML = 'Layers';
		M.DomUtil.addClass(this._openLayers, 'leaflet-control ol-collapsed');

		// Append to DOM
		app._map._controlCorners.bottomright.appendChild(this._openLayers);

		// Store when the pane is open/closed ~ so that the legends container width can be calculated
		this._open = true;

	},

	_addHooks : function () {
		M.DomEvent.on(this._container, 'mouseenter', function () {
			app._map.scrollWheelZoom.disable();
		}, this);

		M.DomEvent.on(this._container, 'mouseleave', function () {
			app._map.scrollWheelZoom.enable();
		}, this);


		M.Mixin.Events.on('toggleLeftChrome', this._toggleLeftChrome, this);

	},

	_initContent : function () {
		this._fill();
	},

	_fill : function () {

		// Get parent wrapper
		this._parentWrapper = this._container.parentNode;

		// return if empty layermenu
		if (!this._project.store.layermenu || this._project.store.layermenu.length == 0 ) {

			// Hide parent wrapper if empty
			M.DomUtil.addClass(this._parentWrapper, 'displayNone');			

			return;
		}		

		// Show parent wrapper if not empty
		M.DomUtil.removeClass(this._parentWrapper, 'displayNone');

		// iterate layermenu array and fill in to layermenu
		this._project.store.layermenu.forEach(function (item) {

			// get wu layer
			var layer = this._project.layers[item.layer];

			var layerItem = {
				item  : item,
				layer : layer
			};

			// add to layermenu
			this._add(layerItem);

		}, this);

	},

	_addAlreadyActive : function () {
		var active = app.MapPane.getActiveLayers();
		var enabled = _.filter(this.layers, function (item) {
			if (!item.layer) return false;
			var uuid = item.layer.getUuid();
			var ison = _.find(active, function (a) {
				return a.getUuid() == uuid;
			});
			return ison;
		});

		enabled.forEach(function (e) {
			this._enableLayer(e.layer.getUuid());
		}, this);	
	},

	_show : function () {
		this._container.style.display = 'block';
	},

	_hide : function () {
		this._container.style.display = 'none';
	},

	show : function () {
		if (!this._container) return;
		this._isActive() ? this._show() : this._hide();
	},

	hide : function () {
		if (!this._container) return;
		this._hide();
	},


	_getOpenItems : function () {
		var childNodes = this._content.childNodes;
		var open = _.filter(childNodes, function (c) {
			var closed = _.includes(c.classList, 'layeritem-closed');
			return !closed;
		});
		return open.length;
	},

	cancelEditClose : function () {
		if (!this.editMode) return;

		// cancel close initiated from sidepane layermeny mouseleave
		var timer = app.SidePane.Options.settings.layermenu.closeEditTimer;
		clearTimeout(timer);
		setTimeout(function () {  // bit hacky, but due to 300ms _close delay in sidepane
			var timer = app.SidePane.Options.settings.layermenu.closeEditTimer;
			clearTimeout(timer);
		}, 301);
	},

	timedEditClose : function () {
		if (!this.editMode) return;

		// close after three seconds after mouseleave
		var that = this;
		var timer = app.SidePane.Options.settings.layermenu.closeEditTimer = setTimeout(function () {
			that.disableEdit();
		}, 3000);
	},


	toggleLayerPane : function () {
		this._open ? this.closeLayerPane() : this.openLayerPane();
	},

	closeLayerPane : function () {
		this._open = false;
		M.DomUtil.addClass(this._innerContainer, 'closed');
	},

	openLayerPane : function () {
		this._open = true;
		M.DomUtil.removeClass(this._innerContainer, 'closed');
	},

	enableEditSwitch : function () {

		// Make container visible
		M.DomUtil.removeClass(this._parentWrapper, 'displayNone');		

		// open all items in layermenu
		this.openAll();	

		if ( !this._editSwitchContainer ) {
			
			this._editSwitchContainer = M.DomUtil.create('div', 'enable-edit-switch-container-outer', this._innerContainer);
			var editSwitchContainerInner = M.DomUtil.create('div', 'enable-edit-switch-container-inner', this._editSwitchContainer);
			var editSwitchTitle = M.DomUtil.create('div', 'enable-edit-switch-title', editSwitchContainerInner, 'Edit layer menu');

			this.editSwitch = new M.button({
				id 	  : 'editSwitch',
				type 	  : 'switch',
				isOn 	  : false,
				right 	  : true,
				appendTo  : editSwitchContainerInner,
				fn        : this._enableEditing.bind(this),
				className : 'edit-layers-switch'
			});

		} else {

			M.DomUtil.removeClass(this._editSwitchContainer, 'displayNone');

		}

		M.DomUtil.addClass(this._innerContainer, 'enable-edit-mode');


	},

	disableEditSwitch : function () {
		if (!this._editSwitchContainer) return;

		this._editSwitchContainer.innerHTML = '';
		M.DomUtil.remove(this._editSwitchContainer);
		this._editSwitchContainer = null;

		M.DomUtil.removeClass(this._innerContainer, 'enable-edit-mode');
		
		this.disableEdit();

		if (this._isEmpty()) {
			
			// Hide parent wrapper if empty
			M.DomUtil.addClass(this._parentWrapper, 'displayNone');
		}
	},


	_enableEditing : function (e, on) {
		on ? this.enableEdit() : this.disableEdit();
	},

	// enter edit mode of layermenu
	enableEdit : function () {
		if (this.editMode) return;

		// Make container visible
		M.DomUtil.removeClass(this._parentWrapper, 'displayNone');

		// set editMode
		this.editMode = true;

		// turn off dropzone dragging
		app.Data.disableUploader();

		// Set attribute draggable to true on all divs
		this.enableDraggable();
		
		// enable drag'n drop in layermenu
		this.enableSortable();

		// add edit style
		M.DomUtil.addClass(this._innerContainer, 'edit-mode');

		// add the drag'n drop new folder
		this._insertMenuFolder();

		// open all items in layermenu
		this.openAll();

		app.log('enabled_edit:layermenu');


	},

	_isEmpty : function () {
		return (!this._project.store.layermenu || this._project.store.layermenu.length == 0 );
	},

	// exit edit mode 
	disableEdit : function () {
		if (!this.editMode) return;

		if (this._isEmpty()) {
			
			// Hide parent wrapper if empty
			M.DomUtil.addClass(this._parentWrapper, 'displayNone');
		}		

		// set editMode
		this.editMode = false;
		
		// turn off dropzone dragging
		app.Data.enableUploader();

		// Set attribute draggable to true on all divs
		this.disableDraggable();		
		
		// disable layermenu sorting
		this.disableSortable();

		// remove edit style
		M.DomUtil.removeClass(this._innerContainer, 'edit-mode');

		// remove new drag'n drop folder
		this._removeMenuFolder();

		app.log('disabled_edit:layermenu');

	},
	

	_insertMenuFolder : function () {
		
		// add menu folder item
		if (!this._menuFolder) {

			// create if not exists
			this._menuFolder = M.DomUtil.create('div', 'smap-button-white middle-item', this._bottomContainer, 'Add folder');
			
			// add action
			M.DomEvent.on(this._menuFolder, 'click', this.addMenuFolder, this);

		} else {
			// show
			M.DomUtil.removeClass(this._menuFolder, 'displayNone');
			M.DomUtil.removeClass(this._editSwitchContainer, 'displayNone')
		}

		app.log('created_folder:layermenu');

	},

	_removeMenuFolder : function () {
		if (!this._menuFolder) return;
		M.DomUtil.addClass(this._menuFolder, 'displayNone');
	},

	enableSortable : function () {
		this.initSortable();
	},

	disableSortable : function () {
		if (this._sortingEnabled) this.resetSortable();
	},

	refreshSortable : function () {
		if (this._sortingEnabled) this.resetSortable();  
		this.initSortable();
	},

	initSortable : function () {

		if (!this._project.isEditor()) return;
		this._sortingEnabled = true;

		// iterate over all layers
		var items = document.getElementsByClassName('layer-menu-item-wrap');
		for (var i = 0; i < items.length; i++) {
			var el = items[i];

			// set dragstart event
			M.DomEvent.on(el, 'dragstart', this.drag.start, this);
		}

		// set hooks
		var bin = this._content;
		if (!bin) return;
		M.DomEvent.on(bin, 'dragover',  this.drag.over,  this);
		M.DomEvent.on(bin, 'dragleave', this.drag.leave, this);
		M.DomEvent.on(bin, 'drop', 	 this.drag.drop,  this);

	},

	resetSortable : function () {
		this._sortingEnabled = false;

		// remove hooks
		var bin = this._content;
		if (!bin) return;
		M.DomEvent.off(bin, 'dragover',  this.drag.over,  this);
		M.DomEvent.off(bin, 'dragleave', this.drag.leave, this);
		M.DomEvent.off(bin, 'drop', 	  this.drag.drop,  this);
	},

	enableDraggable : function () {

		// iterate over all layers
		var items = document.getElementsByClassName('layer-menu-item-wrap');
		for (var i = 0; i < items.length; i++) {
			var el = items[i];
			
			// set attrs
			el.setAttribute('draggable', true);
		}
	},

	disableDraggable : function () {
		
		// iterate over all layers
		var items = document.getElementsByClassName('layer-menu-item-wrap');
		for (var i = 0; i < items.length; i++) {
			var el = items[i];
			
			// set attrs
			el.setAttribute('draggable', false);
		}
	},
	
	// dragging of layers to layermenu
	drag : {

		start : function (e) {
			var el = e.target;

			// add visual feedback on dragged element
			M.DomUtil.addClass(el, 'dragged-ghost');

			var uuid = el.id;
			this.drag.currentDragElement = el;
			this.drag.currentDragUuid = uuid;
			this.drag.startDragLevel = this.layers[uuid].item.pos;
			
			e.dataTransfer.setData('uuid', uuid); // set *something* required otherwise doesn't work

			return false;
		},

		drop : function (e) {

			var uuid = e.dataTransfer.getData('uuid');
			var el = document.getElementById(uuid);

			console.log('drop: uuid, el', uuid, el);

			// remove visual feedback on dragged element
			M.DomUtil.removeClass(el, 'dragged-ghost');

			// get new position in layermenu array
			var nodeList = Array.prototype.slice.call(this._content.childNodes);
			
			var newIndex = nodeList.indexOf(el);
			var oldIndex = _.findIndex(this._project.store.layermenu, {uuid : uuid});
			
			// move in layermenu array
			this._project.store.layermenu.move(oldIndex, newIndex);

			// save
			this.save();

			// reset
			this.drag.currentDragElement = null;
			this.drag.currentDragLevel = null;
			this.movingX = false;

			return false; // irrelevant probably
		},

		over : function (e) {

			if (e.preventDefault) e.preventDefault(); // allows us to drop

			// set first offset
			if (!this.movingX) this.movingX = e.layerX;
			
			// calculate offset
			var offsetX = e.layerX - this.movingX;

			return false;
		},

		leave : function (e) {

			// get element over which we're hovering
			var x = e.clientX;
			var y = e.clientY;
			var target = document.elementFromPoint(x, y);
			var element = this.drag.currentDragElement;

			// return if not layerItem
			var type = target.getAttribute('type');
			if (type != 'layerItem') return;

			// move element
			this.drag.moveElementNextTo(element, target);

			return false;
		},

		moveElementNextTo : function (element, elementToMoveNextTo) {
			elementToMoveNextTo = elementToMoveNextTo.parentNode;
			if (this.isBelow(element, elementToMoveNextTo)) {
				// Insert element before to elementToMoveNextTo.
				elementToMoveNextTo.parentNode.insertBefore(element, elementToMoveNextTo);
			}
			else {
				// Insert element after to elementToMoveNextTo.
				elementToMoveNextTo.parentNode.insertBefore(element, elementToMoveNextTo.nextSibling);
			}

		},


		moveElementUp : function (element) {

			var nextSibling = element.nextSibling;
			var prevSibling = element.previousSibling;

			// check if on top
			if (!prevSibling) return console.log('already on top');

			// move
			element.parentNode.insertBefore(element, prevSibling);

			// save
			this.saveAfterMove(element);

		},

		moveElementDown : function (element) {

			var nextSibling = element.nextSibling;
			var prevSibling = element.previousSibling;

			// check if on bottom
			if (!nextSibling) return console.log('already on top');

			// move
			element.parentNode.insertBefore(element, nextSibling.nextSibling);

			// save
			this.saveAfterMove(element);
		},

		saveAfterMove : function (el) {

			var that = app.Layermenu;

			var uuid = el.getAttribute('id');

			// get new position in layermenu array
			var nodeList = Array.prototype.slice.call(that._content.childNodes);
			
			var newIndex = nodeList.indexOf(el);
			var oldIndex = _.findIndex(that._project.store.layermenu, {uuid : uuid});

			// move in layermenu array
			that._project.store.layermenu.move(oldIndex, newIndex);

			// save
			that.save();

		},

		isBelow : function (el1, el2) {
			var parent = el1.parentNode;
			if (el2.parentNode != parent) return false;
			var cur = el1.previousSibling;
			while (cur && cur.nodeType !== 9) {
				if (cur === el2) return true;
				cur = cur.previousSibling;
			}
			return false;
		}

	},

	_isFolder : function (item) {
		var layer = this.layers[item.uuid];
		if (layer.layer) return false;
		return true;
	},

	markInvalid : function (invalids) {
		invalids.forEach(function (invalid) {

			// get div
			var div = this.layers[invalid.uuid].el;
			M.DomUtil.addClass(div, 'invalidLayermenuitem');

		}, this)
	},

	clearInvalid : function () {
		for (var l in this.layers) {
			var layer = this.layers[l];
			M.DomUtil.removeClass(layer.el, 'invalidLayermenuitem');
		}
	},

	// check logic
	checkLogic : function () {

		// clear prev invalids
		this.clearInvalid();

		// vars
		var array = this._project.store.layermenu;
		var invalid = [];

		// iterate each layermenuitem
		array.forEach(function (item, i, arr) {

			// rule #1: first item must be at pos 0;
			if (i==0) {
				if (item.pos != 0) {
					return invalid.push(item); // must be 
				}
				return invalid;
			} 

			// rule #2: if item is folder, then it must be at same or lower level than previous (not higher)
			if (item.folder) {	
				var thislevel = item.pos;
				var prevlevel = arr[i-1].pos;
				if (thislevel > prevlevel) {
					return invalid.push(item);
				}
			}

			// rule #3: if item is deeper than previous, previous must be a folder
			var thislevel = parseInt(item.pos);
			var prevlevel = parseInt(arr[i-1].pos);
			if (thislevel > prevlevel) {
				if (!arr[i-1].folder) {
					return invalid.push(item);
				}
			}

			// rule #4: if item is deeper than previous, must not be more than one level difference
			if (parseInt(thislevel) > (parseInt(prevlevel + 1))) {
				return invalid.push(item);
			}

		}, this);

		// mark invalid items
		this.markInvalid(invalid);

		// return
		return invalid;

	},

	updateLogic : function () {

		// get vars
		var array = this._project.store.layermenu;
		this._logic = this._logic || {};

		// create logic from array
		array.forEach(function (item1, i) {
			// return if not a folder
			if (!this._isFolder(item1)) return;

			var pos 	= item1.pos; 	// eg 0 for first level
			var toClose 	= []; 		// all below this pos
			var toOpen 	= []; 		// all div's to be opened (all on one level below, not more)
			var ready 	= false;

			// fill toClose with all items until hits next item on same level (eg. 0)
			_.each(array, function(item2, i) {

				// hit self, start on next iteration
				if (item1.uuid == item2.uuid) ready = true; 
				
				if (ready) {

					if (parseInt(item2.pos) > parseInt(pos)) {
						var div = this.layers[item2.uuid].el;
						toClose.push(div);
					}

					// break iteration on condition
					if (parseInt(item2.pos) == parseInt(pos) && item1.uuid != item2.uuid) return false; 
				}

			}.bind(this));

			ready = false;
			
			// fill toOpen with all elements on +1 level
			_.each(array, function (item3, i) {

				if (ready) {

					if (parseInt(item3.pos) == parseInt(pos) + 1) {
						var div = this.layers[item3.uuid].el;
						toOpen.push(div);
					}
				
					if (parseInt(item3.pos) == parseInt(pos)) return false;
				}

				if (item1.uuid == item3.uuid) ready = true; // hit self, start on next iteration

			}.bind(this));


			// keep isOpen value
			if (this._logic[item1.uuid]) {
				var isOpen = this._logic[item1.uuid].isOpen || false;
			} else {
				var isOpen = true;
			}
			
			// save logic
			this._logic[item1.uuid] = {
				toOpen  : toOpen,   // div's to be closed (all below)
				toClose : toClose,  // div's to be opened (all on first level, but not further level folders and contents)
				isOpen  : isOpen
			}

		}, this);


	},

	enforceLogic : function (layerItem) {
		var uuid = layerItem.item.uuid;
		var item = this._logic[uuid];
		
		// close	
		if (item.isOpen) {
			var panes = item.toClose;

			// add classes
			panes.forEach(function (pane) {
				M.DomUtil.addClass(pane, 'layeritem-closed')
				M.DomUtil.removeClass(pane, 'layeritem-open');

				// mark closed folder as closed
				var id = pane.id;
				if (this._logic[id] && this._logic[id].isOpen) this._logic[id].isOpen = false;

			}, this);

			// mark closed
			this._logic[uuid].isOpen = false;

		// open
		} else {
			var panes = item.toOpen;

			// add classes
			panes.forEach(function (pane) {
				M.DomUtil.removeClass(pane, 'layeritem-closed');
				M.DomUtil.addClass(pane, 'layeritem-open');
			}, this);

			// mark open
			this._logic[uuid].isOpen = true;
		}
	},

	closeAll : function () {

		this.updateLogic();

		for (var l in this._logic) {
			var item = this.layers[l];
			if (item) {
				this._logic[l].isOpen = true;
				this.enforceLogic(item);
			}
		}
	},

	openAll : function () {
	
		this.updateLogic();
	
		for (var l in this._logic) {
			var item = this.layers[l];
			if (item) {
				this._logic[l].isOpen = false;
				this.enforceLogic(item);
			}
		}
	},

	// open/close subfolders
	toggleFolder : function (layerItem) {
		this.updateLogic();	
		this.enforceLogic(layerItem);
	},

	toggleLayer : function (item) {

		// don't toggle in edit mode
		if (this.editMode) return;

		// get layer
		var layer = item.layer;
		var layer_name = layer ? layer.getTitle() : 'Folder';

		// toggle
		if (item.on) {
			this.disableLayer(item);
			app.log('disabled_layer:layermenu', {info : {layer_name : layer_name}});

		} else {
			this.enableLayer(item);

			app.log('enabled_layer:layermenu', {info : {layer_name : layer_name}});


			// fire selected event, todo: necessary to fire both layerSelected and layerEnabled??
			// todo: refactor this, 
			// only thing this is necessary for, is to show correct layer in editor
			// in chrome/settings/chrome.settings.js
			M.Mixin.Events.fire('layerSelected', { detail : {
				layer : layer
			}}); 
		}

		// calc menu height
		this.calculateHeight();
	},

	_enableLayer : function (layerUuid) {

		// get layerItem
		var layerItem = _.find(this.layers, function (l) {
			return l.item.layer == layerUuid;
		});
		
		if (!layerItem) return console.error('no layer');
		
		// mark active
		M.DomUtil.addClass(layerItem.el, 'layer-active');
		layerItem.on = true;
	},
	
	_enableDefaultLayer : function (layer) {
		this.enableLayer(layer);
	},

	_enableLayerByUuid : function (layerUuid) {
		var item = this._getLayermenuItem(layerUuid);
		if (item) this.enableLayer(item);
	},

	enableLayer : function (layerItem) {

		var layer = layerItem.layer;

		// folder click
		if (!layer) return this.toggleFolder(layerItem); 
			
		// add layer to map
		layer.add(); // wu layer

		// mark on
		layerItem.on = true;

		// add active class
		M.DomUtil.addClass(layerItem.el, 'layer-active');

		// mark editing
		app.Chrome.Right.options.editingLayer = layer.getUuid();
	},

	// disable by layermenuItem
	disableLayer : function (layermenuItem) {

		var layer = layermenuItem.layer;
		if (!layer) return;	

		this._disableLayer(layer);	

		app.Chrome.Right.options.editingLayer = false;

	},

	// disable by layer
	_disableLayer : function (layer) {

		// get layermenuItem
		var layermenuItem = this._getLayermenuItem(layer.store.uuid);
		
		// remove layer
		layer.remove();
		layermenuItem.on = false;

		// remove active class
		M.DomUtil.removeClass(layermenuItem.el, 'layer-active');
	},


	_getLayermenuItem : function (layerUuid) {
		var layermenuItem = _.find(this.layers, function (l) { return l.item.layer == layerUuid; });
		return layermenuItem;
	},

	_getActiveLayers : function () {
		var active = _.filter(this.layers, function (layer) {
			return layer.on;
		});
		return active;
	},

	// layer deleted from project, remove layermenuitem
	onDelete : function (layer) {
		if (!layer) return console.error('No layer!');
		var uuid = layer.getUuid();
		var layermenuItem = this._getLayermenuItem(uuid);

		// remove from dom in layermenu
		if (layermenuItem) {
			var elem = layermenuItem.el;
			if (elem) elem.parentNode.removeChild(elem);
		}
	},

	// turn off a layer from options
	_removeItem : function (uuid) {				// todo: clean up layers vs layermenuitems, see _getLayermenuItem above
		
		// get layermenuItem
		var layermenuItem = this.layers[uuid];

		// remove from DOM
		var elem = layermenuItem.el;
		if (elem) elem.parentNode.removeChild(elem);

		// remove layer from map
		var layer = layermenuItem.layer;
		if (layer) layer.remove();

		// remove from store
		delete this.layers[uuid];

		// remove from layermenu
		_.remove(this._project.store.layermenu, function (item) { return item.uuid == uuid; });

		// save
		this.save();

		var layer_name = layer ? layer.getTitle() : 'Folder';

		app.log('removed_layer:layermenu', {info : {layer_name : layer_name}});


	},

	removeLayermenuItem : function () {
	},

	removeLayer : function (layerUuid) {
	},

	// remove initiated from sidepane
	_remove : function (uuid) {
		// find layermenuItem uuid
		var layermenuItem = this._getLayermenuItem(uuid); // uuid: layer-q2e321-qweeqw-dasdas
		this._removeItem(layermenuItem.item.uuid);
	},

	// add from sidepane
	add : function (layer) {
		
		// create db item
		var item = {
			uuid 	: 'layerMenuItem-' + M.Util.guid(), // layermenu item uuid
			layer   : layer.store.uuid, // layer uuid or _id
			caption : layer.store.title, // caption/title in layermenu
			pos     : 0, // position in menu
			zIndex  : 1,
			opacity : 1
		};

		var layerItem = {
			item  : item,
			layer : layer
		};

		// add
		var l = this._add(layerItem);

		// save
		this._project.store.layermenu.push(item); // refactor
		this.save();

		app.log('added_layer:layermenu', {info : {layer_name : layer.getName()}});


		// this._setHeight();

		return l;
	},

	_add : function (layerItem) {	

		var item  = layerItem.item;
		var layer = layerItem.layer;

		var caption = layer && layer.getTitle ? layer.getTitle() : item.caption;

		// create div
		var className  = 'layer-menu-item-wrap';

		// add if folder
		if (!layer) className += ' menufolder';
		
		// more classes
		className += ' level-' + item.pos;

		// add wrap
		var uuid = item.uuid;
		var wrap = M.DomUtil.create('div', className, this._content);
		wrap.id = uuid;

		// mark as draggable if we're in editing mode
		if (this.editMode) { 
			wrap.setAttribute('draggable', true) 
		} else { 
			wrap.setAttribute('draggable', false); 
		}		    


		// var layerItemMoversWrap = M.DomUtil.create('div', 'layer-item-movers-wrap', wrap);
		var up = M.DomUtil.create('div', 'layer-item-up', wrap);
		var down = M.DomUtil.create('div', 'layer-item-down', wrap);
		
		if (!layer) {
			// create delete button only on folder
			var del = M.DomUtil.create('div', 'layer-item-delete', wrap);
		}

		if (layer) {
			var layerItemFlyTo = M.DomUtil.createId('div', 'layer-flyto-' + layer.getUuid(), wrap);
		    	layerItemFlyTo.className = 'layer-menu-flyto';
		    	layerItemFlyTo.innerHTML = '<i class="fa fa-search fly-to"></i>';
		}


		// add vertical-movement triggers
		var v_up = M.DomUtil.create('div', 'layer-item-up vertical', wrap);
		var v_down = M.DomUtil.create('div', 'layer-item-down vertical', wrap);

		M.DomEvent.on(v_up,   'click', function (e) {   
			var parentEl = e.target.parentNode;
			this.drag.moveElementUp(parentEl);
		}, this);
		M.DomEvent.on(v_down,   'click', function (e) { 
			var parentEl = e.target.parentNode;
			this.drag.moveElementDown(parentEl);
		}, this);


		var inner = M.DomUtil.create('div', 'layer-menu-item', wrap);
		inner.setAttribute('type', 'layerItem');
		inner.innerHTML = caption;


		// add hooks
		M.DomEvent.on(up,   'click', function (e) { this.upFolder(uuid); 	  }, this);
		M.DomEvent.on(down, 'click', function (e) { this.downFolder(uuid); 	  }, this);


		if (!layer) { // folder
			M.DomEvent.on(inner, 'dblclick', function (e) { this._editFolderTitle(uuid); },this);
			M.DomEvent.on(del,  'click', function (e) { this.deleteMenuFolder(uuid); }, this);
			M.DomEvent.on(del,  'mousedown', M.DomEvent.stop, this);
		}

		// prevent layer activation
		M.DomEvent.on(up,   'mousedown', M.DomEvent.stop, this);
		M.DomEvent.on(down, 'mousedown', M.DomEvent.stop, this);

		// drag
		// set dragstart event
		M.DomEvent.on(wrap, 'dragstart', this.drag.start, this);
		
		// Stop Propagation
		M.DomEvent.on(this._container, 'touchstart mousedown click dblclick',  M.DomEvent.stopPropagation, this);

		// add elem to item object
		layerItem.el = wrap;

		// add hooks // pass item object to toggle
		M.DomEvent.on(wrap, 'mousedown', function (e) { this.toggleLayer(layerItem); }, this);
		M.DomEvent.on(this._innerContainer, 'dblclick', M.DomEvent.stop, this);

		// trigger on flyto on layer
		if (layer) {
			var flyto = M.DomUtil.get('layer-flyto-' + layer.getUuid());
			M.DomEvent.on(flyto, 'mousedown', function (e) {
				M.DomEvent.stop(e);
				app.log('flyto:layer', {info : {
					layer_name : layer.getName()
				}});
				layer.flyTo();
			}, this);
		}

		// add to local store
		this.layers[item.uuid] = layerItem;

		return layerItem;
	},

	getLayers : function () {
		return this.layers;
	},
	
	addMenuFolder : function () {
		this.addFolder();		// todo: remove
	},

	_addMenuFolder : function () {
		this._addFolder();		// todo: remove
	},

	addFolder : function () {

		var folder = {
			uuid : 'layerMenuItem-' + M.Util.guid(), // unique id for layermenu item
			caption : 'New folder',
			pos : 0,
			folder : true
		};

		var layerItem = {
			item : folder, 
			layer : false
		};

		// this._addFolder(folder);
		this._add(layerItem);

		// save to server
		this._project.store.layermenu.push(folder);
		this.save();

		// this._setHeight();

	},

	_editFolderTitle : function (uuid) {
		if (!this.editMode || this.currentlyEditing) return;

		this.currentlyEditing = true;

		var layerItem = this.layers[uuid];
		var folder = layerItem.el.children[3];

		// inject <input>
		var title = folder.innerHTML;
		folder.innerHTML = '';
		var input = M.DomUtil.create('input', 'layer-item-title-input');
		input.value = title;
		folder.appendChild(input);

		// focus
		input.focus();

		// add blur hook
		M.DomEvent.on(input, 'blur', function () {
			
			// remove
			var newTitle = input.value;
			M.DomUtil.remove(input);
			folder.innerHTML = newTitle;
			
			// save
			var i = _.findIndex(this._project.store.layermenu, {'uuid' : uuid});
			this._project.store.layermenu[i].caption = newTitle;
			this.save();

			var layerUuid = this._project.store.layermenu[i].layer;
			var layer = this._project.getLayer(layerUuid);
			var file = layer ? layer.getFile() : false;

			// update file and layer models
			file && file.setName(newTitle);
			layer && layer.setTitle(newTitle);

			// update controls
			this._updateControls();

			// boolean
			this.currentlyEditing = false;

		}, this);

		// add keyp hooks
		M.DomEvent.on(input, 'keydown', function (e) {
			if (event.which == 13 || event.keyCode == 13) input.blur(); // enter
			if (event.which == 27 || event.keyCode == 27) input.blur(); // esc
		}, this);

		// get layer
		var i = _.findIndex(this._project.store.layermenu, {'uuid' : uuid});
		var layerUuid = this._project.store.layermenu[i].layer;
		var layer = this._project.getLayer(layerUuid);
		var layer_name = layer ? layer.getTitle() : 'Folder';

		// log
		app.log('edited_folder_title:layermenu', {info : {layer_name : layer_name}});


	},

	_updateControls : function () {
		
		// update layermenu
		var lm = app.MapPane._controls.layermenu;
		lm && lm._refresh(true);

		var insp = app.MapPane._controls.inspect;
		insp && insp._refresh(true);

		var leg = app.MapPane._controls.legends;
		leg && leg._refresh(true);

	},


	upFolder : function (uuid) {

		// get element
		var wrap = this.layers[uuid].el;

		// get current x pos
		var i   = _.findIndex(this._project.store.layermenu, {'uuid' : uuid});
		var pos = parseInt(this._project.store.layermenu[i].pos);

		// set new pos
		var newpos = pos + 1;
		this._project.store.layermenu[i].pos = newpos;

		// add class
		M.DomUtil.addClass(wrap, 'level-' + newpos);
		M.DomUtil.removeClass(wrap, 'level-' + pos);

		// save
		this.save();
	},

	downFolder : function (uuid) {	// refactor, same as upFolder

		// get element
		var wrap = this.layers[uuid].el;

		// get current x pos
		var i   = _.findIndex(this._project.store.layermenu, {'uuid' : uuid});
		var pos = parseInt(this._project.store.layermenu[i].pos);

		// set new pos
		var newpos = pos - 1;

		// dont allow below 0
		if (newpos < 0) newpos = 0;

		this._project.store.layermenu[i].pos = newpos;

		// add class
		M.DomUtil.addClass(wrap, 'level-' + newpos);
		M.DomUtil.removeClass(wrap, 'level-' + pos);

		// save
		this.save();

	},

	deleteMenuFolder : function (uuid) {
		
		// remove
		this._removeItem(uuid); // layerMenuItem-32132-123123-adsdsa-sda

		// Hides layer button if there are no layers to show
		app.Chrome.Top._showHideLayerButton();
	},


	save : function () {
		var that = this;

		// check if valid logic
		var invalid = this.checkLogic();
		if (invalid.length) return console.error('not valid layermenu!', invalid);

		// clear timer
		if (this.saveTimer) clearTimeout(this.saveTimer);

		// save on timeout
		this.saveTimer = setTimeout(function () {
			that._project._update('layermenu');
		}, 1000);       // don't save more than every goddamed second

	},

	
	_setEnabledOnInit : function (layer_id, onoff) {

		var l = this._project.store.layermenu;
		var i = -1;

		l.forEach(function (item, n) {
			if (item.layer == layer_id) i = n;
		});

		// err
		if (i < 0) return console.error('couldnt save');

		var curLayer = this._project.store.layermenu[i];

		// get highest zindex
		var topLayer = _.max(l, function (ll) {
			return parseInt(ll.zIndex);
		});

		var highestz = parseInt(topLayer.zIndex); 
		var newZ = (topLayer.uuid == curLayer.uuid) ? highestz : highestz + 1; 

		// set z-index
		if (onoff) this._project.store.layermenu[i].zIndex = newZ;

		// set enabled
		this._project.store.layermenu[i].enabled = onoff;

		// save
		this.save();
	},

	calculateHeight : function () {
		
		if ( app.MapPane._controls.description ) {
			app.MapPane._controls.description._calculateHeight();
		} else {
			console.log('set max height of layer menu!');
		}

	},


	// EVENT fired in chrome.top.js
	_toggleLeftChrome : function (e) {

		if ( !app.isMobile || !app.isMobile.mobile ) return;		

		var isOpen = e.detail.leftPaneisOpen;
		isOpen ? this.close() : this.open();

	},


});

L.control.layermenu = function (options) {
	return new L.Control.Layermenu(options);
};
