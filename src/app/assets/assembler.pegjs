// Initialization
{

Array.prototype.clean = function(deleteValue) {

  // Removes all instances of deleteValue
  // (usually undefined) from array

  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

Array.prototype.dedupe = function dedupe() {

   // Removes all duplicates from array, leaving 
   // one copy of each element
    
    var seen = [];
    
    return this.filter(function(element) {
      if (seen.indexOf(element) === -1) {
       seen.push(element);
       return true; 
      } else {
       return false;
      }
    });

  }

  var compiledLineNumber = 0;

  var symbolTable = { 
    SP : 0,
    LCL : 1,
    ARG : 2,
    THIS : 3,
    THAT : 4,
    SCREEN : 16384, 
    KBD : 24576 
  }

  var nextLabel = 16;


  for(var i = 0; i < nextLabel; i++) {
   symbolTable['R' + i] = i;
}
  

  var definedLabels = {};


  function resolveSymbols(program) {


    return program.clean().map(function(command, index) {

       if (!command) return
    
       if (command.type === 'A') {
      if((Object.keys(symbolTable).indexOf(command.value) !== -1)) {
           command.value = symbolTable[command.value];

         } else {

           var int = parseInt(command.value);

           if (int) {
             command.value = int;
           } else {

             command.value = symbolTable[command.value] = nextLabel++;

           }
       }

      }

      return command;
       
    });
  }

}

/* 
 * Assembly grammar
 */


Program
  = program:Line* { return resolveSymbols(program) }

Line
  = command:Command __
    {
      compiledLineNumber++;
      return command 
    }

  / Label __ {}
  / Comment {}
  / (LineTerminatorSequence / WhiteSpace) {}

Command "command"
  = A_Command / C_Command


A_Command "address command"
  = A_CommandStart value:$A_CommandPart+
    { 
      return {
        type: 'A',
        value: value
      }
    }

A_CommandStart
  = "@" 

A_CommandPart
  = [0-9a-zA-Z_.$!@%^&*]

C_Command
  = dest:DestPart? comp:Comp jump:JumpPart? 
      { 
        var command = {};

        command.type = "C";
        if(dest) command.dest = dest;
        command.comp = comp;
        if(jump) command.jump = jump;

        return command 
      }


Dest "destination"
  = dest:([AMD]+) { return dest.dedupe().join('') }

Infix
  = [\-+&|]

Prefix
  = [\-!]

CompTerminal
  = '0'
  / '1'
  / 'A'
  / 'M'
  / 'D'

Comp "compute command"
  = $(CompTerminal Infix CompTerminal)
  / $(Prefix CompTerminal)
  / $(CompTerminal)
   
Jump "jump command"
  = jump:JumpTarget { return jump }

JumpTarget
  = 'JGT'
  / 'JEQ'
  / 'JGE'
  / 'JLT'
  / 'JNE'
  / 'JLE'
  / 'JMP'

DestPart
  = dest:Dest '=' { return dest }

JumpPart
  = ';' jump:Jump { return jump }



Label "label"
  = '(' label: $[^() \n]+ ')'
    { 

      var label = label.trim();
        
      // If labels are comprised of only digits,
      // @[number] may reference this label instead of
      // a constant. This may lead to unexpected behavior, 
      // so we'll just avoid that possibility.

      if (label.match(/^\d+$/)) { 
        error('Label (' + label + ') cannot be a number.') 
      }

      if(Object.keys(symbolTable).indexOf(label) === -1) {

        definedLabels[label] = line();
        symbolTable[label] = compiledLineNumber;

      } else {

      // Labels are inherently unique, and as such may only
      // be defined once per program.

        error('label (' + label + ') is already defined on line ' + definedLabels[label])

      }

    }



// Comments, terminators and whitespace

SourceCharacter
  = .

WhiteSpace "whitespace"
  = '\t'
  / '\v'
  / '\f'
  / ' '
  / '\u00A0'
  / '\uFEFF'
  / Zs

LineTerminator "line terminator"
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
= "\n"
/ "\r\n"
/ "\r"
/ "\u2028"
/ "\u2029"

Comment "comment"
  = SingleLineComment
  / MultiLineComment


MultiLineComment
= "/*" (!"*/" SourceCharacter)* "*/"

SingleLineComment
= "//" (!LineTerminator SourceCharacter)*


// Separator, Space
Zs = [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]


/* Skipped */
__
= (EOL / Comment+ / WhiteSpace+) 
    {}

EOL
  = (LineTerminatorSequence / EOF)

EOF = !.