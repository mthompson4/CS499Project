function closeModal(){
	$('#newFileModal').modal('hide')
}

function showModalError(){
	$('#newFileModalError').removeClass('invisible');
}

function matchExtension(inputExtension){
	let modes = {
		'html': 'xml',
		'js': 'javascript',
		'py': 'python',
		'md': 'markdown',
		'php': 'php'
	}
	console.log(modes[inputExtension]);
	return modes[inputExtension];
}

// either collapse or expand the sidebar based on current status
function collapseSidebar(isCollapsed){
	if(isCollapsed == false){
		document.getElementById("firepad").style.left = "0px";
		document.getElementById("collapseButton").innerHTML = 'Expand Side Bar';
	}
	else {
		document.getElementById("firepad").style.left = "175px";
		document.getElementById("collapseButton").innerHTML = 'Collapse Side Bar';
	}
}