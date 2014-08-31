(function (app) {

  app.config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('main', {
        url        : '/',
        templateUrl: '/processor/views/assembler.html',
        controller : 'AssemblerCtrl'
      })

  });

  app.factory('IO', function () {

    var screen = {},
        ctx, px;

    screen.bg = [20, 2, 2, 255]; // blackish
    screen.fg = [55, 206, 39, 255]; // greenish

    screen.height = 256;
    screen.width = 512;

    function rgba(a) {
      return ('rgba(' + a.join(',') + ')');
    }

    function fill(color, startX, startY, endX, endY) {

      color = color ? color : screen.fg;
      startX = startX ? startX : 0;
      startY = startY ? startY : 0;
      endX = endX ? endX : screen.width;
      endY = endY ? endY : screen.height;

      ctx.fillStyle = rgba(color);
      ctx.fillRect(startX, startY, endX, endY);
    }

    var pixel = function (x, y, rgba) {

      rgba = rgba ? rgba : screen.fg;
      px.data[0] = rgba[0];
      px.data[1] = rgba[1];
      px.data[2] = rgba[2];
      px.data[3] = rgba[3];
      ctx.putImageData(px, x, y);
    };

    function addScreen(context, pixel) {
      ctx = context;
      px = pixel;
    }

    function addKeyboard() {

    }

    function read(address) {

    }

    function write(address, data) {

    }

    return {
      addScreen  : addScreen,
      addKeyboard: addKeyboard,
      read       : read,
      write      : write
    }

  });

  app.factory('binary', function () {

    var compTable = {
      "0"  : "101010",
      "1"  : "111111",
      "-1" : "111010",
      "D"  : "001100",
      "A"  : "110000",
      "!D" : "001101",
      "!A" : "110001",
      "-D" : "001111",
      "-A" : "110011",
      "D+1": "011111",
      "A+1": "110111",
      "D-1": "001110",
      "A-1": "110010",
      "D+A": "000010",
      "A+D": "000010",
      "D-A": "010011",
      "A-D": "000111",
      "D&A": "000000",
      "A&D": "000000",
      "D|A": "010101",
      "A|D": "010101"
    };

    var jumpTable = {
      "JGT": "001",
      "JEQ": "010",
      "JGE": "011",
      "JLT": "100",
      "JNE": "101",
      "JLE": "110",
      "JMP": "111"
    };

    function pad(val, len, padding) {
      padding = padding | 0;
      if (val.length < len) {
        val = padding + val;
        return pad(val, len, padding);
      } else {
        return val
      }
    }

    function assemble(command) {

      console.log(command);

      if (command.type === 'A') {

        return pad(command.value.toString(2), 16);

      } else {

        var header = '111',
            comp = '000000',
            dest = ['A', 'D', 'M'],
            jump = '000',
            M_bit = '0';

        if (command.comp.indexOf('M') !== -1) {
          M_bit = '1';
          command.comp = command.comp.replace('M', 'A');
        }

        if (command.comp in compTable) {
          comp = compTable[command.comp];
        }

        dest = dest.map(function (val) {
          return command.dest && command.dest.indexOf(val) !== -1 ? '1' : '0';
        }).join('');

        if (command.jump in jumpTable) {
          jump = jumpTable[command.jump];
        }

        return header + M_bit + comp + dest + jump;

      }
    }

    return {
      assemble: assemble
    }
  });

  app.factory('toolkit', function ($q, $timeout) {

    function promisify(fn) {
      return function (args) {
        var self = this;
        var deferred = $q.defer();

        $timeout(function () {

          try {
            deferred.resolve(fn.call(self, args));
          } catch (e) {
            deferred.reject(e);
          }
        });

        return deferred.promise;

      };
    }

    return {
      promisify: promisify
    }

  });

  app.factory('grammars', function ($q, $http) {

    var urls = {
      assembler: '/assets/assembler.pegjs'
    };


    function get(grammar) {

      var deferred = $q.defer();

      var url = urls[grammar];

      if (!url) {
        deferred.reject('Unknown grammar: ' + grammar);
      } else {

        $http({
          method: 'GET',
          url   : url
        }).
          success(function (grammar) {
            deferred.resolve(grammar);
          }).
          error(function (err) {
            deferred.reject(err);
          });
      }
      return deferred.promise;
    }

    return {
      get: get
    }

  });

  app.factory('CPU', function (IO) {


    var ALU = {
      '0'  : function () {
        return 0;
      },
      '1'  : function () {
        return 1
      },
      '-1' : function () {
        return -1
      },
      'D'  : function (a, d) {
        return d
      },
      'A'  : function (a) {
        return a
      },
      '!D' : function (a, d) {
        return ~d
      },
      '!A' : function (a) {
        return ~a
      },
      '-D' : function (a, d) {
        return -d
      },
      '-A' : function (a) {
        return -a
      },
      'D+1': function (a, d) {
        return d + 1
      },
      'A+1': function (a) {
        return a + 1
      },
      'D-1': function (a, d) {
        return d - 1
      },
      'A-1': function (a) {
        return a - 1
      },
      'D+A': function (a, d) {
        return a + d
      },
      'A+D': function (a, d) {
        return a + d
      },
      'D-A': function (a, d) {
        return d - a
      },
      'A-D': function (a, d) {
        return a - d
      },
      'A&D': function (a, d) {
        return a & d
      },
      'D&A': function (a, d) {
        return a & d
      },
      'A|D': function (a, d) {
        return a | d
      },
      'D|A': function (a, d) {
        return a | d
      }

    };

    var jumpAnalyzer = {
      JGT: function (x) {
        return (x > 0);
      },
      JEQ: function (x) {
        return (x === 0);
      },
      JGE: function (x) {
        return (x >= 0);
      },
      JLT: function (x) {
        return (x < 0);
      },
      JNE: function (x) {
        return (x !== 0);
      },
      JLE: function (x) {
        return (x <= 0);
      },
      JMP: function () {
        return true;
      }
    };

    var reg = {
      PC : 0,
      zr : 0,
      ng : 0,
      A  : 0,
      D  : 0,
      KBD: 0
    };

    var RAM = [];

    function step(command) {

      reg.zr = 0;
      reg.ng = 0;

      var result;

      if (command.comp) {
        if (command.comp.indexOf('M') !== -1) {
          // swap A for M and
          var comp = command.comp.replace('M', 'A');
          result = ALU[comp](IO.read(reg.A), reg.D);
        } else {
          result = ALU[command.comp](reg.A, reg.D);
        }
      }


      if (command.jump) {
        var jump = jumpAnalyzer[command['jump']];
        reg.PC = jump(result) ? reg.A : reg.PC + 1;
      } else {
        reg.PC++;
      }


    }


    return {
      step         : step,
      _jumpAnalyzer: jumpAnalyzer,
      reg          : reg,
      _ALU         : ALU
    }

  });

  app.controller('AssemblerCtrl', function ($q, $scope, toolkit, grammars, binary) {

    var defaultSource = [
      '// Computes R0 = 2 + 3',
      '',
      '@2',
      'D=A',
      '@3',
      'D=D+A',
      '@0',
      'M=D'
    ].join('\n');

    function buildParser(type) {
      var deferred = $q.defer();
      grammars.get(type).then(function (grammar) {

        var p = toolkit.promisify(PEG.buildParser).bind(PEG);
        p(grammar).then(function (success) {
          console.log('[ ' + type + ' ] parser built successfully.');
          deferred.resolve(success);
        }, function (fail) {
          deferred.reject('Error building [ ' + type + ' ] ' + fail.message);
        });


      }, function (retrieveError) {
        deferred.reject('Error retrieving grammar [ ' + type + ' ]: ' + retrieveError);
      });
      return deferred.promise;
    }

    var assemble;

    buildParser('assembler').then(function (parser) {
      assemble = toolkit.promisify(parser.parse);
      $scope.code.source = defaultSource;
    }, function (err) {
      $scope.code.assembled = err;
    });

    $scope.sourceOptions = {
      lineNumbers: true
    };

    $scope.assembledOptions = {
      lineNumbers : true,
      lineWrapping: true
    };

    $scope.code = {};


    $scope.$watch('code.source', function () {
      if (assemble) {
        assemble($scope.code.source).then(function (assembled) {
          $scope.code.assembled = assembled.map(binary.assemble).join('\n');
        }, function (err) {
          $scope.code.assembled = 'Line: ' + err.line + ' Column: ' + err.column + ' - ' + err.message;
        });
      }
    });

  });

  app.controller('ScreenCtrl', function ($scope, IO) {

    $scope.screen = IO.screen;

  });

  app.directive('screen', function (IO) {

    return {

      template: '<canvas id="screen" ng-attr-height="{{ screen.height }}" ng-attr-width="{{ screen.width }}"></canvas>',

      restrict: 'E',

      controller: 'ScreenCtrl',

      link: function (scope, element) {
        var ctx = element[0].firstChild.getContext('2d');
        var px = ctx.createImageData(1, 1);
        IO.addScreen(ctx, px);
      }

    }

  });

}(angular.module('processor', [
  'ui.router',
  'ui.codemirror'
])));
