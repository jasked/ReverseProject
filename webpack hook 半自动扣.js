//在加载器后面下断点  执行下面代码
// 这里的f 替换成需要导出的函数名
window.zhiyuan = f;
window.wbpk_ = "";
window.isz = false;
f = function(r){
	if(window.isz)
	{
        // e[r]里的e 是加载器里的call那里
		window.wbpk_ = window.wbpk_ + r.toString()+":"+(e[r]+"")+ ",";
	}
	return window.zhiyuan(r);
}

//在你要的方法加载前下断点 执行 window.isz=true
//在你要的方法运行后代码处下断点  执行 window.wbpk_  拿到所有代码  注意后面有个逗号

function o(t) {

    if (n[t])
        return n[t].exports;
    var i = n[t] = {
        i: t,
        l: !1,
        exports: {}
    };
    console.log("被调用的 >>> ", e[t].toString());
    //  这里进行拼接，bb变量需要在全局定义一下
    // t 是模块名， e[t] 是模块对应的函数， 也就是key：value形式
    bb += `"${t}":${e[t].toString()},`
    return e[t].call(i.exports, i, i.exports, o),
    i.l = !0,
    i.exports
}
bz = o;
//如果只是调用模块，不用模块里面的方法, 那么直接获取调用模块的时候所有加载过的模块，进行拼接
