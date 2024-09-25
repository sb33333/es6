ModuleLoader
    .add("./module1.js")
    .add("./module2.js", "ns2")    // export default requires namespace
    .add("./module3.js")    // overwrite 
    
    .init(null, true);
    ;


document.addEventListener("moduleImport", (e) => {
    console.log(e);
});
$(document).on("moduleImport", (e) => {
    console.log(e);
});

ModuleLoader.onModuleImported(() => {
    // property from module
    console.log(ns2.test);
});