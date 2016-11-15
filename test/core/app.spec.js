"use strict";

console.log(testMode);

describe("core.app", function () {

  var app;

  before(function() {
    app = new Wu.App(systemapicConfigOptions);
  });

  it("should check Mapic.js version", function () {
    expect(Wu.version).to.equal('1.6.1');	
  });


  it("should have global app", function () {
    expect(app).to.exist;
  });

  it("should have raven object after app construction", function () {    
    expect(app.raven).to.exist;	
  });

});
