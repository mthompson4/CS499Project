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