M.Guide = M.Evented.extend({

	_initialize : function () {

	},
	
	_onClosePopups : function () {
		this.close();
	},

	start : function () {

		// Init texts
		this.initTexts();
		
		// create content
		this._initContent();
	
		// events
		this.addEvents();

		// Preload images
		this.loadImages();

	},

	initTexts : function () {
	
		// Welcome text
		var welcomeTextHeader = '<h3><b>Velkommen til Globesar!</b></h3>';
		var welcomeTextBody = 'Vi har prøvd å demonstrere satellitt InSAR deformasjonsmålinger så selvforklarende som mulig, og vår webtjeneste har en del funksjonalitet slik at du får mer ut av målingene.<br><br><b>Ønsker du en kort demo?</b>';

		this._welcomeText = welcomeTextHeader + welcomeTextBody;
		
		// Guide texts
		this._layerText = 'Klikk på datasettet for å velge hvilket område du ønsker å studere.<br>Aktive datasett er markert med et grønt punkt.<br>Klikk på forstørrelsesglasset for å raskt komme til dataen på kartet';
		this._infoText = 'Denne boksen viser kjennetegn for valgt måleserie (datasett)<br>Fargeskalaen viser størrelse på målt bevegelse i tidsperioden.<br>Bevegelse fra satellitten vises som rødt (nedsynking), mens bevegelse mot satellitten vises i blått.';
		this._graphText = 'Punktene illustrerer hvor vi har måleverdier og fargene illustrerer hastighet.<br>Klikk på et punkt for å studere utviklingen i tid.<br>Klikk "Regression" for å se trenden.';
		this._multiText = 'Tegneverktøyet muliggjør at du kan studere gjennomsnittsverdiene for flere punkt.<br>Husk å lukke polygonet ved å klikke der du startet å tegne.';

		this._contactText = '(+47) 40601994 – <a target="_blank" href="mailto:info@globesar.com">info@globesar.com</a> – <a href="http://www.globesar.com" target="_blank">www.globesar.com</a>';
		this._diclaimerText = 'Ved å benytte seg av denne webtjenesten aksepterer du&nbsp;';
		this._diclaimerButtonText = 'disse vilkårene.';

		// Buttons text
		this._nextButtonText = 'Ok. Neste steg!';
		this._directButtonText = 'Ta meg direkte til webtjenesten!';
		this._finalButtonText = 'Ok. Ta meg til webtjenesten!';
		this._tourText = 'Ok, vi tar en demo. ';

		// Terms
		this._termsText = 'Produkter som er tilgjengeliggjort for uregistrerte brukere på nettstedet https://maps.globesar.com/demo/dams er vist kun for eksperimentelle og demonstrasjonsformål. Produktene fra Globesar AS vises uten noen som helst form for garanti og Globesar AS tar ikke noe ansvar for produktenes egnethet og bruk i et bestemt formål.  <br><br>Produktene skal tolkes av personers med relevant fagkompetanse for det bestemte formålet.  Globesar AS kan ikke på noen som helst måte holdes ansvarlig for tolkning knyttet til produktene, som eksempelvis men ikke begrenset til, geologisk, geoteknisk, geofysisk, strukturell eller annen tolking som er utledet fra produktene. Globesar kan ikke heller holdes ansvarlig for tap eller skade påført av brukeren eller en tredjepart som direkte eller indirekte har utledet, videreforedlet, tolket eller integrert produktene sammen med annen type av informasjon.<br><br>Produktene er ett resultat av en algoritme basert på en statistisk metode. Globesar AS kan derfor ikke garantere at produktene er 100% nøyaktige. Produktene som viser deformasjonsverdier er produsert utfra et relativt fastpunkt. Globesar gir ikke noe som helst garantier at viste deformasjonsverdier er 100% reelle og at de punkter som ikke viser noe bevegelse er ikke en garanti for at dem er stabile. <br><br>Brukeren påtar seg all risiko som følger bruk av produktene. Brukeren skal holde Globesar AS skadesløs fra ethvert krav, eller krav om erstatning fra tredjepart, som følge av offentliggjøringen av produktene. For mer informasjon om Globesar sine produkter og tjenester, se http://www.globesar.com .<br><br>https://maps.globesar.com/demo/dams er basert på grunnlagsdata fra Norkart og brukeren må være innforstått med Norkart’s sine brukervillkår. Globesar AS er ikke på noen som helst måte ansvarlig og gir ikke noen som helst garanti for informasjonen som er tilgjengelig fra Norkart, dets tredjepart og kontinuitet i tjenesten fra Norkart.';
		this._termsOkayText = 'OK! Jeg aksepterer vilkårene.';
	},


	_initContent : function () {

		// Translucent black backdrop
		this._bg = M.DomUtil.create('div', 'guide-fullscreen-block', app._appPane);

		// The container
		this._outerContainer = M.DomUtil.create('div', 'guide-outer-container', app._appPane);
		this._container = M.DomUtil.create('div', 'guide-container', this._outerContainer);

		// Welcome container
		this._welcomeOuterContainer = M.DomUtil.create('div', 'tour-welcome-outer-container', this._container);

		// Welcome text area
		this._welcomeTextArea = M.DomUtil.create('div', 'tour-text-area welcome-text', this._welcomeOuterContainer, this._welcomeText);
		
		// Welcome buttons
		this._welcomeButtonsContainer = M.DomUtil.create('div', 'tour-welcome-buttons-container', this._welcomeOuterContainer);
		this._welcomeButtonTour = M.DomUtil.create('div', 'smooth-button', this._welcomeButtonsContainer, this._tourText);		
		this._welcomeButtonStart = M.DomUtil.create('div', 'smooth-button right', this._welcomeButtonsContainer, this._directButtonText);

		// Welcome disclaimer
		this._disclaimerContainer = M.DomUtil.create('div', 'tour-welcome-disclaimer', this._welcomeOuterContainer);
		this._disclaimerTextArea = M.DomUtil.create('span', 'tour-welcome-disclaimerText', this._disclaimerContainer, this._diclaimerText);
		this._termsButton = M.DomUtil.create('a', 'tour-welcome-disclaimer-terms', this._disclaimerContainer, this._diclaimerButtonText);
		this._termsButton.href = '#';		

		// Welcome contact information
		this._contactContainer = M.DomUtil.create('div', 'tour-welcome-contact', this._welcomeOuterContainer);
		this._contactTextArea = M.DomUtil.create('div', 'tour-welcome-contact-text', this._contactContainer, this._contactText);

		// Centralize this._container
		this._centralize(this._container, 400);

		setTimeout(function (argument) {
			this._bg.style.opacity = 1;
			this._container.style.opacity = 1;	
		}.bind(this))

	},

	// Initialize tour
	_initTerms : function () {

		// Hide welcome text
		this._welcomeOuterContainer.style.opacity = 0;

		// Centralize this._container
		this._centralize(this._container, 550);

		// Build elements
		this._termsContainer = M.DomUtil.create('div', 'tour-terms-container', this._container);
		this._termsTextArea = M.DomUtil.create('div', 'tour-terms-text-area', this._termsContainer, this._termsText);

		this._termsButtonContainer = M.DomUtil.create('div', 'tour-terms-button-container', this._termsContainer);
		this._termsButtonOK = M.DomUtil.create('div', 'terms-ok smooth-button', this._termsButtonContainer, this._termsOkayText);

		// Event listnener
		M.DomEvent.on(this._termsButtonOK, 'click', this._closeTerms, this);

		// Time with CSS transitions
		setTimeout(function() {
			M.DomUtil.addClass(this._welcomeOuterContainer, 'displayNone');
			this._startTerms();
		}.bind(this), 250);	
	
	},	

	_startTerms : function () {

		setTimeout(function () {
			this._termsContainer.style.opacity = 1;	
		}.bind(this), 50)		
		
	},

	_closeTerms : function () {

		this._termsContainer.style.opacity = 0;
		this._centralize(this._container, 400);

		setTimeout(function() {
			
			this._welcomeOuterContainer.style.opacity = 1;
			M.DomUtil.removeClass(this._welcomeOuterContainer, 'displayNone');

			// this._termsContainer.remove();
			M.DomUtil.remove(this._termsContainer);
			this._termsContainer = null;


		}.bind(this), 250);		

	},

	// Initialize tour
	_initTour : function () {

		// Hide welcome text
		this._welcomeOuterContainer.style.opacity = 0;

		// Centralize this._container
		this._centralize(this._container, 550);

		// Time with CSS transitions
		setTimeout(function() {
			// Flush container
			this._container.innerHTML = '';
			// Start the tour
			this.startTour();
		}.bind(this), 250);		
	
	},


	// Start the tour
	startTour : function () {

		// Slide container
		this._tourContainer = M.DomUtil.create('div', 'tour-container', this._container);

		// Need to have a little delay for opacity animation to work
		setTimeout(function () {
			this._tourContainer.style.opacity = 1;	
		}.bind(this), 50)
		
		// GIF images
		this._guideImagesContainer = M.DomUtil.create('div', 'guide-images-container', this._tourContainer);
		this._guideImages = M.DomUtil.create('div', 'guide-images', this._guideImagesContainer);
		this._guideImagesBackground = M.DomUtil.create('div', 'guide-background', this._guideImages);
		this._guideImagesBackground.appendChild(this.img_blank);
		this._guideImagesForeground = M.DomUtil.create('div', 'guide-foreground', this._guideImages);

		// Dots
		this._dotsContainer = M.DomUtil.create('div', 'tour-guide-dots-container', this._tourContainer);
		this._dot1 = M.DomUtil.create('div', 'tour-dot', this._dotsContainer);
		this._dot2 = M.DomUtil.create('div', 'tour-dot', this._dotsContainer);
		this._dot3 = M.DomUtil.create('div', 'tour-dot', this._dotsContainer);
		this._dot4 = M.DomUtil.create('div', 'tour-dot', this._dotsContainer);

		// Text area
		this._textArea = M.DomUtil.create('div', 'tour-text-area', this._tourContainer);

		// Buttons
		this._buttonsContainer = M.DomUtil.create('div', 'tour-buttons-container', this._tourContainer);
		this._nextButton = M.DomUtil.create('div', 'smooth-button relative', this._buttonsContainer);

		// Know which GIF we're showing
		this.counter = 1;
		
		// Set default text
		this._textArea.innerHTML = this._layerText;

		// Set button text
		this._nextButton.innerHTML = this._nextButtonText;

		// Activate first dot
		this._dot1.className = 'tour-dot active-dot';	

		// Start the "layer" GIF after one second
		setTimeout(function () {
			if (!this.img_layers) return;
			this._guideImagesForeground.appendChild(this.img_layers); 
		}.bind(this), 1000);

		// Register click event on button
		M.DomEvent.on(this._nextButton, 'click', this.next, this);
		
	},

	// Next slide button
	next : function () {

		// If we're at the last slide => go to map
		if ( !this.counter ) {
			this.close();
			return;		
		}

		// Going from "Layers" to "Description/legends"
		if ( this.counter == 1 ) { 			
			
			M.DomUtil.remove(this.img_layers);
			// this.img_layers.remove(); 
			
			this.img_layers = null;
			this._guideImagesForeground.appendChild(this.img_info);

			this._dot1.className = 'tour-dot';
			this._dot2.className = 'tour-dot active-dot';
			 
			this._textArea.style.opacity = 0;
			setTimeout(function() {
				this._textArea.innerHTML = this._infoText;
				this._textArea.style.opacity = 1;
			}.bind(this), 500);
		}

		// Going from "Description/legends" to "Graph"
		if ( this.counter == 2 ) { 
			// this.img_info.remove();
			M.DomUtil.remove(this.img_info);
			this.img_info = null;
			this._guideImagesForeground.appendChild(this.img_graph); 

			this._dot2.className = 'tour-dot';
			this._dot3.className = 'tour-dot active-dot';

			
			this._textArea.style.opacity = 0;
			setTimeout(function() {
				this._textArea.innerHTML = this._graphText; 
				this._textArea.style.opacity = 1;
				this._textArea.style.top = 25 + 'px';
			}.bind(this), 500);
		}

		// Going from "Graph" to "Multi Graph"
		if ( this.counter == 3 ) {
			// this.img_graph.remove();
			M.DomUtil.remove(this.img_graph);
			this.img_graph = null;
			this._guideImagesForeground.appendChild(this.img_multi); 
			this._nextButton.innerHTML = this._finalButtonText;

			this._dot3.className = 'tour-dot';
			this._dot4.className = 'tour-dot active-dot';

			this._textArea.style.opacity = 0;
			setTimeout(function() {
				this._textArea.innerHTML = this._multiText; 
				this._textArea.style.opacity = 1;
			}.bind(this), 500);

			// Stop counter
			this.counter = false;
			return;
			
		} 

		// Add to counter
		this.counter ++;
		
	
	},

	// Set height and top position of container in relation to window height.
	_centralize : function (div, _height) {
		var windowHeight = window.innerHeight;
		var diff = Math.floor((windowHeight - _height)/2);

		if ( diff < 10 ) diff = 10;

		div.style.top = diff + 'px';
		div.style.height = _height + 'px';
	},


	// Preloading images
	// We are loading them with a random string at the end to make sure they are loaded fresh,
	// otherwise GIF animations might not start from the beginning.
	loadImages : function () {

		var path = '/images/guide/';

		this.img_blank = new Image();
		this.img_blank.src = path + 'blank.gif';

		this.img_layers = new Image();
		this.img_layers.src = path + 'layers.gif'+"?a="+Math.random();

		this.img_info = new Image();
		this.img_info.src = path + 'info.gif'+"?a="+Math.random();

		this.img_graph = new Image();
		this.img_graph.src = path + 'graph.gif'+"?a="+Math.random();

		this.img_multi = new Image();
		this.img_multi.src = path + 'multigraph.gif'+"?a="+Math.random();
	},



	addEvents : function () {
		M.DomEvent.on(this._welcomeButtonStart, 'click', this._clickClose, this);
		M.DomEvent.on(this._welcomeButtonTour, 'click', this._initTour, this);
		M.DomEvent.on(this._termsButton, 'click', this._initTerms, this);
		M.DomEvent.on(window, 'keydown', this._keyDown, this);
	},

	removeEvents : function () {
		M.DomEvent.off(this._welcomeButtonStart, 'click', this._clickClose, this);
		M.DomEvent.off(this._welcomeButtonTour, 'click', this._initTour, this);
		M.DomEvent.off(this._termsButton, 'click', this._initTerms, this);
		M.DomEvent.off(window, 'keydown', this._keyDown, this);
	},

	_keyDown : function (e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 27) { //Enter keycode
			this.close(e);
		}
	},

	_clickClose : function (e) {
		// set cookie
		var ok = Cookies.set('guide', 'seen', { expires: 7 });

		console.log('set cookie', ok);
		
		// close
		this.close(e);
	},

	close : function (e) {
		e && M.DomEvent.stop(e);

		if (!this._container) return;

		this.removeEvents();

		M.DomUtil.remove(this._container);
		M.DomUtil.remove(this._bg);
	},

	_onDoingScreenshot : function () {
		this.close();
	}

});