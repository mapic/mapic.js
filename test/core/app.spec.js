"use strict";

describe("core.app", function () {

  var app;
  var projectModel;

  before(function() {
    app = new Wu.App(systemapicConfigOptions);
    //projectModel = new Wu.Model.Project();
    //app.Chrome = {};
    //app.api = mockApi;
  });

  // version
  it("should check Mapic.js version", function () {
    expect(Wu.version).to.equal('1.6.1');	
  });

  // app object
  it("should have global app", function () {
    expect(app).to.exist;
  });

  // // project model object
  // it("should have project model object" , function () {
  //   console.log(projectModel);
  //   expect(projectModel).to.exist;
  // });

  // it("should have Wu.Chrome.Project instance" , function () {
  //   var chromeProject = new Wu.Chrome.Projects();
  //   expect(chromeProject).to.exist;
  // });

  // it("should create fullscreen window" , function () {
  //   var fullscreen = new Wu.Fullscreen({
  //     title : '<span style="font-weight:200;">Create New Project</span>'
  //   });
  //   var content = fullscreen._content;
  //   expect(content).to.exist;

  // });

  // it("should fire the clicked Event on project creation" , function () {

  //   var name_input = {
  //     value : "My Test Project 1"
  //   };
  //   var name_error = {};

  //   var options = {
  //     name_input : name_input,
  //     name_error : name_error
  //   };

  //   var chromeProject = new Wu.Chrome.Projects();
  //   var isFired = chromeProject._createProject(options);
  //   expect(isFired).to.be.true;
  // });


  // it("should create a new project and validate data", function () {
  //   var options = {"store":{"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}}};    
  //   var store = {"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
  //   var project = new Wu.Model.Project(store);
  //   project.create(options, function (err, json) {
  //     expect(json.project.name).to.equal(store.name);
  //     expect(json.project.description).to.equal(store.description);
  //     expect(json.project.createdByName).to.equal(store.createdByName);

  //   });
  // });

  // it("should fire the clicked event on project edition" , function () {

  //   var store = {"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
  //   var project = new Wu.Model.Project(store);

  //   console.log(project);

  //   var name_input = {
  //     value : "My Test Project 1"
  //   };
  //   var name_error = {};

  //   var options = {
  //     name_input : name_input,
  //     name_error : name_error,
  //     project : project
  //   };

  //   var chromeProject = new Wu.Chrome.Projects();
  //   var isFired = chromeProject._updateProject(options);
  //   expect(isFired).to.be.true;
  // });

  // it("should update project name", function () {
  //   var options = {"store":{"name":"Test Project Name","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}}};    
  //   var store = {"name":"Test Project Name","uuid" : "project-0e386d2a-2966-419b-8604-96d112d4abb2","description":"Test Project description","createdByName":"Shahjada Talukdar","access":{"edit":[],"read":[],"options":{"share":true,"download":false,"isPublic":false}}};
    
  //   var project = new Wu.Model.Project(store);

  //   var newProjectName = "Test Project Name 2";
    
  //   // var sss = "{updated: ['name'], project: Object{_id: '582f1e585381b2001832d81e', lastUpdated: '2016-11-23T11:41:06.225Z', created: '2016-11-18T15:29:28.852Z', createdByUsername: 'admin', createdByName: 'Shahjada Talukdar', createdBy: 'user-cf46b1c1-0520-493b-a2fe-8539fd16b0eb', uuid: 'project-0e386d2a-2966-419b-8604-96d112d4abb2', __v: 6, description: 'Project description', slug: 'testtttttttt1111111111', name: 'Testtttttttt1111111115'}}";





  //   // var eee = JSON.parse(sss);

  //   // console.log(eee);


    
  //   project.setName(newProjectName);
  //   console.log("************************************");
  //   wait(7111);
  //   console.log("************************************");

    
      
  //     console.log(project.getName());
      

    

  // });

  // todo: https://github.com/mapic/mapic.js/issues/6

});
