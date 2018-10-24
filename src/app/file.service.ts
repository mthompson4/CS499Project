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
					if(snapVal["filename"] == undefined){
						isFile = false;
						for(var i in snapVal){
							console.log(i, snapVal[i]);
							let newPath = key + '/' + i;
							console.log(newPath);
							var dirFileObj = {
								isFile: true,
								path: newPath,
								data: snapVal[i]
							}
							dirData.push(dirFileObj);
						}
						file = {
							isFile: isFile,
							path: key,
							data: dirData
						}
						console.log("file data", file);
					}
					else {
						file = {
							isFile: isFile,
							path: key,
							data: snapVal
						}
					}
					console.log(file);
					tempArr.push(file);
				});
				observer.next(tempArr);
			})
		})
	}
}
