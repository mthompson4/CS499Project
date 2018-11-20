import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ImageEditorComponent implements OnChanges{

  @Input() imageConfig:any [];


  ngOnChanges(changes: SimpleChanges) {
    console.log("I WAS CHANGED THIS TIME!");
    console.log(this.imageConfig);
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
