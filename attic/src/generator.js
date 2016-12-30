export default class GeneratorManager {
  constructor() {
    // TODO Raise exception or implement singleton?
  }
  static getService(name) {
    if(name == "nodejs") {
      var generator = require('./generators/nodejs.js');
      return new generator();
    }
  }
};
