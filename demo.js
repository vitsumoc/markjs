//全局关闭右键
document.oncontextmenu = function() {
	return false
}

//初始化piu对象
var piu_instance = piu.init(document.getElementById('piu_container'))

//画笔颜色 回填与获取
$('#color_input').val(piu_instance.color())
$('#color_cube').css('background-color', piu_instance.color())
$('#btn_color').click(function() {
	piu_instance.color($('#color_input').val())
	$('#color_cube').css('background-color', piu_instance.color())
})

//加载图片
$('#btn_image_layer').click(function() {
	$('#load_image_lay').css('display', 'flex')
	layer.open({
		type: 1,
		title: false,
		shadeClose: true,
		closeBtn: 0,
		skin: 'layui-layer-rim',
		area: ['600px', '120px'],
		content: $('#load_image_lay'),
		end: function() {
			$('#load_image_lay').css('display', 'none')
		}
	})
})

$('#btn_image_load').click(function() {
	piu_instance.load_image($('#image_url').val())
	layer.closeAll()
})

//点的创建
$('#btn_point').click(function() {
	piu_instance.createPoint()
})

//线段创建
$('#btn_line').click(function() {
	piu_instance.createLine()
})

//多边形区域创建
$('#btn_polygon').click(function() {
	piu_instance.createPolygon()
})

//各种功能回调设置
//接受piu的信息输出
piu_instance.on_message(function(msg) {
	$('#message_shower').val(msg)
})

//图片加载成功回调
piu_instance.on_image_success(function() {
	console.log('图片加载成功')
})

//图片加载超时回调
piu_instance.on_image_timeout(function() {
	console.log('图片加载超时')
})

//图片加载失败回调
piu_instance.on_image_fail(function() {
	console.log('图片加载失败')
})


var current_piu_ob = null
//选中内容变化的回调
piu_instance.on_select_change(function(selected) {
	console.log('当前选中的对象为')
	console.log(selected)
	//选中单个对象，初始化编辑框
	if (selected.length == 1) {
		current_piu_ob = selected[0]
		//展示数据
		$('#ob_data').val(JSON.stringify(current_piu_ob.data()))
		//展示颜色
		$('#ob_color').val(current_piu_ob.color())
	} else {
		$('#ob_data').val('')
		$('#ob_color').val('')
		current_piu_ob = null
	}
})

//设置当前选中对象的属性
$('#btn_ob_color').click(function() {
	if (current_piu_ob) {
		console.log('设置对象颜色')
		current_piu_ob.color($('#ob_color').val())
		current_piu_ob.render()
	}
})

$('#btn_ob_data').click(function() {
	if (current_piu_ob) {
		console.log('设置对象数据')
		current_piu_ob.data(JSON.parse($('#ob_data').val()))
	}
})

$('#btn_ob_delete').click(function() {
	if (current_piu_ob) {
		console.log('删除对象')
		current_piu_ob.destory()
	}
})

//全局重置
$('#btn_reset').click(function() {
	piu_instance.reset()
})

//导出
$('#btn_save').click(function() {
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(piu_instance.save()))
	var a = document.createElement('a')
	a.href = dataStr
	a.download = 'piu.json'
	document.body.appendChild(a)
	a.click()
	a.remove()
})

//导入和解析
document.getElementById('import').addEventListener('change',handleFileSelect, false);
$('#btn_load').click(function () {
	//触发file的点击事件
	$('#import').click();
})

function handleFileSelect(evt) {
	var files = evt.target.files
	var file = files[0]
	var reader = new FileReader()
	reader.onload = (function(theFile) {
		return function(e) {
			var piu_data = JSON.parse(decodeURIComponent(e.target.result))
			piu_instance.reset()
			piu_instance.load(piu_data)
			document.getElementById('import').value = ''
		}
	})(file)
	reader.readAsText(file)
}