var getHandlers = [];
var setHandlers2 = [];
var listener = (recordProxy, event) => {
    var {target, prop, newValue} = event;
    if (target.key === "status") {
        recordProxy.custNm.disabled = (newValue === "01");
    }
}
var listener2 = (recordProxy, event) => {
    var {target, prop, newValue} = event;
    if (target.key === "age") {
        target.element.forEach(input => {
            Array.from(input.closest("td").querySelectorAll(".error")).forEach(err=>err.remove());
            if (input.value !== "" && !/^\d{1,}$/.test(input.value)) {
                var error = document.createElement("p");
                error.classList.add("error");
                error.innerText = "number only";
                input.closest("td").appendChild(error);
            }
        });
        
    }
}
Array.from(document.querySelectorAll("tr")).forEach(tr=>{
    var t2 = test2(tr, "data-name", getHandlers, setHandlers2);
    var unsubscribe = t2.addInputListener(listener);
    var unsubscribe2 = t2.addInputListener(listener2);
    tr["_proxy"]= t2;
})