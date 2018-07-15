import {BrowserModule, Title} from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {MainPageComponent} from './pages/main-page/main-page.component';
import {RouterModule, Routes} from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { TextEditorComponent } from './components/text-editor/text-editor.component';
import {ProdTagsDataService} from './services/prod-tags-data.service';
import {HttpClientModule} from '@angular/common/http';
import {TestTagsDataService} from './services/test-tags-data.service';

const appRoutes: Routes = [
  { path: '', component: MainPageComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    MainPageComponent,
    TextEditorComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoutes),
    HttpClientModule
  ],
  providers: [Title, ProdTagsDataService, TestTagsDataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
