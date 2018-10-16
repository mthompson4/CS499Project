import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';


const routes: Routes = [
	// { path: 'editor/:filename', component: EditorComponent },
	// { path: '', redirectTo: '/editor/index.html', pathMatch: 'full' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
