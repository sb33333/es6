// getter 보완하기(disabled등)

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

const _getCheckedValues; // 동일
const _setValue; // 동일


function test2(element, keyAttribute, getHandlers, setHandlers) {
//...

var composition = Array.from(); //

composition = Object.entries(composition).reduce((acc, cur=>{
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
element.addEventListener("input, eventHandler);
composition.revokes["eventHandler"] = () => {
console.debug("event listener removed");
element.removeEventListener("input", eventHandler);
eventListeners.forEach((e, i)=>eventListeners[i]=null);
eventListeners=null;
}
revokeWeakMap.set(element, composition.revokes);
return recordProxy;

} // end of test2();