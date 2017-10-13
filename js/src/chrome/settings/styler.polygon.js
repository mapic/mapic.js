M.Styler.Polygon = M.Styler.extend({

	type : 'polygon',

	// creates content of point container
	_createOptions : function () {

		// color
		this._createColor();

		// opacity
		this._createOpacity();

		// blend 
		// this._createBlendMode();

		// targeted columns
		this._createTargets();

	},
	
	_preSelectOptions : function () {

		// open relevant subfields
		this._initSubfields(this.carto().color.column, 'color');
		this._initSubfields(this.carto().opacity.column, 'opacity');
	},

	_clearOptions : function () {

		// get content
		var content = this._content[this.type];

		// return if not content yet
		if (_.isEmpty(content)) return;

		// get divs
		var color_wrapper = content.color.line.container;
		var color_children = content.color.line.childWrapper;
		var opacity_wrapper = content.opacity.line.container;
		var opacity_children = content.opacity.line.childWrapper;
		var targets 		= content.targets.wrapper;

		// remove divs
		color_wrapper && M.DomUtil.remove(color_wrapper);
		color_children && M.DomUtil.remove(color_children);
		opacity_wrapper && M.DomUtil.remove(opacity_wrapper);
		opacity_children && M.DomUtil.remove(opacity_children);
		targets && 		M.DomUtil.remove(targets);
	},




	_createTargetColumn : function (e, options) {

		// get columns
		var columnObjects = this.options.columns;
		var columns = [];

		// get column names only
		for (var c in columnObjects) {
			columns.push(c);
		}

		// head wrapper
		var wrapper = this._content[this.type].targets.wrapper;

		// create target wrapper
		var target_wrapper = M.DomUtil.create('div', 'target-wrapper', wrapper);


		// (-) button
		var rembtn_wrapper = M.DomUtil.create('div', 'target-remove', target_wrapper);
		rembtn_wrapper.innerHTML = '<i class="fa fa-minus-circle"></i>';
		
		// event
		M.DomEvent.on(rembtn_wrapper, 'click', this._removeTarget, this);	

		
		// column dropdown
		var column_wrapper = M.DomUtil.create('div', 'target-column-wrapper', target_wrapper);
		var column_title = M.DomUtil.create('div', 'target-column-title', column_wrapper, 'Column');
		var column_dropdown = new M.button({
			id 	 : 'target',
			type 	 : 'dropdown',
			isOn 	 : true,
			right 	 : true,
			appendTo : column_wrapper,
			fn 	 : this._targetColumnSelected.bind(this),
			array 	 : columns, // columns in dropdown
			selected : options.column, // preselected item
			className : 'target-column-dropdown tiny polygon'
		});


		// < = > input
		var operator_wrapper = M.DomUtil.create('div', 'target-column-wrapper', target_wrapper);
		var operator_dropdown = new M.button({
			id 	 : 'equals_selection',
			type 	 : 'clicker',
			appendTo : operator_wrapper,
			fn 	 : this._operatorSelected.bind(this),
			array 	 : ['<', '=', '>'], // columns in dropdown
			selected : options.operator, // preselected item
			className : 'target-equals-clicker'
		});

		
		// value input
		var input_wrapper = M.DomUtil.create('div', 'target-input-wrapper', target_wrapper);
		var input_title = M.DomUtil.create('div', 'target-input-title', input_wrapper, 'Value');
		var column_input = M.DomUtil.create('input', 'target-input polygon', input_wrapper);
		column_input.value = options.value;

		// blur event
		M.DomEvent.on(column_input, 'blur', this._targetValueSelected, this);



		// color ball
		var color_wrapper = M.DomUtil.create('div', 'target-color-wrapper', target_wrapper);
		var input_title = M.DomUtil.create('div', 'target-input-title', color_wrapper, 'Color');
		var ball = new M.button({
			id 	 : 'target-color',
			type 	 : 'colorball',
			right    : true,
			isOn 	 : true,
			appendTo : color_wrapper,
			fn       : this._targetColorSelected.bind(this),
			value    : options.color,
			colors   : this.options.palettes,
			className : 'target-color-box'
		});



		// opacity input
		var opacity_wrapper = M.DomUtil.create('div', 'target-opacity-wrapper', target_wrapper);
		var opacity_title = M.DomUtil.create('div', 'target-input-title-opacity', opacity_wrapper, 'Opacity');
		var opacity_input = M.DomUtil.create('input', 'target-input opacity', opacity_wrapper);
		opacity_input.value = options.opacity;

		// blur event
		M.DomEvent.on(opacity_input, 'blur', this._targetOpacitySelected, this);



		// remember
		this._content[this.type].targets.selectors = this._content[this.type].targets.selectors || [];
		this._content[this.type].targets.selectors.push({
			column : column_dropdown,
			value : column_input,
			color : ball,
			opacity : opacity_input,
			wrapper : target_wrapper,
			operator : operator_dropdown
		});


		// move (+) btn to bottom
		var button = this._content[this.type].targets.addTarget;
		var bwrapper = this._content[this.type].targets.wrapper;
		wrapper.appendChild(button);

	}

});