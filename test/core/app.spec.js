"use strict";

describe("core.app", function () {

  var app;

  before(function() {
    app = new Wu.App(systemapicConfigOptions);
  });

  // version
  it("should check Mapic.js version", function () {
    expect(Wu.version).to.equal('1.6.1');	
  });

  // app object
  it("should have global app", function () {
    expect(app).to.exist;
  });

  // todo: https://github.com/mapic/mapic.js/issues/6

});
