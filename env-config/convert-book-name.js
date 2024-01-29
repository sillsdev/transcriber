var fs = require('fs');
var books = require('./book-es.json');
var spanFile = fs.readFileSync('./es-name.txt');
var span = spanFile.toString();

var spanArr = span.split('\n').map(function (item) {
    return item.split('\t').map(function (item) {
        return item.trim();
    });
});

function getSpan(code) {
    for (var i = 0; i < spanArr.length; i++) {
        if (spanArr[i][0] === `Book.${code}`) {
            return spanArr[i][2];
        }
    }
    return null;
}

var result = books.map(function (item) {
    var shortMat = /^([1-5]?\s?[^()]+)/.exec(getSpan(item.code));
    // console.log(shortMat)

    return {
        code: item.code,
        short: shortMat? shortMat[1].trim(): getSpan(item.code),
        long: getSpan(item.code)
    };  
});

console.log(JSON.stringify(result, null, 2));
fs.writeFileSync('./es-book.json', JSON.stringify(result));