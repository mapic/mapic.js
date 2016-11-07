"use strict";

console.log(testMode);

describe("core.app", function () {

  var app;

  before(function() {
    app = new Wu.App(systemapicConfigOptions);
  });

  it("Should check Wu version", function () {
    expect(Wu.version).to.equal('1.6.1');	
  });


  it("Should test App constructed", function () {
    expect(app).to.exist;
  });

  it("Should test raven function availability after App construction", function () {    
    expect(app.raven).to.exist;	
  });

});
