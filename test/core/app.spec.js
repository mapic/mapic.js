"use strict";

describe("core.app", function () {

  var app;
  var projectModel;

  before(function() {
    app = new M.App(systemapicConfigOptions);
    //projectModel = new M.Model.Project();
    //app.Chrome = {};
    //app.api = mockApi;
  });

  
  // version
  it("should check Mapic.js version", function () {
    expect(M.version).to.exist;
  });

  // app object
  it("should have global app", function () {
    expect(app).to.exist;
  });

  // todo: https://github.com/mapic/mapic.js/issues/6

});
