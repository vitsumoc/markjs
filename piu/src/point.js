//点的创建事件
function PointAction(piu) {
	this.piu = piu
	this.position = {}
	this.piu._svg.style.cursor = 'crosshair'
	//创建提示
	this.piu.emit('message', '左键：创建标注点	右键/Esc：取消操作')
	//创建一个预览的点
	this._dom = document.createElementNS("http://www.w3.org/2000/svg", "circle")
	this.piu._svg.appendChild(this._dom)
}

var PointActionProto = PointAction.prototype

PointActionProto.onMouseDown = function(mouse) {
	this.position = mouse
	this.done()
}

PointActionProto.onMouseMove = function(mouse) {
	//预览位置
	this.position = mouse
	this.render()
}

PointActionProto.onMouseRight = function() {
	//右键取消创建
	this.cancel()
}

PointActionProto.onKeyDown = function(ev) {
	//esc取消创建
	if (ev.keyCode == 27) {
		this.cancel()
	}
}

PointActionProto.done = function() {
	this.piu.emit('message', '创建标注点')
	//创建数据点
	new Point(this.piu, this.piu.color(), this.position)
	//结束
	this.end()
}

PointActionProto.cancel = function() {
	this.piu.emit('message', '取消操作')
	this.end()
}

PointActionProto.end = function() {
	this.piu._svg.style.cursor = 'default'
	//销毁预览
	this.piu._svg.removeChild(this._dom)
	this.piu.removeAction(this)
}

PointActionProto.render = function() {
	//展示预览的位置
	this._dom.setAttribute('cx', this.position.x)
	this._dom.setAttribute('cy', this.position.y)
	//计算预览的展示比例
	this._dom.setAttribute('r', calRadius(this.piu))
	this._dom.setAttribute('fill', this.piu.color())
}

//点数据对象
function Point(piu, color, position) {
	this.piu = null
	this._dom = null
	this.select_dom = null
	this.position = null
	this._color = null
	this._data = {}
	if (piu) {	//自动创建
		this.piu = piu
		this._color = color
		this.position = position
		this.init()
		this.piu.point.push(this)
	}
}

var pointProto = Point.prototype

pointProto.init = function() {
	//初始化一个点时，创建dom
	this._dom = document.createElementNS("http://www.w3.org/2000/svg", "g")
	this._dom.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
	this.piu._svg.appendChild(this._dom)
	this.select_dom = document.createElementNS("http://www.w3.org/2000/svg", "rect")
	this.init_event()	//给dom元素绑定事件
	this.render()	//确定大小
}

pointProto.init_event = function() {
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
}

pointProto.setSelect = function(selected) {
	//当自己处于选中状态时，做出反应，反之取消
	if (selected) {
		this._dom.appendChild(this.select_dom)
	} else {
		this._dom.removeChild(this.select_dom)
	}
}

pointProto.getBorder = function() {
	//计算并返回自己的边框尺寸
	var radius = Number(this._dom.children[0].getAttribute('r'))
	return {
		x: this.position.x - radius,
		y: this.position.y - radius,
		width: 2 * radius,
		height: 2* radius
	}
}

//位移
pointProto.move = function(vector) {
	this.position.x = this.position.x + vector.x
	this.position.y = this.position.y + vector.y
	this.render()
}


pointProto.render = function() {
	this._dom.children[0].setAttribute('cx', this.position.x)
	this._dom.children[0].setAttribute('cy', this.position.y)
	this._dom.children[0].setAttribute('r', calRadius(this.piu))
	this._dom.setAttribute('fill', this._color)
	
	var rect = this.getBorder()
	this.select_dom.setAttribute("x", rect.x)
	this.select_dom.setAttribute("y", rect.y)
	this.select_dom.setAttribute("width", rect.width)
	this.select_dom.setAttribute("height", rect.height)		
	this.select_dom.setAttribute("stroke-width", calSelectLineWidth(this.piu))
	this.select_dom.setAttribute("stroke-dasharray", PIU_SETTINGS.SELECT_BOX_DASHARRAY)
	this.select_dom.setAttribute("stroke", this._color)
	this.select_dom.setAttribute("fill", "rgba(0, 0, 0, 0)")
}

pointProto.color = function(color) {
	if (color) {
		this._color = color
	}
	return this._color
}

pointProto.data = function(data) {
	if (data) {
		this._data = data
	}
	return this._data
}

pointProto.destory = function() {
	//解除全局对所有对象的引用	避免出现删除后又编辑自己的空指针问题
	this.piu.clearSelect()
	//删除自己的dom元素
	this.piu._svg.removeChild(this._dom)
	//删除自己的引用
	this.piu.point.splice(this.piu.point.indexOf(this), 1)
}