M.Styler.Line = M.Styler.extend({

	type : 'line',


	// creates content of point container
	_createOptions : function () {

		// color
		this._createColor();

		// opacity
		this._createOpacity();

		// pointsize
		this._createWidth();

		// blend
		// this._createBlendMode();

		// targets
		this._createTargets();
	},

	_preSelectOptions : function () {

		// open relevant subfields
		this._initSubfields(this.carto().color.column, 'color');
		this._initSubfields(this.carto().opacity.column, 'opacity');
		this._initSubfields(this.carto().width.column, 'width');
	},

	_clearOptions : function () {

		var content = this._content[this.type];

		// return if not content yet
		if (_.isEmpty(content)) return;

		// get divs
		var color_wrapper 	= content.color.line.container;
		var color_children 	= content.color.line.childWrapper;
		var opacity_wrapper 	= content.opacity.line.container;
		var opacity_children 	= content.opacity.line.childWrapper;
		var width_wrapper 	= content.width.line.container;
		var width_children 	= content.width.line.childWrapper;
		var targets 		= content.targets.wrapper;

		// remove divs
		color_wrapper && 	M.DomUtil.remove(color_wrapper);
		color_children && 	M.DomUtil.remove(color_children);
		opacity_wrapper && 	M.DomUtil.remove(opacity_wrapper);
		opacity_children && 	M.DomUtil.remove(opacity_children);
		width_wrapper && 	M.DomUtil.remove(width_wrapper);
		width_children && 	M.DomUtil.remove(width_children);
		targets && 		M.DomUtil.remove(targets);

		// clear targets
	}



});