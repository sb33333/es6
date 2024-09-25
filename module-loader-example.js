ModuleLoader
    .add("./module1.js")
    .add("./module2.js", "ns2")    // export default requires namespace
    .add("./module3.js")    // overwrite 
    
    .init(null, true);
    ;
