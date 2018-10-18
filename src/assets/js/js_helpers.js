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


// parameter isNightMode: is True if the editor is currenty in night mode and will switch to day mode
function toggleClass(isNightMode){

	var colorModeLink = document.getElementById("colorModeEnabler");
	if(isNightMode) { // switch to day mode
		colorModeLink.innerHTML = "Enable Night Mode";
	}
	else {
		colorModeLink.innerHTML = "Enable Day Mode";
	}
	document.getElementById("myNav").classList.toggle("navbar-dark");
	document.getElementById("myNav").classList.toggle("bg-dark");

	var dropdown_items = document.body.getElementsByClassName('dropdown-item');
	var dropdown_menus = document.body.getElementsByClassName('dropdown-menu');
	var file_toggler = document.body.getElementsByClassName('file-toggler');
	let userList = document.getElementById("userlist");
	
	let elements_to_change = [...dropdown_items, ...dropdown_menus, ...file_toggler];
	console.log(elements_to_change);
	for(var i = 0; i < elements_to_change.length; ++i){
		elements_to_change[i].classList.toggle("bg-dark");
		elements_to_change[i].classList.toggle("text-white");
	}
	userList.classList.toggle("bg-dark");
	userList.classList.toggle("text-white");


}