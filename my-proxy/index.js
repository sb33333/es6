const _getCheckedValues = (inputElementArray) => {
    var checked = inputElementArray.filter(input => input.checked).map(input => input.value);
    return (checked.length === 1) ? checked[0] : checked;
}
const _setValue = (inputElement, value) => {
    inputElement.value = value;
    _dispatchInputEvent(inputElement);
}
const _setInputChecked = (inputElementArray, ...values) => {
    inputElementArray.forEach(input=>{
        if (values.includes(input.value)) input.checked = true;
        else input.checked = false;
        _dispatchInputEvent(input);
    });
    return true;
}
const _dispatchInputEvent = (inputElement) => {
    inputElement.dispatchEvent(new Event("input", {bubbles: true}));
}

const setter = (target, prop, newValue, receiver, recordProxy) => {
    var returnValue = false;
    switch (prop) {
        case "value": 
            if (target.tagName === "INPUT" && (target.type === "radio" || target.type === "checkbox")) {
                returnValue = _setInputChecked(target.element, ...newValue);
            } else {
                target.element.forEach(input => {
                    _setValue(input, newValue);
                });
                returnValue = true;
            }
            break;
        case "disabled" : 
            target.element.forEach(input => input.disabled=(newValue?true:false));
            returnValue = true;
            break;
    }
    recordProxy.dispatch({
        target,
        prop,
        newValue,
        receiver,
        recordProxy
    });
    return returnValue;
}

const getter = (target, prop, receiver, recordProxy) => {
    if (prop === "value") {
        if(target.tagName === "INPUT" && (target.type === "radio" || target.type === "checkbox")) {
            return _getCheckedValues(target.element);
        } else {
            return target.element.reduce((val, cur) => cur.value, "");
        }
    }
    return undefined;
}


function test2 (element, keyAttribute, getHandlers, setHandlers) {
    var _getHandlers = [getter, ...getHandlers];
    var _setHandlers = [setter, ...setHandlers];
    var recordProxy = Array.from(element.querySelectorAll(`[${keyAttribute}]`))
    .reduce((acc, cur) => {
        var key = cur.getAttribute(keyAttribute);
        if (key in acc) {
            if(acc[key]["type"] !== cur.type || acc[key]["tagName"] !== cur.tagName) throw new Error("must be same type.");
            acc[key]["element"]=[...acc[key]["element"], cur];
        } else {
            acc[key]={
                key,
                type:cur.type,
                tagName:cur.tagName,
                element:[cur],
            }
        }
        return acc;
    }, {});

    recordProxy = Object.entries(recordProxy).reduce((acc, cur) => {
        Object.defineProperty(acc, cur[0], {
            writable:false,
            configurable: false,
            enumerable: true,
            value: new Proxy(cur[1], {
                /**
                 * getter가 호출되는 경우 handler를 실행합니다. 최초로 반환되는 값이 있는 경우 반환됩니다.
                 * 반환된 값이 있어도 handler를 모두 실행하긴 합니다.
                 * 
                 * handler는 target, prop, receiver를 파라미터로 받습니다.
                 */
                _getHandlerChain (target, prop, receiver) {
                    var t = _getHandlers.reduce((acc, handler) => {
                        var result = handler(target, prop, receiver, recordProxy);
                        
                        if (!acc) acc = result;
                        return acc;
                    }, null);
                    return t;
                },
                /** 
                 * setter가 호출되는 경우 handler를 실행합니다.
                 * 실제 값을 설정하는 handler에서 true를 반환하도록 합니다.
                 * reducer 호출 중 true가 한 번이라도 반환되면 true가 반환됩니다.
                 */
                _setHandlerChain (target, prop, newValue, receiver) {
                    return _setHandlers.reduce((acc, handler) => {
                        var result = handler(target, prop, newValue, receiver, recordProxy);
                        if (!acc) acc = result;
                        return acc;
                    }, false);
                },
                get(target, prop, receiver) {
                    return this._getHandlerChain(target, prop, receiver);
                    
                },
                set(target, prop, newValue, receiver) {
                    return this._setHandlerChain(target, prop, newValue, receiver);
                },
            })
        });
        return acc;
    }, {});

    let eventListeners = [];
    Object.defineProperty(recordProxy, "addChangeListener", {
        value: function (listener) {
            eventListeners.push(listener);
            return () => {
                eventListeners = eventListeners.filter(l => l!==listener);
            }
        }
    })
    Object.defineProperty(recordProxy, "dispatch", {
        value: function (event) {
            eventListeners.forEach(l => l(recordProxy, event));
        }
    })
    
    element.addEventListener("input", function (event) {
        recordProxy.dispatch({
            target:{
                key:event.target.getAttribute(keyAttribute),
                type:event.target.type,
                tagName:event.target.tagName,
                element:[event.target]
            },
            prop:"value",
            newValue:event.target.value
        })
    });

    return recordProxy;
}