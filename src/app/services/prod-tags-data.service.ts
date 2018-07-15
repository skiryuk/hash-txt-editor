import {Injectable} from '@angular/core';
import {TagsDataService} from './tags-data.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/map';
import {HashTagModel} from '../models/hash-tag.model';

@Injectable()
export class ProdTagsDataService implements TagsDataService {
  constructor(private http: HttpClient) { }

  getTagsData(): Observable<HashTagModel[]> {
    return this.http.get('https://my-json-server.typicode.com/lexstark/ngx-test/tags')
      .map((data: HashTagModel[]) => {
        return data;
      });
  }
}
