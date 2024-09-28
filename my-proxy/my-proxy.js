// WeakMap을 사용하여 DOM 엘리먼트가 제거될 때 관련된 자원을 해제하기 위한 매핑을 저장
const revokeWeakMap = new WeakMap();

// MutationObserver를 사용하여 DOM 변경 사항을 감지 (특히 노드가 제거되는 경우)
const _observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.removedNodes.forEach(removedNode => {
            // 노드가 제거되었을 때 WeakMap에 해당 노드가 있는지 확인
            if (revokeWeakMap.has(removedNode)) {
                var revokes = revokeWeakMap.get(removedNode);
                // 저장된 revoke 함수들을 실행하여 자원을 해제
                Object.values(revokes).forEach(revoke => revoke());
            }
        });
    });
});

// body 내에서 하위 트리의 변경 사항(childList)을 감시
_observer.observe(document.body, { childList: true, subtree: true });

// input 요소 배열에서 체크된 값들을 반환하는 함수
const _getCheckedValues = (inputElementArray) => {
    var checked = inputElementArray.filter(input => input.checked).map(input => input.value);
    return (checked.length === 1) ? checked[0] : checked;
}

// input 요소에 새로운 값을 설정하고 'input' 이벤트를 발생시키는 함수
const _setValue = (inputElement, value) => {
    inputElement.value = value;
    _dispatchInputEvent(inputElement);
}

// 여러 input 요소의 체크 상태를 값에 따라 설정하고, 'input' 이벤트를 발생시키는 함수
const _setInputChecked = (inputElementArray, ...values) => {
    inputElementArray.forEach(input => {
        if (values.includes(input.value)) input.checked = true;
        else input.checked = false;
        _dispatchInputEvent(input);
    });
    return true;
}

// input 요소에 'input' 이벤트를 강제로 디스패치하는 함수
const _dispatchInputEvent = (inputElement) => {
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
}

// setter 함수는 target 객체의 특정 프로퍼티 값 변경을 처리하며, input의 체크 상태나 값을 설정
const setter = (target, prop, newValue, receiver, recordProxy) => {
    var returnValue = false;
    switch (prop) {
        case "value":
            // input 타입이 radio나 checkbox인 경우 처리
            if (target.tagName === "INPUT" && (target.type === "radio" || target.type === "checkbox")) {
                returnValue = _setInputChecked(target.element, ...newValue);
            } else {
                target.element.forEach(input => {
                    _setValue(input, newValue);
                });
                returnValue = true;
            }
            break;
        case "disabled":
            // disabled 속성을 설정
            target.element.forEach(input => input.disabled = (newValue ? true : false));
            returnValue = true;
            break;
    }
    // 변경 사항을 외부에 알림
    recordProxy.dispatch({
        target,
        prop,
        newValue,
        receiver,
        recordProxy
    });
    return returnValue;
}

// getter 함수는 target 객체의 특정 프로퍼티 값을 조회하며, input 요소의 체크 상태나 값을 반환
const getter = (target, prop, receiver, recordProxy) => {
    switch (prop) {
        case "value":
            if (target.tagName === "INPUT" && (target.type === "radio" || target.type === "checkbox")) {
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

// test2 함수는 입력 필드들의 상태를 관리하는 프록시 객체를 생성하고 이벤트를 처리
function test2(element, keyAttribute, getHandlers, setHandlers) {
    var _getHandlers = [getter, ...getHandlers]; // getter 체인
    var _setHandlers = [setter, ...setHandlers]; // setter 체인

    // keyAttribute에 따라 입력 요소들을 그룹화
    var composition = Array.from(element.querySelectorAll(`[${keyAttribute}]`))
        .reduce((acc, cur) => {
            var key = cur.getAttribute(keyAttribute);
            if (key in acc) {
                if (acc[key]["type"] !== cur.type || acc[key]["tagName"] !== cur.tagName) throw new Error("must be same type.");
                acc[key]["element"] = [...acc[key]["element"], cur];
            } else {
                acc[key] = {
                    key,
                    type: cur.type,
                    tagName: cur.tagName,
                    element: [cur],
                }
            }
            return acc;
        }, {});

    // 각 그룹에 대해 Proxy를 생성하고, getter/setter 체인을 적용
    composition = Object.entries(composition).reduce((acc, cur) => {
        var revocableProxy = Proxy.revocable(cur[1], {
            _getHandlerChain(target, prop, receiver) {
                var t = _getHandlers.reduce((acc, handler) => {
                    var result = handler(target, prop, receiver, recordProxy);
                    if (!acc) acc = result;
                    return acc;
                }, null);
                return t;
            },
            _setHandlerChain(target, prop, newValue, receiver) {
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
        });
        Object.defineProperty(acc["proxies"], cur[0], {
            writable: false,
            configurable: false,
            enumerable: true,
            value: revocableProxy.proxy
        });
        acc["revokes"][cur[0]] = revocableProxy.revoke;
        return acc;
    }, {
        proxies: {},
        revokes: {}
    });

    var recordProxy = composition.proxies;
    let eventListeners = [];

    // 입력 리스너를 추가하는 메서드를 Proxy 객체에 정의
    Object.defineProperty(recordProxy, "addInputListener", {
        value: function (listener) {
            eventListeners.push(listener);
            return () => {
                eventListeners = eventListeners.filter(l => l !== listener);
                listener = null;
            }
        }
    });

    // 이벤트를 디스패치하는 메서드를 Proxy 객체에 정의
    Object.defineProperty(recordProxy, "dispatch", {
        value: function (event) {
            eventListeners.forEach(l => l(recordProxy, event));
        }
    });

    // input 이벤트 핸들러를 추가하여, 값이 변경될 때 이를 디스패치
    const eventHandler = function (event) {
        recordProxy.dispatch({
            target: {
                key: event.target.getAttribute(keyAttribute),
                type: event.target.type,
                tagName: event.target.tagName,
                element: [event.target]
            },
            prop: "value",
            newValue: event.target.value
        });
    };
    element.addEventListener("input", eventHandler);

    // eventHandler를 제거하는 함수도 WeakMap에 저장하여 나중에 해제 가능하도록 함
    composition.revokes["eventHandler"] = () => {
        console.debug("event listener removed");
        element.removeEventListener("input", eventHandler);
        eventListeners.forEach((e, i) => eventListeners[i] = null);
        eventListeners = null;
    };
    revokeWeakMap.set(element, composition.revokes);
    return recordProxy;
    
} // end of test2();