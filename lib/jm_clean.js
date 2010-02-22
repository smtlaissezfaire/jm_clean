require.paths.unshift(__dirname);
require('vendor/jm/lib/jm');
var jslex = require('vendor/jslex/jslex/jslex')["jslex"];

JM.GenericParser = (function() {
  var self = {};

  var map = JM.Helpers.map;

  self.token_index   = 0;
  self.parser_tokens = [];

  self.nextTokenType = function() {
    return this.parser_tokens[this.token_index][0];
  };

  self.lastTokenValue = function() {
    return this.parser_tokens[this.token_index - 1][1];
  };

  self.incrementToken = function() {
    this.token_index++;
  };

  self.tokenValuesFromTo = function(from, to) {
    var collection = this.parser_tokens.slice(from, to);

    return map(this.parser_tokens.slice(from, to), function(pair) {
      return pair[1];
    });
  };

  self.previousTokenValue = function() {
    return this.tokenValuesFromTo(this.token_index - 1, this.token_index)[0];
  };

  self.parseToken = function(token) {
    if (this.nextTokenType() == token) {
      this.incrementToken();
      return this.previousTokenValue();
    } else {
      throw {
        status:     false,
        preOffset:  this.token_index,
        postOffset: this.token_index
      };
    }
  };

  self.parseFunction = function(fun) {
    var start_index = this.token_index;

    try {
      fun();
      return this.tokenValuesFromTo(start_index, this.token_index);
    } catch (e) {
      this.token_index = start_index;
      throw(e);
    }
  };

  self.match = function(token_or_fun) {
    if (token_or_fun instanceof Function) {
      return this.parseFunction(token_or_fun);
    } else {
      return this.parseToken(token_or_fun);
    }
  };

  self.expect = self.match;

  return self;
})();

JM.Clean = (function() {
  var self    = JM.Helpers.clone(JM.GenericParser);
  var forEach = JM.Helpers.forEach;

  self.tokenize = function(str) {
    var lexer = new jslex({
      "_": {
        "{": function() {
          return ["open_brace", this.text];
        },
        "}": function() {
          return ["close_brace", this.text];
        },
        ":": function() {
          return ["colon", this.text];
        },
        "[ \t\r\n]": null,
        "[a-zA-Z]+": function() {
          return ["id", this.text];
        },
        "\'.*\'": function() {
          return ["id", this.text];
        },
        ".": function() {
          throw "invalid char";
        }
      }
    });

    return lexer.collect(str);
  };

  // expressions    -> expression+
  // expression     -> fun_call | statement
  // fun_call       -> id object? function_body?
  // object         -> key_value_pair+
  // key_value_pair -> id colon id
  // function_body  -> open_brace expressions close_brace
  // statement      -> .* (anything else)
  var builder;

  self.parse = function(str) {
    builder = new JM.Builder();
    self.parser_tokens = this.tokenize(str);

    this.function_call(builder);
    return builder;
  };

  function stripQuotes(str) {
    if (str[0] == "\'" && str[str.length - 1] == "\'") {
      return str.slice(1, str.length-1);
    }

    return str;
  }

  self.function_call = function() {
    var tag_name,
        properties = {},
        body;

    tag_name = this.match("id");

    try {
      var key = this.match("id");
      this.match("colon");
      var value = this.match("id");
      properties[key] = stripQuotes(value);
    } catch (e) { }

    builder[tag_name](properties);
  };

  return self;
})();