(function() {
    'use strict'
   var _createElement = document.createElement.bind(document);
   document.createElement = function(elm){
   // 这里做判断 是否创建了script这个元素
   if(elm == 'body'){
        debugger;
   }
    return _createElement(elm);
}
})();
//之前我不知道我用的是 var _createElement = document.createElement 导致一直报错 Uncaught TypeError: Illegal invocation
//原来是需要绑定一下对象 var _createElement = document.createElement.bind(document);
