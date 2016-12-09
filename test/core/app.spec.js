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
    expect(Wu.version).to.exist;
  });

  // app object
  it("should have global app", function () {
    expect(app).to.exist;
  });

  // todo: https://github.com/mapic/mapic.js/issues/6

});
