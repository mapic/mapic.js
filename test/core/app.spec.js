"use strict";

console.log(testMode);

describe("core.app", function () {

  it("Should check Wu version", function () {

    expect(Wu.version).to.equal('1.6.1');
	
  });

  it("Should test App constructed", function () {

    var app = new Wu.App(systemapicConfigOptions);
    expect(app).to.exist;
	
  });

});
