describe("JM", function() {
  it("should be present", function() {
    var text = JM.render({}, function() {
      ul();
    });

    text.should.equal("<ul></ul>");
  });
});