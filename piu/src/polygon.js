//多边形的创建事件
function PolygonAction(piu) {
	this.piu = piu
	this.position = null	//当前鼠标点
	this.points = []
	//改变鼠标样式
	this.piu._svg.style.cursor = 'crosshair'
	//预览容器
	this._dom = document.createElementNS("http://www.w3.org/2000/svg", "g")
	this.piu._svg.appendChild(this._dom)
	//判断当前鼠标是否吸附已存在的点
	this.near_existing = -1	//如果靠近已经存在的点，则标记该点的index，否则标记-1
	//开始
	this.next()
}

var PolygonActionProto = PolygonAction.prototype

PolygonActionProto.next = function() {
	//前进步骤
	if (this.points.length == 0) {
		this.piu.emit('message', '左键：创建第一点	右键/Esc：取消操作')
		//最初，创建一个预览的点
		this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
	} else {
		if (this.points.length <= 2) {	//小于三个点的时候，无法闭合成为区域
			this.piu.emit('message', '左键：创建下一点	右键：回到上一点	Esc：取消操作')
		} else {
			this.piu.emit('message', '左键：创建下一点	(Enter/点击起点)：闭合	右键：回到上一点	Esc：取消操作')
		}
		//已经有了第一个节点，需要创建线段和下一个节点的预览
		this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "line"))
		this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
		
		//执行一次render，可以判断吸附
		this.render()
	}
}

PolygonActionProto.goback = function() {
	//回退步骤
	if (this.points.length == 0) {
		this.cancel()
	} else {
		this.points.splice(this.points.length - 1, 1)	//删除最后一项
		//删除多余的预览
		this._dom.removeChild(this._dom.lastChild)
		this._dom.removeChild(this._dom.lastChild)
		if (this.points.length == 1) {
			this.piu.emit('message', '左键：创建第一点	右键/Esc：取消操作')
		} else if (this.step == 2) {
			this.piu.emit('message', '左键：创建下一点	右键：回到上一点	Esc：取消操作')
		} else {
			this.piu.emit('message', '左键：创建下一点	(Enter/点击起点)：闭合	右键：回到上一点	Esc：取消操作')
		}
	}
	this.render()
}

PolygonActionProto.onMouseDown = function(mouse) {
	if (this.near_existing < 0) {
		//不吸附，直接取鼠标点
		this.points.push(mouse)
		this.next()
	} else if (this.near_existing == 0) {
		//点击起点时，如果当前点数已经足够，则闭合
		if (this.points.length >= 3) {
			this.done()
		}
	} else {
		//如果吸附的不是最后一点，则吸附上去就好了
		if (this.near_existing != this.points.length - 1) {
			this.points.push({x: this.points[this.near_existing].x, y: this.points[this.near_existing].y})
			this.next()
		}
		//如果点击的是最后一点，则不操作，因为不允许存在重复点
	}
}

PolygonActionProto.onMouseMove = function(mouse) {
	this.position = mouse
	//更新预览
	this.render()
}

PolygonActionProto.onMouseRight = function() {
	//右键取消创建
	this.goback()
}

PolygonActionProto.onKeyDown = function(ev) {
	//Enter键，如果已经存在三个点，则闭合
	if (ev.keyCode == 13 && this.points.length >= 3) {
		this.done()
	}
	//esc取消创建
	if (ev.keyCode == 27) {
		this.cancel()
	}
}

PolygonActionProto.done = function() {
	this.piu.emit('message', '创建多边形')
	//创建线段
	new Polygon(this.piu, this.piu.color(), this.points)
	//结束
	this.end()
}

PolygonActionProto.cancel = function() {
	this.piu.emit('message', '取消操作')
	this.end()
}

PolygonActionProto.end = function() {
	this.piu._svg.style.cursor = 'default'
	//销毁预览
	this.piu._svg.removeChild(this._dom)
	this.piu.removeAction(this)
}

PolygonActionProto.render = function() {
	var r = calRadius(this.piu)	//数值半径
	var lw = calLineWidth(this.piu)	//数值线宽
	for (var x in this.points) {
		//绘制已经存在的点
		var p = this._dom.children[2 * x]
		p.setAttribute('cx', this.points[x].x)
		p.setAttribute('cy', this.points[x].y)
		p.setAttribute('r', r)
		p.setAttribute('fill', this.piu.color())
		//绘制已经存在的连线
		if (x > 0) {
			var line = this._dom.children[2 * x - 1]
			line.setAttribute('x1', this.points[x - 1].x)
			line.setAttribute('y1', this.points[x - 1].y)
			line.setAttribute('x2', this.points[x].x)
			line.setAttribute('y2', this.points[x].y)
			line.setAttribute('stroke', this.piu.color())
			line.setAttribute('stroke-width', lw)
		}
	}
	//绘制当前鼠标位置和上一点的连线
	if (this.points.length > 0) {
		var line = this._dom.children[this._dom.children.length - 2]	//倒数第二个dom对象是动态连线
		line.setAttribute('x1', this.points[this.points.length - 1].x)	//一端在最后一点，另一端跟随当前鼠标
		line.setAttribute('y1', this.points[this.points.length - 1].y)
		line.setAttribute('x2', this.position.x)
		line.setAttribute('y2', this.position.y)
		line.setAttribute('stroke', this.piu.color())
		line.setAttribute('stroke-width', lw)
	}
	//绘制当前鼠标所在的点
	var p = this._dom.children[this._dom.children.length - 1]	//当前点是最后一个dom对象
	p.setAttribute('cx', this.position.x)
	p.setAttribute('cy', this.position.y)
	p.setAttribute('r', r)
	p.setAttribute('fill', this.piu.color())
	
	//进行点的吸附判断
	var isNear = false
	for (var x in this.points) {
		var point = this.points[x]
		//如果当前鼠标在某个点的范围内，则形成吸附动作
		if (Math.abs(this.position.x - point.x) < r &&
			Math.abs(this.position.y - point.y) < r) {
				//吸附到该点就好
				this.near_existing = x				
				isNear = true
				break
			}
	}
	if (isNear) {
		//最后一个点隐藏掉
		p.setAttribute('fill', 'rgba(0, 0, 0, 0)')
		//预览的线条也给拉直咯
		var line = this._dom.children[this._dom.children.length - 2]	//倒数第二个dom对象是动态连线
		line.setAttribute('x2', this.points[this.near_existing].x)
		line.setAttribute('y2', this.points[this.near_existing].y)
	} else {
		this.near_existing = -1
	}
}

//多边形数据对象
function Polygon(piu, color, points) {
	this.piu = null
	this._dom = null
	this.select_dom = []
	this.points = null
	this._color = null
	this._data = {}
	if (piu) {	//自动创建
		this.piu = piu
		this._color = color
		this.points = points
		this.init()
		this.piu.polygon.push(this)
	}
}

var polygonProto = Polygon.prototype

polygonProto.init = function() {
	//初始化多边形的dom元素
	this._dom = document.createElementNS("http://www.w3.org/2000/svg", "g")
	for (var x = 0; x < this.points.length; x++) {
		this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "line"))
	}
	this.piu._svg.appendChild(this._dom)
	//编辑用的点点
	this.select_dom = document.createElementNS("http://www.w3.org/2000/svg", "g")
	for (var x = 0; x < this.points.length; x++) {
		this.select_dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
	}
	this.init_event()	//给dom元素绑定事件
	this.render()	//确定大小
}

polygonProto.init_event = function() {
	var self = this
	//左键单击选中	ctrl多选		选中后直接开启位移事件
	this._dom.addEventListener('mousedown', function(ev) {
		if (ev.button == 0) {
			//ev.stopPropagation()
			if (ev.ctrlKey) {
				self.piu.addSelect(self)
			} else {
				self.piu.setSelect(self)
			}
			//选中对象，开启拖动事件
			self.piu.setAction(new ObDragAction(self.piu))
			//然后直接冒泡下去
		}
	})
	for (var x = 0; x < this.select_dom.children.length; x++) {
		(function(x) {
			//定位点被单击时	需要响应定位点位移事件
			self.select_dom.children[x].addEventListener('mousedown', function(ev) {
				if (ev.button == 0) {
					self.piu.setAction(new ObPointDragAction(self.piu, self, x, mouseToSvg(ev, self.piu)))
					ev.stopPropagation()	//阻止冒泡到dom
				}
			})
		})(x)
	}
}

polygonProto.setSelect = function(selected) {
	//当自己处于选中状态时，做出反应，反之取消
	if (selected) {
		this._dom.appendChild(this.select_dom)
	} else {
		this._dom.removeChild(this.select_dom)
	}
}

//位移
polygonProto.move = function(vector) {
	for (var x in this.points) {
		this.points[x].x = this.points[x].x + vector.x
		this.points[x].y = this.points[x].y + vector.y
	}
	this.render()
}

//指定节点位移
polygonProto.movePoint = function(vector, index) {
	this.points[index].x = this.points[index].x + vector.x
	this.points[index].y = this.points[index].y + vector.y
	this.render()
}

polygonProto.render = function() {
	//处理第一条线
	this._dom.children[0].setAttribute('x1', this.points[0].x)
	this._dom.children[0].setAttribute('y1', this.points[0].y)
	this._dom.children[0].setAttribute('x2', this.points[this.points.length - 1].x)
	this._dom.children[0].setAttribute('y2', this.points[this.points.length - 1].y)
	this._dom.children[0].setAttribute('stroke', this._color)
	this._dom.children[0].setAttribute('stroke-width', calLineWidth(this.piu))
	//处理其它的线
	for (var x = 1; x < this.points.length; x++) {
		this._dom.children[x].setAttribute('x1', this.points[x].x)
		this._dom.children[x].setAttribute('y1', this.points[x].y)
		this._dom.children[x].setAttribute('x2', this.points[x - 1].x)
		this._dom.children[x].setAttribute('y2', this.points[x - 1].y)
		this._dom.children[x].setAttribute('stroke', this._color)
		this._dom.children[x].setAttribute('stroke-width', calLineWidth(this.piu))
	}
	
	//处理辅助节点
	for (var x in this.points) {
		var p = this.select_dom.children[x]
		p.setAttribute('cx', this.points[x].x)
		p.setAttribute('cy', this.points[x].y)
		p.setAttribute('r', calRadius(this.piu))
		p.setAttribute('fill', this._color)
	}
}

polygonProto.color = function(color) {
	if (color) {
		this._color = color
	}
	return this._color
}

polygonProto.data = function(data) {
	if (data) {
		this._data = data
	}
	return this._data
}

polygonProto.destory = function() {
	//解除全局对所有对象的引用	避免出现删除后又编辑自己的空指针问题
	this.piu.clearSelect()
	//删除自己的dom元素
	this.piu._svg.removeChild(this._dom)
	//删除自己的引用
	this.piu.polygon.splice(this.piu.polygon.indexOf(this), 1)
}