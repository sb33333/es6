document.querySelector("#printAjaxData").addEventListener("click", function () {
    var dataOut = document.querySelector("#dataOut");
    async.data.then(data => {
        dataOut.innerHTML = data.ajaxData.map(d => d.desc);
    });
});

document.querySelector("#printAjaxData2").addEventListener("click", function() {
    var dataOut = document.querySelector("#dataOut2");
    $.ajax({
        url: "./static/json.txt"
    }).done(function(res) {
        dataOut.innerHTML = JSON.parse(res).ajaxData.map(d => d.desc);
    });
});