"use strict";

describe("core.project", function () {

  var app;
  var projectModel;

  before(function() {
    app = new Wu.App(systemapicConfigOptions);
    projectModel = new Wu.Model.Project();
    app.feedback = mockFeedback;
    app.Chrome = {};
    app.Projects = {};
    app.api = mockApi;
  });

  // project model object
  it("should have project model object" , function () {
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

  it("should fire the clicked Event on new project button" , function () {

    var name_input = {
      value : "My Test Project 1"
    };
    var name_error = {};

    var options = {
      name_input : name_input,
      name_error : name_error
    };

    var chromeProject = new Wu.Chrome.Projects();
    chromeProject._createProject(options , function (isFired) {
      expect(isFired).to.be.true;
    });
  });


  it("should create a new project with all required data", function () {
    var options = {"store":{"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}}};    
    var store = {"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    var project = new Wu.Model.Project(store);    
    project.create(options, function (err, json) {
      expect(json.project.name).to.equal(store.name);
      expect(json.project.description).to.equal(store.description);
      expect(json.project.createdByName).to.equal(store.createdByName);

    });
  });

  it("should fail to create a new project without project name", function () {
    var options = {"store":{"name":"","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}}};    
    var store = {"name":"","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    var project = new Wu.Model.Project(store);
    
    project.create(options, function (err, json) {
      expect(json.error.errors.missingRequiredFields[0]).to.equal("name");
    });
  });

  it("should fire the clicked event on project edition" , function () {

    var store = {"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    var project = new Wu.Model.Project(store);

    var name_input = {
      value : "My Test Project 1"
    };
    var name_error = {};

    var options = {
      name_input : name_input,
      name_error : name_error,
      project : project
    };

    var chromeProject = new Wu.Chrome.Projects();
    var isFired = chromeProject._updateProject(options);
    expect(isFired).to.be.true;
  });

  it("should update project name", function () {
        
    var store = {"name":"Test Project Name","uuid" : "project-0e386d2a-2966-419b-8604-96d112d4abb2","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    
    var project = new Wu.Model.Project(store);

    var newProjectName = "Test Project Name 2";

    project.setName(newProjectName);

    expect(project.store.name).to.equal(newProjectName);

  });

  it("should update project slug" , function () {

    var store = {"name":"Test Project Name","uuid" : "project-0e386d2a-2966-419b-8604-96d112d4abb2","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    
    var project = new Wu.Model.Project(store);

    var newSlug = "test-project-name";

    project.setSlug(newSlug);

    expect(project.store.slug).to.equal(newSlug);
    
  });

  it("should add viewers(read access) of a project" , function () {

    var store = {"name":"Test Project Name","uuid" : "project-0e386d2a-2966-419b-8604-96d112d4abb2","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    
    var project = new Wu.Model.Project(store);

    var access = {
			edit : [],
			read : ["user-fbb3dee3-e042-4ad3-8378-c08b19706d52"],
			options : {
				share : true,
				download : true,
				isPublic : false
			}
		};

    project.setAccess(access , function (err, resp) {
      expect(resp.access.read[0]).to.equal(access.read[0]);
    });    
  });

  it("should add editors(edit access) of a project" , function () {

    var store = {"name":"Test Project Name","uuid" : "project-0e386d2a-2966-419b-8604-96d112d4abb2","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    
    var project = new Wu.Model.Project(store);

    var access = {
			edit : ["user-fbb3dee3-e042-4ad3-8378-c08b19706d52"],
			read : [],
			options : {
				share : true,
				download : true,
				isPublic : false
			}
		};

    project.setAccess(access , function (err, resp) {
      expect(resp.access.edit[0]).to.equal(access.edit[0]);
    });
  });

  it("should delete a project", function () {
        
    var store = {"name":"Test Project Name","uuid" : "project-0e386d2a-2966-419b-8604-96d112d4abb2","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};

    var project = new Wu.Model.Project(store);

    app.Projects['project-0e386d2a-2966-419b-8604-96d112d4abb2'] = project;

    project._delete();
    
    var deletedProject = app.Projects['project-0e386d2a-2966-419b-8604-96d112d4abb2'];
    expect(deletedProject).to.be.undefined;

  });

  it("should invite user to a project", function () {

    var users = new Wu.Chrome.Users();

    users._fullscreen = new Wu.Fullscreen({
			title : '<span style="font-weight:200;">Invite people to Mapic</span>',
			innerClassName : 'smooth-fullscreen-inner invite'
		});

    var emailInput = {
      invite_input : {
        value : "aaa@testemaild.com"
      },
      invite_error : null
    };
    
    users._emails.push(emailInput);
    users._customMessage = {
      value : ""
    };

    users._access = {
      edit : [],
      read :[]
    };

    users._sendInvites({target : {}} , function (err , resp) {
      expect(resp.error).to.be.null;
    });

  });

  // it("should check available slug of project" , function () {
  //   project.checkAvailableSlug
  // });

  // todo: https://github.com/mapic/mapic.js/issues/6

});
