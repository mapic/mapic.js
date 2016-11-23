var mockApi = {
    createProject : function (options, done) {

		var path = '/v2/projects/create';

        var response = {
            "error": null,
            "project": {
                "_id": "582f1e585381b2001832d81e",
                "lastUpdated": "2016-11-18T15:29:29.960Z",
                "created": "2016-11-18T15:29:28.852Z",
                "createdByUsername": "admin",
                "createdByName": "Shahjada Talukdar",
                "createdBy": "user-cf46b1c1-0520-493b-a2fe-8539fd16b0eb",
                "uuid": "project-0e386d2a-2966-419b-8604-96d112d4abb2",
                "__v": 6,
                "pending": [],
                "settings": {
                    "d3popup": false,
                    "mapboxGL": false,
                    "mediaLibrary": false,
                    "tooltips": false,
                    "darkTheme": false,
                    "autoAbout": false,
                    "autoHelp": false,
                    "saveState": false,
                    "dataLibrary": true,
                    "documentsPane": true,
                    "socialSharing": true,
                    "screenshot": true
                },
                "controls": {
                "cartocss": false,
                "baselayertoggle": true,
                "vectorstyle": false,
                "geolocation": false,
                "inspect": false,
                "legends": false,
                "draw": true,
                "layermenu": true,
                "mouseposition": true,
                "description": true,
                "measure": true,
                "zoom": true
                },
                "header": {
                "css": "",
                "height": "100",
                "subtitle": "New subtitle",
                "title": "New title",
                "logo": ""
                },
                "folders": [],
                "layermenu": [],
                "position": {
                "zoom": "4",
                "lng": "6.767578125",
                "lat": "54.213861000644926"
                },
                "bounds": {
                    "maxZoom": "20",
                    "minZoom": "1",
                    "southWest": {
                        "lng": "-180",
                        "lat": "-90"
                    },
                    "northEast": {
                        "lng": "180",
                        "lat": "90"
                    }
                },
                "baseLayers": [
                    {
                        "uuid": "layer-3bcebbd0-e240-46ce-8ec0-d943a6182a16",
                        "_id": "582f1e595381b2001832d82b",
                        "opacity": 1,
                        "zIndex": 1
                    }
                ],
                "connectedAccounts": {
                "cartodb": [],
                "mapbox": [
                    {
                    "username": "systemapic",
                    "accessToken": "pk.eyJ1Ijoic3lzdGVtYXBpYyIsImEiOiJQMWFRWUZnIn0.yrBvMg13AZC9lyOAAf9rGg",
                    "_id": "582f1e595381b2001832d826"
                    }
                ]
                },
                "collections": [],
                "layers": [
                {
                    "_id": "582f1e595381b2001832d81f",
                    "lastUpdated": "2016-11-18T15:29:29.881Z",
                    "created": "2016-11-18T15:29:29.881Z",
                    "accessToken": "pk.eyJ1Ijoic3lzdGVtYXBpYyIsImEiOiJQMWFRWUZnIn0.yrBvMg13AZC9lyOAAf9rGg",
                    "attribution": "<a href=\"https://www.mapbox.com/about/maps/\" target=\"_blank\">&copy; Mapbox</a> <a href=\"http://www.openstreetmap.org/about/\" target=\"_blank\">&copy; OpenStreetMap</a> <a class=\"mapbox-improve-map\" href=\"https://www.mapbox.com/map-feedback/\" target=\"_blank\">Improve this map</a> <a href=\"https://www.digitalglobe.com/\" target=\"_blank\">&copy; DigitalGlobe</a>",
                    "tms": false,
                    "bounds": "-180,-85.0511,180,85.0511",
                    "minZoom": "0",
                    "maxZoom": "22",
                    "description": "Mapbox Cloudless Satellite Baselayer",
                    "title": "Mapbox Natural Satellite",
                    "uuid": "layer-9c546a23-e0a2-409c-b489-180dd0ba62e0",
                    "__v": 0,
                    "data": {
                    "mapbox": "systemapic.jl514cjd",
                    "wms": {
                        "layers": []
                    }
                    }
                },
                {
                    "_id": "582f1e595381b2001832d820",
                    "lastUpdated": "2016-11-18T15:29:29.890Z",
                    "created": "2016-11-18T15:29:29.890Z",
                    "accessToken": "pk.eyJ1Ijoic3lzdGVtYXBpYyIsImEiOiJQMWFRWUZnIn0.yrBvMg13AZC9lyOAAf9rGg",
                    "attribution": "<a href=\"https://www.mapbox.com/about/maps/\" target=\"_blank\">&copy; Mapbox</a> <a href=\"http://www.openstreetmap.org/about/\" target=\"_blank\">&copy; OpenStreetMap</a> <a class=\"mapbox-improve-map\" href=\"https://www.mapbox.com/map-feedback/\" target=\"_blank\">Improve this map</a>",
                    "tms": false,
                    "bounds": "-180,-85,180,85",
                    "minZoom": "0",
                    "maxZoom": "19",
                    "description": "",
                    "title": "Mapbox Streets",
                    "uuid": "layer-efc45370-434a-4c07-a310-5f02f7dac29e",
                    "__v": 0,
                    "data": {
                        "mapbox": "systemapic.jmkoodlb",
                        "wms": {
                            "layers": []
                        }
                    }
                }],
                "files": [],
                "roles": [],
                "access": {
                "options": {
                    "isPublic": false,
                    "download": true,
                    "share": true
                },
                "edit": [],
                "read": []
                },
                "categories": [],
                "keywords": [
                ""
                ],
                "description": "Test Project description",
                "slug": "Test Project Name",
                "name": "Test Project Name"
            }
        };

        done && done(null, response);

	},

    updateProject : function (options, done) {
        var response = {
            "updated": [
                "name"
            ],
            "project": {
                "lastUpdated": "2016-11-23T11:41:06.225Z",
                "created": "2016-11-18T15:29:28.852Z",
                "createdByUsername": "admin",
                "createdByName": "Shahjada Talukdar",
                "createdBy": "user-cf46b1c1-0520-493b-a2fe-8539fd16b0eb",
                "uuid": "project-0e386d2a-2966-419b-8604-96d112d4abb2",
                "description": "Test Project description",
                "slug": "Test Project Name",
                "name": "Test Project Name 2"
            }
        };

        response = JSON.stringify(response);

        var path = '/v2/projects/update';
		done && done(null, response);
    },

    deleteProject : function (options , done) {
        var response = {
            "project": "project-0e386d2a-2966-419b-8604-96d112d4abb2",
            "deleted": true
        };

        var path = '/v2/projects/delete';
		done && done(null, response);
        
    }
}
