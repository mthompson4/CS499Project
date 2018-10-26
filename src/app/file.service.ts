import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';
import 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class FileService {
	filesRef: firebase.database.Reference;
	constructor() { 
		this.filesRef = firebase.database().ref().child('test-files');
	}

	// gets all the files and their associated metadata
	getFiles(){
		return new Observable<any>(observer => {
			this.filesRef.on("value", snapshot => {
				var tempArr = [];
				snapshot.forEach(function(data) {
					const key = data.key
					const snapVal = data.val();
					var isFile = true;
					var dirData = [];
					var file;
					var isToggled = false;
					if(snapVal["filename"] == undefined){
						isFile = false;
						for(var i in snapVal){
							// console.log(i, snapVal[i]);
							if(i == "isToggled"){
								isToggled = snapVal[i];
							}
							else {
								let newPath = key + '/' + i;
								var dirFileObj = {
									isFile: true,
									isToggled: isToggled,
									path: newPath,
									data: snapVal[i]
								}
								dirData.push(dirFileObj);
							}
						}
						file = {
							isFile: isFile,
							isToggled: isToggled,
							path: key,
							data: dirData
						}
						// console.log("file data", file);
					}
					else {
						file = {
							isFile: isFile,
							isToggled: false,
							path: key,
							data: snapVal
						}
					}
					tempArr.push(file);
				});
				observer.next(tempArr);
			})
		})
	}

	// returns an array of just the file names in the database
	getAllFileNames(){
		return new Observable<any>(observer => {
			this.filesRef.on("value", snapshot => {
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
			this.filesRef.on("value", snapshot => {
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
