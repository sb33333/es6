ModuleLoader
        .add("./module1.js")
        // .add("./module2.js")    // export default requires namespace
        .add("./module2.js", "ns2")
        // .add("./module3.js")    // overwrite 
        .add("../async/async.js", "async")
        .init(null, true);
        ;


// ModuleLoader.add("./nested.js").init();


document.addEventListener("moduleImport", (e) => {
    console.log("event handler1");
    // console.log(greeting());
});
$(document).on("moduleImport", (e) => {
    console.log("event handler2");
    // console.log(greeting());
});

ModuleLoader.onModuleImported(() => {
    // property from module
    console.log("onModuleImported");
    // console.log(greeting());
});