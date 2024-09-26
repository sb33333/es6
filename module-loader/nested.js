import * as module1 from "./module1.js";
import * as module2 from "./module2.js";
import * as module3 from "./module3.js";

var test = function () {
console.log(module1.greeting());
console.log(module2.default);
return module3.greeting();
};

export {test as greeting};