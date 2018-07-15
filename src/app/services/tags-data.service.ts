import {Observable} from 'rxjs';
import {HashTagModel} from '../models/hash-tag.model';

export interface TagsDataService {
  getTagsData(): Observable<HashTagModel[]>;
}
