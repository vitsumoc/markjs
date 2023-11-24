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