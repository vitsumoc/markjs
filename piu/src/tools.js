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