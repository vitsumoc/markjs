(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.piu = {})))
}(this, (function(exports) {
	'use strict'

	//原生js的引入真的让人很头痛啊
	document.write("<script type='text/javascript' src='./piu/src/settings.js'></script>")
	document.write("<script type='text/javascript' src='./piu/src/tools.js'></script>")
	document.write("<script type='text/javascript' src='./piu/src/drag.js'></script>")
	document.write("<script type='text/javascript' src='./piu/src/point.js'></script>")
	document.write("<script type='text/javascript' src='./piu/src/line.js'></script>")
	document.write("<script type='text/javascript' src='./piu/src/polygon.js'></script>")
	document.write("<script type='text/javascript' src='./piu/src/piu_ob.js'></script>")

	//外部接口	创建piu对象
	exports.init = init

	//初始化piu对象
	function init(dom) {
		if (!dom) {
			throw new Error('没有指定元素')
		}
		var piu = new PIU(dom)
		return piu
	}

})));
