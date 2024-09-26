document.querySelector("#printAjaxData").addEventListener("click", function () {
    var dataOut = document.querySelector("#dataOut");
    async.data.then(data => {
        dataOut.innerHTML = data.ajaxData.map(d => d.desc);
    })
    
});