(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
		(factory((global.piu = {})))
}(this, (function(exports) {
	'use strict'

	//参数对象
	const PIU_SETTINGS = {
		COLOR: '#FFFFFF',	//默认绘图颜色
		IMAGE_TIMEOUT: 10,	//图片加载超时时间(秒)
		POINT_SHOW_SIZE: 6,	//点位在屏幕上展示的半径(像素值)
		LINE_SHOW_SIZE: 3,	//线条在屏幕上展示的宽度(像素值)
		SELECT_LINE_SHOW_SIZE: 1,	//表示对象选中状态的线条粗细(像素值)
		SELECT_BOX_DASHARRAY: "2, 2"	//选择框虚线密度
	}
	//将page上的坐标，映射为svg的坐标系
	function mouseToSvg(ev, piu) {
		var pageX = ev.pageX
		var pageY = ev.pageY
		var offsetX = pageX - piu._svg.getBoundingClientRect().x
		var offsetY = pageY - piu._svg.getBoundingClientRect().y
		return offsetToSvg({x: offsetX, y: offsetY}, piu)
	}
	
	//将鼠标点映射到svg上的坐标
	function offsetToSvg(p, piu) {
		var offsetX = p.x
		var svgWidth = piu._svg.clientWidth
		var svgBaseX = piu._svg.viewBox.baseVal.x
		var svgViewWidth = piu._svg.viewBox.baseVal.width
		var svgX = svgViewWidth * offsetX / svgWidth + svgBaseX
		
		var offsetY = p.y
		var svgHeight = piu._svg.clientHeight
		var svgBaseY = piu._svg.viewBox.baseVal.y
		var svgViewHeight = piu._svg.viewBox.baseVal.height
		var svgY = svgViewHeight * offsetY / svgHeight + svgBaseY
		return {x: svgX, y: svgY}
	}
	
	//计算在屏幕中展示点的大小
	function calRadius(piu) {
		return PIU_SETTINGS.POINT_SHOW_SIZE * piu._svg.viewBox.baseVal.width / piu._svg.clientWidth
	}
	
	//计算屏幕中展示线的粗细
	function calLineWidth(piu) {
		return PIU_SETTINGS.LINE_SHOW_SIZE * piu._svg.viewBox.baseVal.width / piu._svg.clientWidth
	}
	
	//计算选中辅助线的粗细
	function calSelectLineWidth(piu) {
		return PIU_SETTINGS.SELECT_LINE_SHOW_SIZE * piu._svg.viewBox.baseVal.width / piu._svg.clientWidth
	}
	//页面拖动事件
	function DragAction(piu) {
		this.piu = piu
		this.position = {}
	}
	
	var DragActionProto = DragAction.prototype
	
	DragActionProto.onMouseDown = function(mouse) {
		this.position = mouse
		//鼠标变手型
		this.piu._svg.style.cursor = 'move'
	}
	
	DragActionProto.onMouseMove = function(mouse) {
		//执行拖拽
		this.piu._svg.viewBox.baseVal.x -= mouse.x - this.position.x
		this.piu._svg.viewBox.baseVal.y -= mouse.y - this.position.y
	}
	
	DragActionProto.onMouseUp = function() {
		this.end()
	}
	
	DragActionProto.onMouseLeave = function() {
		this.end()
	}
	
	DragActionProto.end = function() {
		this.piu._svg.style.cursor = 'default'
		//因为没有数据层面的问题，直接丢掉引用就好了
		this.piu.removeAction(this)
	}
	
	
	//对象拖动事件
	function ObDragAction(piu) {
		this.piu = piu
		this.position = {}
	}
	
	var ObDragActionProto = ObDragAction.prototype
	
	ObDragActionProto.onMouseDown = function(mouse) {
		this.position = mouse
		//鼠标变手型
		this.piu._svg.style.cursor = 'move'
	}
	
	ObDragActionProto.onMouseMove = function(mouse) {
		//执行拖拽
		this.piu._svg.style.cursor = 'move'
		var nowPositon = mouse
		var vector = {x: nowPositon.x - this.position.x, y: nowPositon.y - this.position.y}
		//对每个已选中的对象应用位移
		for (var x in this.piu.select) {
			if (this.piu.select[x] && this.piu.select[x].move) {
				this.piu.select[x].move(vector)
			}
		}
		this.position = mouse
	}
	
	ObDragActionProto.onMouseUp = function() {
		this.end()
	}
	
	ObDragActionProto.onMouseLeave = function() {
		this.end()
	}
	
	ObDragActionProto.end = function() {
		this.piu._svg.style.cursor = 'default'
		//因为没有数据层面的问题，直接丢掉引用就好了
		this.piu.removeAction(this)
	}
	
	//骨架拖动事件
	function ObPointDragAction(piu, ob, index, mouse) {
		this.piu = piu
		this.ob = ob	//记录操作的对象
		this.index = index	//操作节点的序列号
		this.position = mouse
		this.piu._svg.style.cursor = 'move'
	}
	
	var ObPointDragActionProto = ObPointDragAction.prototype
	
	ObPointDragActionProto.onMouseMove = function(mouse) {
		//执行拖拽
		this.piu._svg.style.cursor = 'move'
		var nowPositon = mouse
		var vector = {x: nowPositon.x - this.position.x, y: nowPositon.y - this.position.y}
		//让指定对象的节点位移
		this.ob.movePoint(vector, this.index)
		this.position = mouse
	}
	
	ObPointDragActionProto.onMouseUp = function() {
		this.end()
	}
	
	ObPointDragActionProto.onMouseLeave = function() {
		this.end()
	}
	
	ObPointDragActionProto.end = function() {
		this.piu._svg.style.cursor = 'default'
		//因为没有数据层面的问题，直接丢掉引用就好了
		this.piu.removeAction(this)
	}
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
	/**
	 * @PIU模块
	 */
	function PIU(dom) {
		this._dom = dom
		//当前绘图颜色
		this._color = PIU_SETTINGS.COLOR
		//操作事件
		this._action = null	//鼠标左键事件
		this._middle_action = null	//middle事件，主要是用来拖拽画布
		//回调事件
		this.events = {} //保存触发事件
		this.emit = function(event_name, param) { //执行各类触发事件
			if (this.events[event_name]) {
				this.events[event_name](param)
			}
		}
		//业务数据
		this.point = []
		this.line = []
		this.polygon = []
		
		//选择功能
		this.select = []	//保存被选中的对象引用
		//初始化
		this.init_dom()
		this.init_event()
	}
	
	var piuProto = PIU.prototype
	
	piuProto.init_dom = function() {
		//创建svg背景
		this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
		this._dom.appendChild(this._svg)
		this._svg.style.height = '100%'
		this._svg.style.width = '100%'
		//创建图片容器
		this._image = document.createElementNS("http://www.w3.org/2000/svg", "image")
		this._svg.appendChild(this._image)
	}
	
	piuProto.init_event = function() {
		var self = this
		
		this._svg.addEventListener('mousedown', function(ev) {
			if (ev.button == 0) {
				if (!self._action) {
					//点击空白处，取消选择
					self.clearSelect()
				}
				//左键
				if (self._action && self._action.onMouseDown) {
					self._action.onMouseDown(mouseToSvg(ev, self))
				}
			} else if (ev.button == 1) {
				//开启画布拖拽
				if (!self._middle_action) {
					self._middle_action = new DragAction(self)
				}
				if (self._middle_action && self._middle_action.onMouseDown) {
					self._middle_action.onMouseDown(mouseToSvg(ev, self))
				}
			} else if (ev.button == 2) {
				if (self._action && self._action.onMouseRight) {
					self._action.onMouseRight(mouseToSvg(ev, self))
				}
			}
		})
		this._svg.addEventListener('mousemove', function(ev) {
			//因为鼠标移动不是决定性的操作，于是就两种事件共存好了
			if (self._middle_action && self._middle_action.onMouseMove) {
				self._middle_action.onMouseMove(mouseToSvg(ev, self))
			}
			if (self._action && self._action.onMouseMove) {
				self._action.onMouseMove(mouseToSvg(ev, self))
			}
		})
		this._svg.addEventListener('mouseup', function(ev) {
			if (ev.button == 1) {
				if (self._middle_action && self._middle_action.onMouseUp) {
					self._middle_action.onMouseUp(mouseToSvg(ev, self))
				}
			} else {
				if (self._action && self._action.onMouseUp) {
					self._action.onMouseUp(mouseToSvg(ev, self))
				}
			}
		})
		this._svg.addEventListener('mouseleave', function() {
			if (self._middle_action && self._middle_action.onMouseLeave) {
				self._middle_action.onMouseLeave()
			}
			if (self._action && self._action.onMouseLeave) {
				self._action.onMouseLeave()
			}
		})
		document.addEventListener("keydown", function(ev) {
			//esc键取消全部对象的选中状态
			if (ev.keyCode == 27) {
				self.clearSelect()
			}
			if (self._action && self._action.onKeyDown) {
				self._action.onKeyDown(ev)
			}
		})	
	
		//缩放
		this._svg.addEventListener('wheel', function(ev) {
			if (ev.deltaY < 0) {
				self._svg.viewBox.baseVal.height = self._svg.viewBox.baseVal.height / 1.1
				self._svg.viewBox.baseVal.width = self._svg.viewBox.baseVal.width / 1.1
			} else {
				self._svg.viewBox.baseVal.height = self._svg.viewBox.baseVal.height * 1.1
				self._svg.viewBox.baseVal.width = self._svg.viewBox.baseVal.width * 1.1
			}
			//更新所有对象的尺寸，保持固定比例
			self.resize()
		})
	}
	
	piuProto.load_image = function(url) {
		var self = this
		//首先获取网络图片的宽高
		var pic = new Image()
		pic.src = url
		//图片加载超时时间可在配置文件设置
		var timer = 0
		var timer_id = setInterval(function() {
			timer += 500
			if (timer > PIU_SETTINGS.IMAGE_TIMEOUT * 1000) {
				self.emit('message', '图片载入超时')
				self.emit('image_timeout')
				clearInterval(timer_id)
			}
			if (pic.complete) {
				if (pic.width > 0) {
					self._image.setAttribute('x', 0)
					self._image.setAttribute('y', 0)
					self._image.setAttribute('width', pic.width)
					self._image.setAttribute('height', pic.height)
					self._image.href.baseVal = url
					self._svg.viewBox.baseVal.x = 0
					self._svg.viewBox.baseVal.y = 0
					//计算svg的宽高
					var pic_wh = pic.width / pic.height
					var dom_wh = self._dom.clientWidth / self._dom.clientHeight
					if (pic_wh > dom_wh) {
						self._svg.viewBox.baseVal.width = pic.width
						self._svg.viewBox.baseVal.height = pic.width / dom_wh
					} else {
						self._svg.viewBox.baseVal.height = pic.height
						self._svg.viewBox.baseVal.width = dom_wh * pic.height
					}
					self.emit('message', '图片加载成功')
					self.emit('image_success')
				} else {
					self.emit('message', '图片加载失败')
					self.emit('image_fail')
				}
				clearInterval(timer_id)
			}
		}, 500)
	}
	
	//设置颜色
	piuProto.color = function(c) {
		if (c) {
			this._color = c
		}
		return this._color
	}
	
	//设置当前事件
	piuProto.setAction = function(action) {
		//如果替换之前的事件，则需要执行其销毁方法
		if (this._action && this._action.end) {
			this._action.end()
		}
		this._action = action
	}
	
	piuProto.removeAction = function(action) {	//事件注销
		if (this._action == action) {
			this._action = null
		}
		if (this._middle_action == action) {
			this._middle_action = null
		}
	}
	
	//点的创建事件
	piuProto.createPoint = function() {
		this.setAction(new PointAction(this))
	}
	
	//线段创建事件
	piuProto.createLine = function() {
		this.setAction(new LineAction(this))
	}
	
	//多边形创建事件
	piuProto.createPolygon = function() {
		this.setAction(new PolygonAction(this))
	}
	
	//保持展示比例
	piuProto.resize = function() {
		//如果当前事件有预览
		if (this._action && this._action.render) {
			this._action.render()
		}
		if (this._right_action && this._right_action.render) {
			this._right_action.render()
		}
		//更新已经存在的内容
		for (var x in this.point) {
			this.point[x].render()
		}
		for (var x in this.line) {
			this.line[x].render()
		}
		for (var x in this.polygon) {
			this.polygon[x].render()
		}
	}
	
	//对象选中相关功能
	piuProto.setSelect = function(ob) {	//单选
		doClearSelect(this)
		this.addSelect(ob)
	}
	
	piuProto.addSelect = function(ob) {	//多选
		if (this.select.indexOf(ob) < 0) {	//如果是当前没有选中的对象，则添加此对象
			this.select.push(ob)
			ob.setSelect(true)
			this.emit('message', '选中对象，拖拽鼠标移动')
		} else {
			//反选 取消这个单位的选中状态
			this.select.splice(this.select.indexOf(ob), 1)
			ob.setSelect(false)
		}
		//触发回调
		this.emit('select_change', this.select)
	}
	
	piuProto.clearSelect = function() {	//取消选择
		if (this.select.length > 0) {
			doClearSelect(this)
			this.emit('select_change', this.select)
		}
	}
	
	function doClearSelect(piu) {
		//通知每个对象不再被选中
		for (var x in piu.select) {
			piu.select[x].setSelect(false)
		}
		piu.select = []
	}
	
	//各种回调函数设置
	piuProto.on_message = function(callback) {
		this.events['message'] = callback
	}
	
	piuProto.on_image_timeout = function(callback) {
		this.events['image_timeout'] = callback
	}
	
	piuProto.on_image_success = function(callback) {
		this.events['image_success'] = callback
	}
	
	piuProto.on_image_fail = function(callback) {
		this.events['image_fail'] = callback
	}
	
	piuProto.on_select_change = function(callback) {
		this.events['select_change'] = callback
	}
	
	//数据方法
	piuProto.reset = function() {
		while(this.point.length > 0) {
			this.point[0].destory()
		}
		while(this.line.length > 0) {
			this.line[0].destory()
		}
		while (this.polygon.length > 0) {
			this.polygon[0].destory()
		}
	}
	
	piuProto.save = function() {
		var point = []
		for (var x in this.point) {
			var p = this.point[x]
			point.push({
				position: p.position,
				color: p._color,
				data: p._data
			})
		}
		var line = []
		for (var x in this.line) {
			var l = this.line[x]
			line.push({
				points: l.points,
				color: l._color,
				data: l._data
			})
		}
		var polygon = []
		for (var x in this.polygon) {
			var p = this.polygon[x]
			polygon.push({
				points: p.points,
				color: p._color,
				data: p._data
			})
		}
		var result = {
			point: point,
			line: line,
			polygon: polygon
		}
		return result
	}
	
	piuProto.load = function(piu_data) {
		var point = piu_data.point
		for (var x in point) {
			var p = new Point(this, point[x].color, point[x].position)
			p.data(point[x].data)
		}
		var line = piu_data.line
		for (var x in line) {
			var l = new Line(this, line[x].color, line[x].points)
			l.data(line[x].data)
		}
		var polygon = piu_data.polygon
		for (var x in polygon) {
			var p = new Polygon(this, polygon[x].color, polygon[x].points)
			p.data(polygon[x].data)
		}
	}

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
