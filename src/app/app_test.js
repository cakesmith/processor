describe('CPU test', function () {

  beforeEach(module('processor'));

  var CPU;

  beforeEach(inject(function (_CPU_) {

    CPU = _CPU_;


  }));

  it('should be sane', function () {

    expect(CPU).toBeDefined();

  });


  it('should analyze jump information', function () {

    var jumpTest = {
      JGT: [
        {
          result: 0,
          expect: true
        },
        {
          result: 42,
          expect: true
        },
        {
          result: -42,
          expect: false
        }
      ],

      JEQ: [
        {
          result: 0,
          expect: true
        },
        {
          result: 42,
          expect: false
        },
        {
          result: -42,
          expect: false
        }
      ],

      JGE: [
        {
          result: 0,
          expect: true
        },
        {
          result: 42,
          expect: true
        },
        {
          result: -42,
          expect: false
        }
      ],

      JLT: [
        {
          result: 0,
          expect: false
        },
        {
          result: 42,
          expect: false,
        },
        {
          result: -42,
          expect: true
        }
      ],

      JNE: [
        {
          result: 0,
          expect: false
        },
        {
          result: 42,
          expect: true
        },
        {
          result: -42,
          expect: true
        }
      ],

//      JLE: [
//
//      ]


    };

    angular.forEach(jumpTest, function (tests, jumpUnderTest) {
      angular.forEach(tests, function (value) {
        var analyze = CPU.jumpAnalyzer[jumpUnderTest];
        console.log(jumpUnderTest);
        console.log('result: ' + value.result);
        console.log('expect: ' + value.expect);
        expect(analyze(value.result)).toEqual(value.expect);
      });
    });

  });

  it('should have a functional ALU', function () {


  });


});