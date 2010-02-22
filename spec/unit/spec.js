describe("vendored code", function() {
  describe("JM", function() {
    it("should be present", function() {
      var text = JM.render({}, function() {
        ul();
      });

      text.should.equal("<ul></ul>");
    });
  });
});

describe("JM.Clean", function() {
  describe("parser", function() {
    describe("tokenizing", function() {
      before_each(function() {
        compare_arrays = function(array1, array2) {
          array1.toString().should.equal(array2.toString());
        };
      });

      it("should find an empty array of tokens with an empty string", function() {
        // compare_arrays(JM.Clean.tokenize(""), []);
      });

      it("should find one char as a token", function() {
        compare_arrays(JM.Clean.tokenize("u"), [
          ['id', "u"]
        ]);
      });

      it("should find two different words as two tokens", function() {
        compare_arrays(JM.Clean.tokenize("foo bar"), [
          ['id', 'foo'],
          ["id", "bar"]
        ]);
      });

      it("should disregard any whitespace at the start", function() {
        compare_arrays(JM.Clean.tokenize("      foo"), [
          ["id", "foo"]
        ]);
      });

      it("should disregard any whitespace at the start & });", function() {
        compare_arrays(JM.Clean.tokenize("      foo         bar"), [
          ["id", "foo"],
          ["id", "bar"]
        ]);
      });

      it("should disregard newlines (of all sorts) + other whitespace", function() {
        compare_arrays(JM.Clean.tokenize("ul foo\n\r   \tbar"), [
          ["id", "ul"],
          ["id", "foo"],
          ["id", "bar"]
        ]);
      });

      it("should identify an open brace", function() {
        compare_arrays(JM.Clean.tokenize("{"), [
          ["open_brace", "{"]
        ]);
      });

      it("should identify an close brace", function() {
        compare_arrays(JM.Clean.tokenize("}"), [
          ["close_brace", "}"]
        ]);
      });

      it("should identify a colon", function() {
        compare_arrays(JM.Clean.tokenize(":"), [
          ["colon", ":"]
        ]);
      });

      it("should identify a colon after a word as a word + colon (not one word)", function() {
        // pending
        // compare_arrays(JM.Clean.tokenize("foo:"), [
        //   ["id", "foo"],
        //   ["colon", ":"]
        // ]);
      });
    });
  });

  describe("GenericParser", function() {
    before_each(function() {
      parser = JM.Helpers.clone(JM.GenericParser);
    });

    it("should have the token index at 0", function() {
      parser.token_index.should.equal(0);
    });

    it("should have the parser tokens as an empty list by default", function() {
      parser.parser_tokens.toString().should.equal([].toString());
    });

    it("should report on the next token type", function() {
      parser.parser_tokens = [["ID", "foo"]];

      parser.token_index.should.equal(0);
      parser.nextTokenType().should.equal("ID");
    });

    it("should report the correct next token type", function() {
      parser.parser_tokens = [["INTEGER", 1]];
      parser.nextTokenType().should.equal("INTEGER");
    });

    it("should report the correct next token type after the token type has been incremented", function() {
      parser.parser_tokens = [
        ["ID", "foo"],
        ["OPEN_PAREN", "("]
      ];

      parser.incrementToken();

      parser.nextTokenType().should.equal("OPEN_PAREN");
    });

    describe("parsing a token", function() {
      describe("when failing", function() {
        it("should raise an error", function() {
          parser.parser_tokens = [["INT", 1]];

          try {
            parser.parseToken("ID");
          } catch (e) {
            e.should.not.equal(undefined);
          }
        });

        it("should return the old post offset", function() {
          parser.parser_tokens = [["INT", 1]];

          try {
            parser.parseToken("ID");
          } catch (e) {
            e.postOffset.should.equal(0);
          }
        });

        it("should return the old pre offset", function() {
          parser.parser_tokens = [["INT", 1]];

          try {
            parser.parseToken("ID");
          } catch (e) {
            e.preOffset.should.equal(0);
          }
        });

        it("should return the status = false", function() {
          parser.parser_tokens = [["INT", 1]];

          try {
            parser.parseToken("ID");
          } catch (e) {
            e.status.should.equal(false);
          }
        });
      });

      describe("when matching", function() {
        it("should increment the token pointer", function() {
          parser.token_index.should.equal(0);

          parser.parser_tokens = [["ID", "foo"]];
          parser.parseToken("ID");

          parser.token_index.should.equal(1);
        });

        it("should return the token", function() {
          parser.parser_tokens = [["ID", "foo"]];
          parser.parseToken("ID").should.equal("foo");
        });
      });
    });

    describe("parsing a function", function() {
      it("should run the function", function() {
        var run = false;

        var fun = function() {
          run = true;
        };

        parser.parseFunction(fun);
        run.should.equal(true);
      });

      it("should increment when expecting a token", function() {
        parser.parser_tokens = [["INT", 1]];

        var fun = function() {
          parser.expect("INT");
        };

        parser.parseFunction(fun);
        parser.token_index.should.equal(1);
      });

      it("should increment when expecting two tokens", function() {
        parser.parser_tokens = [["INT", 1], ["INT", 1]];

        var fun = function() {
          parser.expect("INT");
          parser.expect("INT");
        };

        parser.parseFunction(fun);
        parser.token_index.should.equal(2);
      });

      it("should return the accepted tokens", function() {
        parser.parser_tokens = [["INT", 1], ["INT", 2]];

        var fun = function() {
          parser.expect("INT");
          parser.expect("INT");
        };

        parser.parseFunction(fun).toString().should.equal([1,2].toString());
      });

      it("should fail, raising an error when not expecting the correct token", function() {
        parser.parser_tokens = [["INT", 1]];

        var fun = function() {
          parser.expect("ID");
        };

        try {
          parser.parseFunction(fun);
        } catch (e) {
          e.should.not.be(undefined);
        }
      });

      it("should fail, rewinding the stack", function() {
        parser.parser_tokens = [["INT", 1], ["INT", 2]];

        var fun = function() {
          parser.expect("INT");
          parser.expect("ID");
        };

        try {
          parser.parseFunction(fun);
        } catch (e) { }

        parser.token_index.should.equal(0);
      });
    });

    describe("matching a token", function() {
      it("should increment when expecting a token", function() {
        parser.parser_tokens = [["INT", 1]];

        var fun = function() {
          parser.match("INT");
        };

        parser.match(fun);
        parser.token_index.should.equal(1);
      });

      it("should parse a token", function() {
        parser.parser_tokens = [["INT", 1]];

        parser.match("INT");
        parser.token_index.should.equal(1);
      });

      it("should have expect as an alias of match", function() {
        parser.expect.should.equal(parser.match);
      });
    });
  });

  describe("Clean", function() {
    before_each(function() {
      parser = JM.Helpers.clone(JM.Clean);
    });

    describe("parsing", function() {
      it("should parse a ul", function() {
        parser.parse("ul").toHTML().should.equal("<ul></ul>");
      });

      it("should parse an li", function() {
        parser.parse("li").toHTML().should.equal("<li></li>");
      });

      it("should add an object's properties", function() {
        parser.parse("ul foo : 'bar'").toHTML().should.equal("<ul foo='bar'></ul>");
      });

      it("should match the correct key", function() {
        parser.parse("ul quxx : 'bar'").toHTML().should.equal("<ul quxx='bar'></ul>");
      });

      it("should match the correct value", function() {
        parser.parse("ul foo : 'baz'").toHTML().should.equal("<ul foo='baz'></ul>");
      });

      // pending
      it("should match multiple key value pairs", function() {});
    });
  });
});