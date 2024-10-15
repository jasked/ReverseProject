// 判断是否按下F12  onkeydown事件
/*
提示： 与 onkeydown 事件相关联的事件触发次序:
onkeydown
onkeypress
onkeyup
*/

// F12的键码为 123，可以直接全局搜索 keyCode == 123, == 123 ,keyCode
document.onkeydown = function() {
    if (window.event && window.event.keyCode == 123) {
        // 改变键码
        event.keyCode = 0;
        event.returnValue = false;
        // 监听到F12被按下直接关闭窗口
        window.close();
        window.location = "about:blank";
    }
}
;
// 监听鼠标右键是否被按下方法 1， oncontextmenu事件
document.oncontextmenu = function () { return false; };

// 监听鼠标右键是否被按下方法 2，onmousedown事件
document.onmousedown = function(evt){
    // button属性是2 就代表是鼠标右键
    if(evt.button == 2){
        alert('监听到鼠标右键被按下')
        evt.preventDefault() // 该方法将通知 Web 浏览器不要执行与事件关联的默认动作
        return false;
    }
}

// 监听用户工具栏调起开发者工具，判断浏览器的可视高度和宽度是否有改变，有改变则处理，
// 判断是否开了开发者工具不太合理。
var h = window.innerHeight, w = window.innerWidth;
window.onresize = function(){
    alert('改变了窗口高度')
}

// hook代码
(function() {
    //严谨模式 检查所有错误
    'use strict';
    // hook 鼠标选择
    Object.defineProperty(document, 'onselectstart', {
		set: function(val) {
			console.log('Hook捕获到选中设置->', val);
			return val;
		}
      });
	// hook 鼠标右键
	Object.defineProperty(document,'oncontextmenu',{
		set:function(evt){
			console.log("检测到右键点击");
			return evt
		}
	});
})();
