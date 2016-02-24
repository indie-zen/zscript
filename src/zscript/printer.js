const types = require('./types.js');

export function objToString(obj, pretty = true) {
  // TODO handle different types of objects
  console.log(`Printing type ${types.getType(obj)}`);
  switch(types.getType(obj)) {
    case 'string':
      return obj;
    case 'symbol':
      return types._symbol(obj);
    default:
      if (obj != null) {
        return obj.toString();
      } else {
        return "null";
      }
  }
}
