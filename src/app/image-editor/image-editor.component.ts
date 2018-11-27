import { Component, OnInit, Input} from '@angular/core';
import { Events } from '@ionic/angular'; 

@Component({
  selector: 'image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css']
})
export class ImageEditorComponent {

  @Input() imageConfig:any [];

  constructor(
    public events: Events
  ) {
  }

  public close() {
    // Fired when the editor is closed.
    console.log("closed");
  }

  public getEditedFile(file: File) {
    console.log("image updated", file);
    this.events.publish('image:updated', file);
  }
}
