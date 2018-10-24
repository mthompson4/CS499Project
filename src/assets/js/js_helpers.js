function closeModal(){
	$('#newFileModal').modal('hide');
	$('#newFileModal').on('hidden.bs.modal', function () {
    	$(this).find('form').trigger('reset');
	});
}

function showModalError(message){
	$('#newFileModalError').removeClass('invisible');
	$('#newFileModalError').html(message);
}


function filenameEditor(){
	document.getElementById("fileNameLabel").classList.toggle("hidden");
	document.getElementById("editInput").classList.toggle("hidden");
}


function matchExtension(inputExtension){
	let modes = {
		'html': 'xml',
		'js': 'javascript',
		'py': 'python',
		'md': 'markdown',
		'php': 'php',
		'css': 'css'
	}
	return modes[inputExtension];
}

/**
   * Collapses the sidebar
   * @param {isCollapsed}: Boolean - is true if the menu is currently collapsed
*/
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


/**
   * toggles the classes between dark mode and light mode
   * @param {isNightMode}: Boolean - is True if the editor is currenty in night mode and will switch to day mode
*/
function toggleClass(isNightMode){

	var colorModeLink = document.getElementById("modeLabel");
	var modal_items;
	if(isNightMode) { // switch to day mode
		colorModeLink.innerHTML = " Enable Night Mode";
		modal_items = document.getElementById('newFileModal').getElementsByClassName('bg-dark');
		document.getElementById("modePic").src = "/assets/open-iconic/svg/moon.svg";
	}
	else {
		colorModeLink.innerHTML = " Enable Day Mode";
		modal_items = document.getElementById('newFileModal').getElementsByClassName('bg-light');
		document.getElementById("modePic").src = "/assets/open-iconic/svg/sun.svg";
	}

	document.getElementById("myNav").classList.toggle("navbar-dark");
	document.getElementById("myNav").classList.toggle("bg-dark");

	var dropdown_items = document.body.getElementsByClassName('dropdown-item');
	var dropdown_menus = document.body.getElementsByClassName('dropdown-menu');
	var file_toggler = document.body.getElementsByClassName('file-toggler');
	let userList = document.getElementById("userlist");

	let elements_to_change = [...dropdown_items, ...dropdown_menus, ...file_toggler, ...modal_items];
	console.log(elements_to_change);
	for(var i = 0; i < elements_to_change.length; ++i){
		elements_to_change[i].classList.toggle("bg-dark");
		elements_to_change[i].classList.toggle("text-white");
		elements_to_change[i].classList.toggle("bg-light");
		elements_to_change[i].classList.toggle("text-black");
	}
	userList.classList.toggle("bg-dark");
	userList.classList.toggle("text-white");

}

function toggleHelper(dirId){
	// $('#files').on('show.bs.collapse', function (){
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-right");
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-down");
	// 	console.log('shown');
	// }).on('hide.bs.collapse', function(){
	// 	console.log('hidden');
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-right");
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-down");
	// });
	let newId = '#' + dirId;
	// $(dirId).on('show.bs.collapse', function (){
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-right");
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-down");
	// 	console.log('shown');
	// }).on('hide.bs.collapse', function(){
	// 	console.log('hidden');
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-right");
	// 	document.getElementById('directory-arrow').classList.toggle("octicon-arrow-down");
	// });
	$(newId).collapse('toggle').on('show.bs.collapse', function(){
		console.log('whoaaaa');
		document.getElementById('directory-arrow').classList.toggle("octicon-arrow-right");
		document.getElementById('directory-arrow').classList.toggle("octicon-arrow-down");
	}).on('hide.bs.collapse', function(){
		console.log('hidden');
		document.getElementById('directory-arrow').classList.toggle("octicon-arrow-right");
		document.getElementById('directory-arrow').classList.toggle("octicon-arrow-down");
	});

}



