//线段的创建事件
function LineAction(piu) {
	this.piu = piu
	this.position = null
	this.points = []
	this.step = 0
	//改变鼠标样式
	this.piu._svg.style.cursor = 'crosshair'
	//预览容器
	this._dom = document.createElementNS("http://www.w3.org/2000/svg", "g")
	this.piu._svg.appendChild(this._dom)
	//开始
	this.next()
}

var LineActionProto = LineAction.prototype

LineActionProto.next = function() {
	//前进步骤
	if (this.step == 0) {
		this.piu.emit('message', '左键：创建第一点	右键/Esc：取消操作')
		//最初，创建一个预览的点
		this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
	} else if (this.step == 1) {
		this.piu.emit('message', '左键：创建第二点	右键：回到上一点	Esc：取消操作')
		//已经有了第一个节点，需要创建线段和第二个节点的预览
		this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "line"))
		this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
	} else if (this.step == 2) {
		//完全拥有了两个节点，可以完成创建
		this.done()
	}
	this.step += 1
}

LineActionProto.goback = function() {
	//回退步骤
	if (this.step == 1) {
		this.cancel()
	} else if (this.step == 2) {
		this.piu.emit('message', '左键：创建第一点	右键/Esc：取消操作')
		//删除多余的预览
		this._dom.removeChild(this._dom.lastChild)
		this._dom.removeChild(this._dom.lastChild)
	}
	this.step -= 1
	this.render()
}

LineActionProto.onMouseDown = function(mouse) {
	this.points.push(mouse)
	this.next()
}

LineActionProto.onMouseMove = function(mouse) {
	this.position = mouse
	//更新预览
	this.render()
}

LineActionProto.onMouseRight = function() {
	//右键取消创建
	this.goback()
}

LineActionProto.onKeyDown = function(ev) {
	//esc取消创建
	if (ev.keyCode == 27) {
		this.cancel()
	}
}

LineActionProto.done = function() {
	this.piu.emit('message', '创建线段')
	//创建线段
	new Line(this.piu, this.piu.color(), this.points)
	//结束
	this.end()
}

LineActionProto.cancel = function() {
	this.piu.emit('message', '取消操作')
	this.end()
}

LineActionProto.end = function() {
	this.piu._svg.style.cursor = 'default'
	//销毁预览
	this.piu._svg.removeChild(this._dom)
	this.piu.removeAction(this)
}

LineActionProto.render = function() {
	if (this.step == 1) {
		//设置第一点的位置，大小，颜色
		var p = this._dom.firstChild
		p.setAttribute('cx', this.position.x)
		p.setAttribute('cy', this.position.y)
		p.setAttribute('r', calRadius(this.piu))
		p.setAttribute('fill', this.piu.color())
	} else if (this.step == 2) {
		var p1 = this._dom.children[0]
		p1.setAttribute('cx', this.points[0].x)
		p1.setAttribute('cy', this.points[0].y)
		p1.setAttribute('r', calRadius(this.piu))
		p1.setAttribute('fill', this.piu.color())
		var line = this._dom.children[1]
		line.setAttribute('x1', this.points[0].x)
		line.setAttribute('y1', this.points[0].y)
		line.setAttribute('x2', this.position.x)
		line.setAttribute('y2', this.position.y)
		line.setAttribute('stroke', this.piu.color())
		line.setAttribute('stroke-width', calLineWidth(this.piu))
		var p2 = this._dom.children[2]
		p2.setAttribute('cx', this.position.x)
		p2.setAttribute('cy', this.position.y)
		p2.setAttribute('r', calRadius(this.piu))
		p2.setAttribute('fill', this.piu.color())
	}
}

//线段数据对象
function Line(piu, color, points) {
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
		this.piu.line.push(this)
	}
}

var lineProto = Line.prototype

lineProto.init = function() {
	//初始化线段的dom元素
	this._dom = document.createElementNS("http://www.w3.org/2000/svg", "g")
	this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "line"))
	this.piu._svg.appendChild(this._dom)
	this.select_dom = document.createElementNS("http://www.w3.org/2000/svg", "g")
	this.select_dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
	this.select_dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
	this.init_event()	//给dom元素绑定事件
	this.render()	//确定大小
}

lineProto.init_event = function() {
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

lineProto.setSelect = function(selected) {
	//当自己处于选中状态时，做出反应，反之取消
	if (selected) {
		this._dom.appendChild(this.select_dom)
	} else {
		this._dom.removeChild(this.select_dom)
	}
}

//位移
lineProto.move = function(vector) {
	for (var x in this.points) {
		this.points[x].x = this.points[x].x + vector.x
		this.points[x].y = this.points[x].y + vector.y
	}
	this.render()
}

//指定节点位移
lineProto.movePoint = function(vector, index) {
	this.points[index].x = this.points[index].x + vector.x
	this.points[index].y = this.points[index].y + vector.y
	this.render()
}

lineProto.render = function() {
	this._dom.children[0].setAttribute('x1', this.points[0].x)
	this._dom.children[0].setAttribute('y1', this.points[0].y)
	this._dom.children[0].setAttribute('x2', this.points[1].x)
	this._dom.children[0].setAttribute('y2', this.points[1].y)
	this._dom.children[0].setAttribute('stroke', this._color)
	this._dom.children[0].setAttribute('stroke-width', calLineWidth(this.piu))
	
	var p1 = this.select_dom.children[0]
	p1.setAttribute('cx', this.points[0].x)
	p1.setAttribute('cy', this.points[0].y)
	p1.setAttribute('r', calRadius(this.piu))
	p1.setAttribute('fill', this._color)
	var p2 = this.select_dom.children[1]
	p2.setAttribute('cx', this.points[1].x)
	p2.setAttribute('cy', this.points[1].y)
	p2.setAttribute('r', calRadius(this.piu))
	p2.setAttribute('fill', this._color)
}

lineProto.color = function(color) {
	if (color) {
		this._color = color
	}
	return this._color
}

lineProto.data = function(data) {
	if (data) {
		this._data = data
	}
	return this._data
}

lineProto.destory = function() {
	//解除全局对所有对象的引用	避免出现删除后又编辑自己的空指针问题
	this.piu.clearSelect()
	//删除自己的dom元素
	this.piu._svg.removeChild(this._dom)
	//删除自己的引用
	this.piu.line.splice(this.piu.line.indexOf(this), 1)
}