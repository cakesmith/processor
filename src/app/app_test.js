describe('CPU test', function () {

  beforeEach(module('processor'));

  var CPU;

  beforeEach(inject(function (_CPU_) {

    CPU = _CPU_;

  }));

  it('should be sane', function () {
    expect(CPU).toBeDefined();
  });


  describe('analyzing jump information', function () {

    var test;

    it('JGT', function () {

      test = {
        JGT: [
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
            expect: false
          }
        ]
      };

    });

    it('JEQ', function () {

      test = {
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
        ]
      };

    });

    it('JGE', function () {

      test = {
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
        ]
      };

    });

    it('JLT', function () {

      test = {
        JLT: [
          {
            result: 0,
            expect: false
          },
          {
            result: 42,
            expect: false
          },
          {
            result: -42,
            expect: true
          }
        ]
      };

    });

    it('JNE', function () {

      test = {
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
        ]
      };

    });

    it('JLE', function () {

      test = {
        JLE: [
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
            expect: true
          }
        ]
      };

    });

    it('JMP', function () {

      test = {
        JMP: [
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
            expect: true
          }
        ]
      };

    });

    afterEach(function () {
      angular.forEach(test, function (tests, jump) {
        angular.forEach(tests, function (test) {
          var analyze = CPU._jumpAnalyzer[jump];
          expect(analyze(test.result)).toEqual(test.expect);
        });
      });
    });

  });

  describe('Arithmetic Logic Unit', function () {

    it('should have a functional ALU', function () {

      expect(CPU._ALU).toBeDefined();

      var a = 1234,
          d = 3333,
          alu = CPU._ALU;

      expect(alu['0'](a, d)).toEqual(0);
      expect(alu['1'](a, d)).toEqual(1);
      expect(alu['-1'](a, d)).toEqual(-1);
      expect(alu['D'](a, d)).toEqual(3333);
      expect(alu['A'](a, d)).toEqual(1234);
      expect(alu['!D'](a, d)).toEqual(-3334);
      expect(alu['!A'](a, d)).toEqual(-1235);
      expect(alu['-D'](a, d)).toEqual(-3333);
      expect(alu['-A'](a, d)).toEqual(-1234);
      expect(alu['D+1'](a, d)).toEqual(3334);
      expect(alu['A+1'](a, d)).toEqual(1235);
      expect(alu['D-1'](a, d)).toEqual(3332);
      expect(alu['A-1'](a, d)).toEqual(1233);
      expect(alu['D+A'](a, d)).toEqual(4567);
      expect(alu['A+D'](a, d)).toEqual(4567);
      expect(alu['D-A'](a, d)).toEqual(2099);
      expect(alu['A-D'](a, d)).toEqual(-2099);
      expect(alu['A&D'](a, d)).toEqual(1024);
      expect(alu['D&A'](a, d)).toEqual(1024);
      expect(alu['A|D'](a, d)).toEqual(3543);
      expect(alu['D|A'](a, d)).toEqual(3543);

    });


  });


});