import {Injectable} from '@angular/core';
import {TagsDataService} from './tags-data.service';
import {HashTagModel} from '../models/hash-tag.model';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class TestTagsDataService implements TagsDataService {
  constructor(private http: HttpClient) { }

  getTagsData(): Observable<HashTagModel[]> {
    return this.http.get('./assets/tags.json')
      .map((data: HashTagModel[]) => {
        return data;
      });
  }
}
