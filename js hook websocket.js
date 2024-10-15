 // 1、webcoket 一般都是json数据格式传输，那么发生之前需要JSON.stringify
var my_stringify = JSON.stringify;
JSON.stringify = function (params) {
    //这里可以添加其他逻辑比如 debugger
    console.log("json_stringify params:",params);
    return my_stringify(params);
};

var my_parse = JSON.parse;
JSON.parse = function (params) {
    //这里可以添加其他逻辑比如 debugger
    console.log("json_parse params:",params);
    return my_parse(params);
};

// 2  webScoket 绑定在windows对象，上，根据浏览器的不同，websokcet名字可能不一样
//chrome window.WebSocket  firfox window.MozWebSocket;
window._WebSocket = window.WebSocket;

// hook send
window._WebSocket.prototype.send = function (data) {
    console.info("Hook WebSocket", data);
    return this.send(data)
}

Object.defineProperty(window, "WebSocket",{value: WebSocket})
