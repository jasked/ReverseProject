// 函数1（不是万能的 有些时候hook不到 自己插入debugger）

var cookie_cache = document.cookie;

Object.defineProperty(document, 'cookie', {
    get: function() {
        console.log('Getting cookie');
        return cookie_cache;
    },
    set: function(val) {
        console.log("Seting cookie",val);
        var cookie = val.split(";")[0];
        var ncookie = cookie.split("=");
        var flag = false;
        var cache = cookie_cache.split("; ");
        cache = cache.map(function(a){
            if (a.split("=")[0] === ncookie[0]){
                flag = true;
                return cookie;
            }
            return a;
        })
    }
})


// 函数2

var code = function(){
    var org = document.cookie.__lookupSetter__('cookie');
    document.__defineSetter__("cookie",function(cookie){
        if(cookie.indexOf('TSdc75a61a')>-1){
            debugger;
        }
        org = cookie;
    });
    document.__defineGetter__("cookie",function(){return org;});
}
var script = document.createElement('script');
script.textContent = '(' + code + ')()';
(document.head||document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

// 当cookie中匹配到了 TSdc75a61a， 则插入断点。
