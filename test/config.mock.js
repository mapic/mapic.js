var systemapicConfigOptions = {
		"id" : "app",
		"portalName": "mapic",
		"portalLogo": false,
		"portalTitle": "[localhost] Mapic Secure Portal",
		"panes": {
			"clients": true,
			"options": true,
			"documents": true,
			"dataLibrary": true,
			"users": true,
			"share": true,
			"mediaLibrary": false,
			"account": true
		},
		"attribution" : "<a href='http://mapic.io' target='_blank'>Powered by Mapic.io</a>",
		"logos": {
			"projectDefault": "/css/images/grinders/BG-grinder-small-grayDark-on-white.gif",
			"portalLogo" : "css/logos/web-logo.png",
			"portalLink" : "https://localhost/"			
		},
		"settings": {
			"chat": true,
			"colorTheme": true,
			"screenshot": true,
			"socialSharing": true,
			"print": true
		},
		"defaults": {
			"project": {
				"position": {
					"lat": 54.213861000644926,
					"lng": 6.767578125,
					"zoom": 4
				}
			}
		},
		"providers": {
			"mapbox": [{
				"username": "systemapic",
				"accessToken": "pk.eyJ1Ijoic3lzdGVtYXBpYyIsImEiOiJkV2JONUNVIn0.TJrzQrsehgz_NAfuF8Sr1Q"
			}]
		},
		"servers": {
			"portal": "https://localhost/",
			"subdomain" : "https://localhost/",
			"tiles": {
				"uri": "https://localhost/v2/tiles/",
				"subdomains": []
			},
			"cubes": {
				"uri" : "https://localhost/v2/cubes/",
				"subdomains" : []
			},
			"proxy" : {
				"uri" : "https://localhost/v2/tiles/",
				"subdomains" : []
			},
			"utfgrid": {
				"uri": "https://localhost/v2/tiles/",
				"subdomains": []
			},
		},
		"ga": {
			"id": "GOOGLE_ANALYTICS_TRACKER"
		}
}