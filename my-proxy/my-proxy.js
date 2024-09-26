// getter 보완하기(disabled등)
const revokeWeakMap = new WeakMap();
const _observer = new MutationObserver(mutations => {
    mutations.forEach(mutation=>{
        mutation.removedNodes.forEach(removedNode =>{
            // removedNode.removeEventListener("input", iNPUT_EVENT_HANDLER);
            if(revokeWeakMap.has(removedNode)){
                var revokes=revokeWeakMap.get(removedNode);
                Object.values(revokes).forEach(revoke=>revoke());
            }
        });
    });
});

_observer.observe(document.body, {childList:true, subtree:true});

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
    switch(prop){
    case "value":
        if(target.tagName === "INPUT" && (target.type === "radio" || target.type === "checkbox")) {
            return _getCheckedValues(target.element);
        } else {
            return target.element.reduce((val, cur) => cur.value, "");
        }
    case "disabled":
    case "readOnly":
        return target.element.reduce((prop, cur) => cur[prop], undefined);
    }
    
    return undefined;
}

function test2(element, keyAttribute, getHandlers, setHandlers) {
    var _getHandlers = [getter, ...getHandlers];
    var _setHandlers = [setter, ...setHandlers];
    var composition = Array.from(element.querySelectorAll(`[${keyAttribute}]`))
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
    
    composition = Object.entries(composition).reduce((acc, cur)=>{
        var revocableProxy = Proxy.revocable(cur[1], {
            _getHandlerChain(target,prop,receiver){
                var t =_getHandlers.reduce((acc, handler)=>{
                    var result = handler(target, prop, receiver, recordProxy);
                    if(!acc)acc=result;
                    return acc;
                }, null);
                return t;
            },
            _setHandlerChain(target,prop,newValue,receiver){
                return _setHandlers.reduce((acc, handler)=>{
                    var result = handler(target,prop,newValue,receiver,recordProxy);
                    if(!acc)acc=result;
                    return acc;
                }, false);
            },
            get(target,prop,receiver){
                return this._getHandlerChain(target,prop,receiver);
            },
            set(target,prop,newValue,receiver){
                return this._setHandlerChain(target,prop,newValue,receiver);
            },
        });
        Object.defineProperty(acc["proxies"], cur[0], {
            writable:false,
            configurable:false,
            enumerable:true,
            value:revocableProxy.proxy
        });
        acc["revokes"][cur[0]]=revocableProxy.revoke;
        return acc;
    }, {
        proxies:{},
        revokes:{}
    });
    
    var recordProxy =composition.proxies;
    let eventListeners = [];
    Object.defineProperty(recordProxy, "addInputListener", {
        value:function(listener){
            eventListeners.push(listener);
            return () => {
                eventListeners = eventListeners.filter(l=>l!==listener);
                listener=null
            }
        }
    })
    Object.defineProperty(recordProxy, "dispatch", {
        value:function(event){
            eventListeners.forEach(l=>l(recordProxy, event));
        }
    })
    
    const eventHandler = function(event){
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
    };
    element.addEventListener("input", eventHandler);
    composition.revokes["eventHandler"] = () => {
        console.debug("event listener removed");
        element.removeEventListener("input", eventHandler);
        eventListeners.forEach((e, i)=>eventListeners[i]=null);
        eventListeners=null;
    }
    revokeWeakMap.set(element, composition.revokes);
    return recordProxy;
    
} // end of test2();