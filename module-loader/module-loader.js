// 모듈이 가져왔을 때 발생하는 이벤트 이름 상수
const MODULE_IMPORT_EVENT_NAME = "moduleImport";

const ModuleLoader = (function() {
    // 모듈 URI 목록을 저장하는 배열
    const moduleURIs = [];

    // 가져온 모듈 정보를 저장하는 객체
    const importedModule = {};

    // 로그 메시지를 저장하는 배열
    const logMessageArray = [];

    // 모듈을 덮어쓸 수 있는지 여부를 저장하는 플래그
    let canOverwrite = false;

    // 로그 메시지를 추가하는 함수
    const addLogMessage = (...messages) => {
        logMessageArray.push(messages);
    }

    // 모듈의 URI와 이름을 추가하는 함수
    const add = (uri, name) => {
        if(!uri) throw new Error("module uri cannot be null."); // URI가 없으면 에러 발생
        moduleURIs.push({ uri, name }); // 모듈 URI와 이름을 배열에 추가
        return ModuleLoader; // 메소드 체이닝을 위해 ModuleLoader 반환
    }

    // 모듈이 로드되었는지 여부를 추적하는 변수
    let loaded = null;

    // 모듈이 로드된 후 호출될 콜백을 설정하는 함수
    const onModuleImported = (callback) => {
        if(!loaded) {
            init().then(() => callback()); // 로드되지 않았다면 init 호출 후 콜백 실행
        } else {
            loaded.then(() => callback()); // 이미 로드되었으면 즉시 콜백 실행
        }
    }

    // 모듈 로딩을 초기화하는 함수
    const init = (callback, overwrite) => {
        if(loaded) return loaded; // 이미 초기화되었으면 기존 프로미스 반환
        loaded = loadModules(callback, overwrite); // 모듈 로드
        return loaded;
    }

    // 모듈을 로드하고 처리하는 함수
    const loadModules = (callback, overwrite) => {
        console.time(); // 로드 시간 측정 시작
        if(loaded) throw new Error("already initialized."); // 이미 로드되었으면 에러 발생
        if(!moduleURIs?.length) throw new Error("module info Array is empty."); // 모듈 URI 배열이 비어있으면 에러 발생

        // 중복된 모듈 이름이 있는지 확인
        moduleURIs.forEach(moduleInfo => {
            var { name } = moduleInfo;
            if(name && window[name]) throw new Error(`${name} is already bound.`);
        });

        canOverwrite = overwrite; // 덮어쓰기 여부 설정

        // 모듈 URI 리스트를 순차적으로 처리
        var promises = moduleURIs.reduce(
            function accumulator(acc, moduleInfo) {
                if(acc) {
                    return acc.then(() => _handleModuleInfo(moduleInfo));
                } else {
                    return _handleModuleInfo(moduleInfo);
                }
            }, 
            null
        );

        // 처리 완료 후 모듈을 window 객체에 복사
        return promises
            .then(copyModuleToWindowContext)
            .then(() => {
                console.debug("initialized"); // 디버그 로그 출력
                logMessageArray.forEach(msgArray => {
                    console.group();
                    msgArray.forEach(msg => console.warn(msg));
                    console.groupEnd();
                });
                if(callback && typeof callback === "function") {
                    callback(); // 콜백이 있다면 실행
                }
                // 모듈이 로드되었음을 알리는 이벤트 디스패치
                document.dispatchEvent(new Event(MODULE_IMPORT_EVENT_NAME, { bubbles: true }));
                console.timeEnd(); // 로드 시간 측정 종료
            });
    }

    // 개별 모듈을 처리하는 함수
    function _handleModuleInfo(moduleInfo) {
        var { name, uri } = moduleInfo;

        return new Promise((res, rej) => {
            import(uri).then(mod => { // 동적으로 모듈을 가져옴
                var target = null;

                if(name) {
                    if(!importedModule[name]) {
                        importedModule[name] = {}; // 새로운 네임스페이스 생성
                        Object.defineProperty(importedModule[name], "_uri", {
                            value: uri,
                            writable: false,
                            configurable: false,
                            enumerable: false,
                        });
                    }
                    target = importedModule[name]; // 지정된 네임스페이스에 모듈 저장
                } else {
                    target = importedModule; // 이름이 없는 경우 기본 객체에 저장
                }

                // 모듈의 각 프로퍼티를 처리
                for(var prop in mod) {
                    if (prop === "default" && !name) {
                        rej(new Error(`A namespace is required to import a property that has been exported as default.`));
                    }

                    // 이미 같은 프로퍼티가 존재하면 덮어쓰기 여부에 따라 처리
                    if(target[prop]) {
                        if(canOverwrite) {
                            addLogMessage(`property "${prop}" from "${uri}" overwrites the previously imported properties from "${target[prop]["_uri"]}".`);
                        } else {
                            rej(new Error(`Cannot import "${prop}" from "${uri}" because it conflicts with the already imported "${prop}".`));
                        }
                    }

                    target[prop] = {
                        property: mod[prop],
                        uri: uri,
                        module: mod,
                    };
                }
                res(""); // 모듈 처리 완료
            }).catch(error => {
                addLogMessage(`Failed to import module "${moduleInfo["uri"]}" due to the following error.`, error);
                res(error); // 에러 발생 시 로그 추가
            });
        });
    }

    // window 객체에 모듈을 복사하는 함수
    function copyModuleToWindowContext() {
        // 이미 window에 있는 프로퍼티를 덮어쓰지 않도록 확인
        for(var name in importedModule) {
            if(window[name] !== undefined) throw new Error(`Cannot bind property "${name}" to the window object because it already exists.`);
        }

        // window 객체에 모듈 프로퍼티를 복사
        for(var name in importedModule) {
            if("uri" in importedModule[name]) {
                window[name] = importedModule[name]["property"];
            } else {
                var copied = Object.entries(importedModule[name]).reduce((acc, cur) => {
                    acc[cur[0]] = cur[1]["property"];
                    return acc;
                }, {});
                window[name] = copied;
            }
        }
    }

    // 외부에서 사용할 수 있는 함수들을 반환
    return {
        init,
        add,
        onModuleImported,
    };
})();
