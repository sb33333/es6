const ModuleLoader = (function() {
    const moduleURIs = [];
    const importedModule ={};
    const logMessageArray=[];
    let canOverwrite = false;
    const addLogMessage =function(...messages){
        logMessageArray.push(messages);
    }
    const add = function (uri, name){
        if(!uri) throw new Error("module uri cannot be null.");
        moduleURIs.push({
            uri:uri,
            name:name
        });
        return this;
    }
    let loaded=null;
    const onModuleImported=function(callback){
        if(!loaded){
            init().then(()=>callback());
        } else {
            loaded.then(()=>callback());
        }
    }

    const init = function(callback, overwrite){
        if(loaded)return loaded;
        loaded=loadModules(callback, overwrite);
        return loaded;
    }

    const loadModules=function(callback, overwrite){
        console.time();
        if(loaded)throw new Error("already initialized.");
        if(!moduleURIs?.length) throw new Error("module info Array is empty.");
        moduleURIs.forEach(moduleInfo =>{
            var {name}=moduleInfo;
            if(name && window[name])throw new Error(`${name} is already bound.`);
        });
        canOverwrite = overwrite;
        
        var promises=moduleURIs
            .reduce(
                function accumulator(acc, moduleInfo){
                    if(acc){
                        return acc.then(()=> _handleModuleInfo(moduleInfo));
                    } else {
                        return _handleModuleInfo(moduleInfo);
                    }
                }
                , null
            );
                
        return promises
            .then(copyModuleToWindowContext)
            .then(()=>{
                console.debug("initialized");
                logMessageArray.forEach(msgArray=>{
                    console.group();
                    msgArray.forEach(msg=>console.warn(msg));
                    console.groupEnd();
                });
                if(callback && typeof callback === "function"){
                    callback();
                }
                console.timeEnd();
            });
    }
            
    function _handleModuleInfo(moduleInfo){
        var {name,uri}=moduleInfo;
        return new Promise((res,rej)=>{
            import(uri).then(mod=>{
                var target=null;
                if(name){
                    if(!importedModule[name]){
                        importedModule[name]={};
                        Object.defineProperty(importedModule[name], 
                            "_uri", 
                            {
                                value:uri,
                                writable:false,
                                configurable:false,
                                enumerable:false,
                            }
                        );
                    }
                    target =importedModule[name];
                }else{
                    target=importedModule;
                }
                for(var prop in mod){
                    if (prop === "default" && !name) {
                        rej(new Error(`A namespace is required to import a property that has been exported as default.`));
                    }
                    if(target[prop]){
                        if(canOverwrite){
                            if(target[prop]["_uri"]){
                                addLogMessage(`property "${prop}" from "${uri}" overwrites the previously imported properties from "${target[prop]["_uri"]}".`);
                            } else {
                                addLogMessage(`property "${prop}" from "${uri}" overwrites the previously imported "${prop}" property from "${target[prop]["uri"]}".`);
                            }
                        } else {
                            rej(new Error(`Cannot import "${prop}" from "${uri}" because it conflicts with the already imported "${prop}" from "${target[prop]["_uri"] || target[prop]["uri"]}".`));
                        }
                    }
                    target[prop]={
                        property:mod[prop],
                        uri:uri,
                        module:mod,
                    }
                }
                res("");
            }).catch(error=>{
                addLogMessage(`Failed to import module "${moduleInfo["uri"]}" due to the following error.`, error);
                res(error);
            })
        });
    }
            
    function copyModuleToWindowContext() {
        for(var name in importedModule){
            if(window[name]!==undefined)throw new Error(`Cannot bind property "${name}" to the window object because it already exists.`);
        }
        for(var name in importedModule){
            if("uri" in importedModule[name]){
                window[name]=importedModule[name]["property"];
            }else{
                var copied=Object.entries(importedModule[name]).reduce((acc,cur)=>{
                    acc[cur[0]]=cur[1]["property"];
                    return acc;
                },{});
                window[name]=copied;
            }
        }
    }
    return {
        init:init,
        add:add,
        onModuleImported:onModuleImported,
    }
})();
