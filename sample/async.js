export async function ajax () {
    var value = await new Promise ((resolve, reject) => {
        $.ajax({
            url: "/es6/file.txt"
        }).done(res => {
            resolve(res);
        }).fail(err => {
            reject(err);
        });
    });

    console.log(value);
    
}