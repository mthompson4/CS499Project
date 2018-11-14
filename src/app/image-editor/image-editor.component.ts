import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css']
})
export class ImageEditorComponent{

    public config = {
	    ImageName: ' ',
	    AspectRatios: ["4:3", "16:9"],
	    ImageUrl: 'https://static.pexels.com/photos/248797/pexels-photo-248797.jpeg',
	    ImageType: 'image/jpeg'
  	}

  public close() {
    // Fired when the editor is closed.
    console.log("closed");
  }

  public getEditedFile(file: File) {
    // Fired when the file has been processed.
    console.log("got file", file);
  }
}
