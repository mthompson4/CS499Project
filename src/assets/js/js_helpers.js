// JS Helper Functions
// These JS functions utilize JQuery (We had some difficulties using it with Angular)
// In addition, they are DOM-editing functions that are used across many components

/**
   * Closes a modal view
   * @param {modalId}: String - the DOM id of the modal to close
*/
function closeModal(modalId){
	$(modalId).modal('hide');
	// reset the form when it closes
	$(modalId).on('hidden.bs.modal', function () {
    	$(this).find('form').trigger('reset');
	});
}

/**
   * Presents a modal view
   * @param {modalId}: String - the DOM id of the modal to present
*/
function presentModal(modalId){
	$(modalId).modal('show');
}


/**
   * Show modal error
   * @param {modalId}: String - the DOM id of the modal to add the error to
   * @param {message}: String - the error message to present
*/
function showModalError(message, modalId){
	$(modalId).removeClass('invisible');
	$(modalId).html(message);
}

// Toggle the text input that allows users to edit filenames
function filenameEditor(){
	document.getElementById("fileNameLabel").classList.toggle("hidden");
	document.getElementById("editInput").classList.toggle("hidden");
}


/**
   * Matches file extensions with their Codemirror mode name
   * @param {inputExtension}: String - The filename input extension to match
*/
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
	// If it's collapsed, expand it, else expand it
	if(isCollapsed == false){
		document.getElementById("firepad").style.left = "0px";
		document.getElementById("collapseId").innerHTML = ' Expand Side Bar';
	}
	else {
		document.getElementById("firepad").style.left = "175px";
		document.getElementById("collapseId").innerHTML = ' Collapse Side Bar';
	}
}


/**
   * toggles the classes between dark mode and light mode
   * @param {isNightMode}: Boolean - is True if the editor is currenty in night mode and will switch to day mode
*/
function toggleClass(isNightMode){
	var colorModeLink = document.getElementById("modeLabel");
	var new_file_modal_items, new_dir_modal_items, delete_dir_modal_items;
	
	// Grab the DOM elements for the modal views whether or not it's day or night mode
	if(isNightMode) { // switch to day mode
		colorModeLink.innerHTML = " Enable Night Mode";
		new_file_modal_items = document.getElementById('newFileModal').getElementsByClassName('bg-dark');
		new_dir_modal_items = document.getElementById('newDirModal').getElementsByClassName('bg-dark');
		delete_dir_modal_items = document.getElementById('deleteDirModal').getElementsByClassName('bg-dark');
		document.getElementById("modePic").src = "/assets/open-iconic/svg/moon.svg";
	}
	else {
		colorModeLink.innerHTML = " Enable Day Mode";
		new_file_modal_items = document.getElementById('newFileModal').getElementsByClassName('bg-light');
		new_dir_modal_items = document.getElementById('newDirModal').getElementsByClassName('bg-light');
		delete_dir_modal_items = document.getElementById('deleteDirModal').getElementsByClassName('bg-light');
		document.getElementById("modePic").src = "/assets/open-iconic/svg/sun.svg";
	}

	// Grab other DOM elements that need to be toggled
	document.getElementById("myNav").classList.toggle("navbar-dark");
	document.getElementById("myNav").classList.toggle("bg-dark");
	var dropdown_items = document.body.getElementsByClassName('dropdown-item');
	var dropdown_menus = document.body.getElementsByClassName('dropdown-menu');
	var file_toggler = document.body.getElementsByClassName('file-toggler');
	let nav_tabs = document.body.getElementsByClassName('nav-tabs');
	let nav_links = document.getElementById('editorTabs').getElementsByClassName('nav-link');
	let userList = document.getElementById("userlist");

	var elements_to_change = [...dropdown_items, ...dropdown_menus, ...file_toggler, ...new_file_modal_items, 
	...new_dir_modal_items, ...delete_dir_modal_items, ...nav_tabs, ...nav_links];
	// Loop through all of the elements and toggle their classes
	for(var i = 0; i < elements_to_change.length; ++i){
		elements_to_change[i].classList.toggle("bg-dark");
		elements_to_change[i].classList.toggle("text-white");
		elements_to_change[i].classList.toggle("bg-light");
		elements_to_change[i].classList.toggle("text-black");
	}
	userList.classList.toggle("bg-dark");
	userList.classList.toggle("text-white");

}

// the on-click function for directories so they expand and show the contents of the directory
function toggleHelper(dirId, dirRef){
	let newId = '#' + dirId;
	let arrowId = dirId + '-arrow';
	console.log(document.getElementById(arrowId));
	$(newId).on('show.bs.collapse', function(){
		document.getElementById(arrowId).classList.remove("octicon-arrow-right");
		document.getElementById(arrowId).classList.add("octicon-arrow-down");
	}).on('hide.bs.collapse', function(){
		document.getElementById(arrowId).classList.add("octicon-arrow-right");
		document.getElementById(arrowId).classList.remove("octicon-arrow-down");
	});
	if ($(newId).hasClass('collapse') && $(newId).hasClass('show')) {
		$(newId).collapse('hide');
		var postData = {
     		"isToggled": false
    	};
    	dirRef.update(postData);

	}
	else {
		$(newId).collapse('show');
		var postData = {
     		"isToggled": true
    	};
    	dirRef.update(postData);
	}
}