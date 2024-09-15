ModuleLoader
    .add("./module1.js")
    .add("./module3.js")
    .add("./module2.js", "ns2")
    .add("./async.js")
    // .init(null, true);
    ;

ModuleLoader.onModuleImported(ajax);