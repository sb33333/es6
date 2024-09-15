export async function ajax () {
    var value = await new Promise ((resolve, reject) => {
        $.ajax({
            url: "/file.txt"
        }).done(res => {
            resolve(res);
        }).fail(err => {
            reject(err);
        });
    });

    value = JSON.parse(value);
    console.log(value);
}