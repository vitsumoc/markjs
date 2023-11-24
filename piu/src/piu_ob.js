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