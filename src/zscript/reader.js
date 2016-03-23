const types = require('./types.js');

class TokenIterator {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
    this.length = tokens.length;
  }

  next() {
    return this.tokens[this.position++];
  }

  peek() {
    return this.tokens[this.position];
  }

  done() {
    this.position = tokens.length + 1;
  }

  isDone() {
    return this.position >= this.length;
  }
}

export function tokenize(str) {
    const re = /[\s,]*(~@|[\[\]{}()`~^@]|["'](?:\\.|[^\\"])*["']|;.*|[^\s\[\]{}('"`,;)]*)/g;
    var match = null;
    var results = [];
    while ((match = re.exec(str)[1]) != '') {
        if (match[0] === ';') { continue; }
        results.push(match);
    }
    return new TokenIterator(results);
}

function readAtom(tokenIterator) {
  const token = tokenIterator.next();
  //console.log("read_atom:", token);
  if (token.match(/^-?[0-9]+$/)) {
      return parseInt(token,10)        // integer
  } else if (token.match(/^-?[0-9][0-9.]*$/)) {
      return parseFloat(token,10);     // float
  } else if (token[0] === "\'" || token[0] === "\"")  {
      return token.slice(1,token.length-1)
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\\\/g, "\\"); // string
  } else if (token[0] === ":") {
      return types._keyword(token.slice(1));
  } else if (token === "nil") {
      return null;
  } else if (token === "true") {
      return true;
  } else if (token === "false") {
      return false;
  } else {
      return types._symbol(token); // symbol
  }
}

// Read a list of tokens
function readList(tokenIterator, start='(', end=')') {
  var ast = [];
  var token = tokenIterator.next();
  if (token != start) {
    throw new Error("Expected '" + start + "'");
  }
  while((token = tokenIterator.peek()) !== end) {
    if (!token) {
      throw new Error("Expected '" + end + "', got EOF");
    }
    ast.push(readNextExpression(tokenIterator));
  }
  tokenIterator.next();
  return ast;
}

// Read a vector of tokens
function readVector(tokenIterator) {
  return types._vector(...readList(tokenIterator, '[', ']'));
}

// Read a hash map
function readHashMap(tokenIterator) {
  return types._hash_map(...readList(tokenIterator, '{', '}'));
}

export function readNextExpression(tokenIterator) {
  const token = tokenIterator.peek();
  switch(token) {
    case ';':
      // Ignore comments
      return null;

    // list
    case ')': throw new Error("Unexpected ')'");
    case '(': return readList(tokenIterator);

    // vector
    case ']': throw new Error("Unexpected ']'");
    case '[': return readVector(tokenIterator);

    case '}': throw new Error("Unexpected '}'");
    case '{': return readHashMap(tokenIterator);
    // atom
    default:
      return readAtom(tokenIterator);
  }
}

// Convert a single line of code to a syntax tree
export function readString(str) {
  var tokens = tokenize(str);
  // TODO Raise a BlankException the way MAL does?
  if (tokens.length === 0) {
    return null;
  }

  // TODO Handle expressions that span more than one line, and
  // handle more than one expression on a single line.
  console.log('Got tokens');
  console.log(tokens);
  var ast = readNextExpression(tokens);
  return (ast, iterator);
}
