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

	getFiles(){
		var self = this;
		return new Observable<any>(observer => {
			this.ref.child('test-files').on("value", snapshot => {
				console.log("SNAPSHOT", snapshot.val());
				var tempArr = [];
				self.getFilesInDirFromSnap(snapshot, 'test-files', tempArr);
				console.log("GOT FILES", tempArr);
				tempArr.sort(this.compare);
				observer.next(tempArr);
			})
		})
	}

	getFilesInDirFromSnap(datasnapshot, dirPath, fileArray){
		var self = this;
		this.ref.child(dirPath).once("value", snapshot => {
			snapshot.forEach(function(data) {
				const key = data.key
				let splitPath = dirPath.split('/');
				let parentNodeId = splitPath[splitPath.length-1];
				if(key != "isToggled"){
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


	// returns an array of just the file names in the database
	getAllFileNames(){
		return new Observable<any>(observer => {
			this.ref.on("value", snapshot => {
				var tempArr = [];
				snapshot.forEach(function(data) {
					const snapVal = data.val();
					var filename;
					if(snapVal["filename"] == undefined){
						for(var i in snapVal){
							filename = snapVal[i]["filename"];
							if(filename != undefined){
								tempArr.push(filename);
							}
						}
					}
					else {
						filename = snapVal["filename"];
						if(filename != undefined){
							tempArr.push(filename);
						}
					}
				});
				observer.next(tempArr);
			})
		})
	}

	// returns an array of just the "directory" names in the database
	getAllDirNames(){
		return new Observable<any>(observer => {
			this.ref.on("value", snapshot => {
				var tempArr = [];
				snapshot.forEach(function(data) {
					const snapVal = data.val();
					if(snapVal["filename"] == undefined){
						const dirName = data.key;
						tempArr.push(data.key);
					}
				});
				observer.next(tempArr);
			})
		})
	}
}
