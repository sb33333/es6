export const data = (() => {
    return new Promise ((resolve, reject) => {
        $.ajax({
            url: "/static/json.txt"
        }).done(res => {
            resolve(res);
        }).fail(err => {
            reject(err);
        });
    }).then(res => JSON.parse(res));
})();