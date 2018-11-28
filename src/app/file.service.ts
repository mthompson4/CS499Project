import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';
import 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class FileService {
	ref: firebase.database.Reference;
	constructor() { 
		this.ref = firebase.database().ref();
	}

	// compares snapshot results based on filename
	compare(file1, file2){

		// file 1 is a file and file2 is a dir
		if(file1.isFile == true && file2.isFile == false){
			return -1;
		}
		if(file1.isFile == false && file2.isFile == true){
			return 1;
		}

		if(file1.name < file2.name){
			return -1;
		}
		if(file1.name > file2.name){
			return 1;
		}
		return 0;
	}

	// gets all the files/directories in the database as they update
	getFiles(){
		var self = this;
		return new Observable<any>(observer => {
			this.ref.child('test-files').on("value", snapshot => {
				var tempArr = [];
				self.getFilesInDirFromSnap(snapshot, 'test-files', tempArr);
				tempArr.sort(this.compare);
				observer.next(tempArr);
			})
		})
	}


	/** 
   	 * get all the files in a particular directory & search nested dirs if needed
   	 * @param {datasnapshot}: Object - the firebase snapshot data
   	 * @param {dirPath}: String - the absolute path of the directory
   	 * @param {fileArray}: Array<Object> - the directory to add the files to
  	*/
	getFilesInDirFromSnap(datasnapshot, dirPath, fileArray){
		var self = this;
		this.ref.child(dirPath).once("value", snapshot => {
			snapshot.forEach(function(data) {
				const key = data.key
				let splitPath = dirPath.split('/');
				let parentNodeId = splitPath[splitPath.length-1];
				if(key != "isToggled"){ // ignore toggling values
					const snapVal = data.val();
					var isToggled = false;
					if(snapVal["filename"] == undefined){ // it's a directory entry
						let newDirPath = dirPath + '/' + key;
						for(var i in snapVal){ // see if the directory is toggled or not
							if(i == "isToggled"){
								isToggled = snapVal[i];
							}
						}
						let dirObj = {
							id: key,
							isFile: false,
							isImage: false,
							name: data.key,
							isToggled: isToggled,
							absPath: newDirPath,
							storagePath: newDirPath,
							parent: parentNodeId,
							databaseRef: self.ref.child(newDirPath),
							firepadRef: self.ref.child('firepad').child(key)
						}
						fileArray.push(dirObj)
						self.getFilesInDirFromSnap(data, newDirPath, fileArray);
					}
					else { // it's a file
						let filename = snapVal["filename"];
						let fileAbsPath = dirPath + '/' + key;
						let storagePath = dirPath + '/' + filename;
						let file = {
							id: key,
							isFile: true,
							isImage: snapVal["isImage"],
							name: snapVal["filename"],
							isToggled: false,
							absPath: fileAbsPath,
							storagePath: storagePath,
							parent: parentNodeId,
							databaseRef: self.ref.child(fileAbsPath),
							firepadRef: self.ref.child('firepad').child(key)
						}
						fileArray.push(file);
					}
				}
			});
		})
	}
}
