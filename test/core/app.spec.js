"use strict";

describe("core.app", function () {

  var app;
  var projectModel;

  before(function() {
    app = new Wu.App(systemapicConfigOptions);
    projectModel = new Wu.Model.Project();
    app.Chrome = {};
    app.api = mockApi;
  });

  // version
  it("should check Mapic.js version", function () {
    expect(Wu.version).to.equal('1.6.1');	
  });

  // app object
  it("should have global app", function () {
    expect(app).to.exist;
  });

  // project model object
  it("should have project model object" , function () {
    console.log(projectModel);
    expect(projectModel).to.exist;
  });

  it("should have Wu.Chrome.Project instance" , function () {
    var chromeProject = new Wu.Chrome.Projects();
    expect(chromeProject).to.exist;
  });

  it("should create fullscreen window" , function () {
    var fullscreen = new Wu.Fullscreen({
			title : '<span style="font-weight:200;">Create New Project</span>'
		});

		var content = fullscreen._content;

    expect(content).to.exist;

  });


  it("should create a new project", function () {
    var options = {"store":{"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}}};
    
    var store = {"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}}

    var project = new Wu.Model.Project(store);
    
    project.create(options, function (err, json) {
      console.log(json);

      expect(json.project.name).to.equal(store.name);
      expect(json.project.description).to.equal(store.description);
      expect(json.project.createdByName).to.equal(store.createdByName);

    });

  });

  // todo: https://github.com/mapic/mapic.js/issues/6

});
