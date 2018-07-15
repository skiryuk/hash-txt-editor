import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {TextEditorComponent} from './text-editor.component';
import {ProdTagsDataService} from '../../services/prod-tags-data.service';
import {TestTagsDataService} from '../../services/test-tags-data.service';
import {HttpClientModule} from '@angular/common/http';

describe('TextEditorComponent', () => {
  let component: TextEditorComponent;
  let fixture: ComponentFixture<TextEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextEditorComponent ],
      providers: [{provide: ProdTagsDataService, useClass: TestTagsDataService}],
      imports: [HttpClientModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Тест создания компонента "Редактор"', () => {
    expect(component).toBeTruthy();
  });
});
