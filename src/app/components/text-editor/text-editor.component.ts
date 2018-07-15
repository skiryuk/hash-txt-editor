import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ProdTagsDataService} from '../../services/prod-tags-data.service';
import {HashTagModel} from '../../models/hash-tag.model';
import {TestTagsDataService} from '../../services/test-tags-data.service';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.css']
})
export class TextEditorComponent implements OnInit, AfterViewInit {

  @ViewChild('editor') editor: ElementRef;

  content = '';
  expTag: RegExp = /(#[A-Za-zА-Яа-я\d]+)(\s|&nbsp;|<div>|<\/span>|(?=#)|(?=<\/div>[\d\D]+))+/gm;
  tagsData: Array<HashTagModel> = [];

  constructor(protected tagsDataService: TestTagsDataService) { }

  ngOnInit() {
    this.tagsDataService.getTagsData()
      .subscribe((tagsData: Array<HashTagModel>) => {
        this.tagsData = tagsData;
      });
  }

  ngAfterViewInit() {
    (<HTMLDivElement>this.editor.nativeElement).focus();
  }

  onKeyUp(event: KeyboardEvent) {
    this.convertTags();
    this.checkSelection();
  }

  onKeyDown(event: KeyboardEvent) {
    this.checkSelection(event.keyCode);

    if (event.keyCode === 37) { // Обработка нажатия стрелки влево
      this.onKeyDownLeftArrow();
    }

    if (event.keyCode === 39) { // Обработка нажатия стрелки вправо
      this.onKeyDownRightArrow();
    }

    if (event.keyCode === 46) { // Обработка нажатия кнопки Delete
      this.onKeyDownDelete();
    }

    if (event.keyCode === 8) { // Обработка нажатия кнопки Backspace
      this.onKeyDownBackspace();
    }

    // Обработка нажатий внутри хэш тегов
    if (event.keyCode !== 37 && event.keyCode !== 39 && /[\D\d]/i.test(event.key)) {
      const currentSelection = window.getSelection();
      if (!currentSelection.isCollapsed) {
        if (currentSelection.anchorNode && currentSelection.anchorNode.parentNode && this.isHashTagElement(currentSelection.anchorNode.parentNode)) {
          return false;
        }
      }
    }
  }

  onKeyDownLeftArrow() {
    const currentSelection = window.getSelection();
    const prevNode = currentSelection.anchorNode.previousSibling;
    // Если курсор стоит после плашки, то поставить курсор перед плашкой
    if (currentSelection.isCollapsed) {
      if (currentSelection.anchorOffset === 1 &&
        prevNode &&
        this.isHashTagElement(prevNode)) {
        if (prevNode.previousSibling) {
          const rng = document.createRange();
          rng.selectNode(prevNode.previousSibling);
          if (prevNode.previousSibling.textContent === '') {
            const surroundElement = document.createElement('span');
            rng.surroundContents(surroundElement);
            surroundElement.innerHTML = '&nbsp;';
          }
          rng.collapse(false);
          currentSelection.removeAllRanges();
          currentSelection.addRange(rng);
        }
      }
    }
  }

  onKeyDownRightArrow() {
    const currentSelection = window.getSelection();
    const nextElement = currentSelection.focusNode.nextSibling;
    // Если курсор стоит перед плашкой, то поставить курсор после плашки
    // если после плашки нет элемента, то создаем его и ставим курсор в начальную позицию
    if (currentSelection.isCollapsed) {
      if (currentSelection.focusOffset === currentSelection.focusNode.textContent.length &&
        nextElement &&
        this.isHashTagElement(nextElement)) {
        if (nextElement.nextSibling) {
          const rng = document.createRange();
          rng.selectNode(nextElement.nextSibling);
          rng.collapse(true);
          currentSelection.removeAllRanges();
          currentSelection.addRange(rng);
        } else {
          const newDivNode = document.createElement('span');
          newDivNode.innerHTML = '&nbsp;';
          currentSelection.focusNode.nextSibling.parentNode.appendChild(newDivNode);
          const rng = document.createRange();
          rng.selectNode(newDivNode);
          currentSelection.removeAllRanges();
          currentSelection.addRange(rng);
        }
      }
    }
  }

  onKeyDownDelete() {
    const currentSelection = window.getSelection();
    // Если курсор стоит перед плашкой, либо стоит перед n количеством пустых узлов, то удаляем плашку и пустые узлы
    // Если выделен диапазон и начало находится в плашке, то удаляем плашку и ставим курсор в конец предыдущего элемента
    if (!this.isEditorNode(currentSelection.focusNode)) {
      const nextElement = currentSelection.focusNode.nextSibling;
      if (currentSelection.isCollapsed) {
        if (nextElement && currentSelection.focusOffset === currentSelection.focusNode.textContent.length) {
          this.deleteNode(nextElement);
        }
      } else {
        this.setCursorInPreviousElement(currentSelection);
      }
    }
  }

  onKeyDownBackspace() {
    const currentSelection = window.getSelection();
    // Если курсор стоит после плашкой, то удаляем плашку
    // Если выделен диапазон и начало находится в плашке, то удаляем плашку и ставим курсор в конец предыдущего элемента
    if (currentSelection.isCollapsed) {
      if (currentSelection.anchorOffset === 0 || currentSelection.anchorOffset === 1) {
        if (currentSelection.anchorNode.previousSibling) {
          this.backspaceNode(currentSelection.anchorNode.previousSibling);
        } else {
          this.backspaceNode(currentSelection.anchorNode.parentNode);
        }
      } else {
        this.backspaceNode(currentSelection.anchorNode.childNodes[currentSelection.anchorOffset - 1]);
      }
    } else {
      // Для Opera
      if (this.isHashTagElement(currentSelection.anchorNode.parentNode)) {
        currentSelection.anchorNode.parentNode.parentNode.removeChild(currentSelection.anchorNode.parentNode);
      }
      if (this.isHashTagElement(currentSelection.focusNode.parentNode)) {
        currentSelection.focusNode.parentNode.parentNode.removeChild(currentSelection.focusNode.parentNode);
      }
      //
      this.setCursorInPreviousElement(currentSelection);
    }
  }

  deleteNode(node: Node) {
    if (node.textContent.trim() === '' && !this.isHashTagElement(node)) {
      if (node.nextSibling) {
        this.deleteNode(node.nextSibling);
        node.parentNode.removeChild(node);
      }
    } else if (this.isHashTagElement(node)) {
      node.parentNode.removeChild(node);
    } else if (this.isHashTagElement(node.firstChild)) {
      node.firstChild.parentNode.removeChild(node.firstChild);
    }
  }

  backspaceNode(node: Node) {
    if (node && node.textContent.trim() === '' && !this.isHashTagElement(node)) {
      if (node.previousSibling) {
        this.backspaceNode(node.previousSibling);
        // node.parentNode.removeChild(node);
      }
    } else if (node && this.isHashTagElement(node)) {
      node.parentNode.removeChild(node);
    }
  }

  onMouseUp(event: MouseEvent) {
    this.checkSelection();
  }

  checkSelection(keyCode?: number) {
    if (window.getSelection()) {
      const currentSelection = window.getSelection();
      if (currentSelection.isCollapsed) {
        const focusNode = currentSelection.focusNode;
        if (focusNode.nodeType === 3) {
          if (this.isHashTagElement(focusNode.parentNode)) {
            if (focusNode.parentNode.nextSibling) {
              if (focusNode.parentNode.nextSibling.textContent === '') {
                if (focusNode.parentNode.nextSibling.nextSibling) {
                  const rng = document.createRange();
                  rng.selectNode(focusNode.parentNode.nextSibling.nextSibling);
                  rng.setStart(focusNode.parentNode.nextSibling.nextSibling, 1);
                  rng.collapse(true);
                  currentSelection.removeAllRanges();
                  currentSelection.addRange(rng);
                } else {
                  const newDivNode = document.createElement('span');
                  newDivNode.innerHTML = '&nbsp;';
                  focusNode.parentNode.nextSibling.parentNode.appendChild(newDivNode);
                  const rng = document.createRange();
                  rng.selectNode(newDivNode);
                  currentSelection.removeAllRanges();
                  currentSelection.addRange(rng);
                }
              } else {
                const rng = document.createRange();
                rng.selectNode(focusNode.parentNode.nextSibling);
                rng.setStart(focusNode.parentNode.nextSibling, 1);
                rng.collapse(true);
                currentSelection.removeAllRanges();
                currentSelection.addRange(rng);
              }
            } else {
              const newDivNode = document.createElement('span');
              newDivNode.innerHTML = '&nbsp;';
              focusNode.parentNode.parentNode.appendChild(newDivNode);
              const rng = document.createRange();
              rng.selectNode(newDivNode);
              currentSelection.removeAllRanges();
              currentSelection.addRange(rng);
            }
          }
        }
      } else {
         if (!keyCode || keyCode !== 16) {
          const currentRange = currentSelection.getRangeAt(0);

         if (!keyCode) {
            if (currentRange.startContainer.parentNode && this.isHashTagElement(currentRange.startContainer.parentNode)) {
              currentRange.setStart(currentRange.startContainer, 0);
            }
            if (currentRange.endContainer.parentNode && this.isHashTagElement(currentRange.endContainer.parentNode)) {
              currentRange.setEnd(currentRange.endContainer, currentRange.endContainer.textContent.length);
           }
         } else {
            if (currentRange.startContainer.parentNode && this.isHashTagElement(currentRange.startContainer.parentNode)) {
              if (keyCode === 37) {
                this.selectRangeBackwards(currentSelection, currentRange);
              } else if (keyCode === 39) {
                currentSelection.extend(currentRange.startContainer, currentRange.startContainer.textContent.length);
              }
            }

            if (currentRange.endContainer.parentNode && this.isHashTagElement(currentRange.endContainer.parentNode)) {
              if (keyCode === 37) {
                currentSelection.extend(currentRange.endContainer, 0);
              } else if (keyCode === 39) {
                currentSelection.extend(currentRange.endContainer, currentRange.endContainer.textContent.length);
              }
            }
         }
        }
      }
    }
  }

  onSelectTagItem(item: HashTagModel) {
    const hashTagElement = document.createElement('span');
    hashTagElement.className = 'hash-tag';
    hashTagElement.innerHTML = item.HashTag.replace('#', '<span class="hash-tag-sign">#</span>');
    this.insertElementAtCursor(hashTagElement);
  }

  saveFocus(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  insertElementAtCursor(node: Node) {
    if (window.getSelection) {
      let currentSelection = window.getSelection();
      if (currentSelection.getRangeAt && currentSelection.rangeCount) {
        const currentRange = currentSelection.getRangeAt(0);
        currentRange.deleteContents();
        currentRange.insertNode(node);

        const textNode = document.createTextNode('\u00A0');
        currentRange.setStartAfter(node);
        currentRange.insertNode(textNode);
        currentRange.setStartAfter(textNode);
        currentRange.collapse(false);
        currentSelection = window.getSelection();
        currentSelection.removeAllRanges();
        currentSelection.addRange(currentRange);
      }
    }
  }

  isKnownHashTag(hashTag: string): boolean {
    return this.tagsData.map(tag => tag.HashTag).indexOf(hashTag) >= 0;
  }

  convertTags() {
    const editorDiv = <HTMLDivElement>this.editor.nativeElement;
    const content = editorDiv.innerHTML.replace(/&nbsp;/gm, ' ');
    const matches = this.getMatchesTags(content, this.expTag);
    if (matches && matches.length > 0) {
      matches.forEach((tagText: string) => {
        const textNodes = [];
        this.getTextNodes(editorDiv, textNodes);
        // Находим в каком элементе содержится найденый текст
        for (let i = 0; i < textNodes.length; i++) {
          const node = textNodes[i];
          const tagTextPositionInNode = node.textContent.indexOf(tagText.trim());
          if (tagTextPositionInNode >= 0) {
            // .. и заменяем его на плашку
            this.transformToTag(node, tagText.trim(), tagTextPositionInNode);
          }
        }
      });
    }
  }

  getMatchesTags(string, regex) {
    const matches = [];
    let match;
    while (match = regex.exec(string)) {
      matches.push(match[1]);
    }
    return matches;
  }

  transformToTag(node: Node, tagContent: string, position: number) {
    // Создаем Range
    const rng = document.createRange();
    // Ставим левую границу по позиции первого вхождения элемента
    rng.setStart(node, position);
    // Ставим правую границу по позиции первого вхождения элемента + длина текста
    rng.setEnd(node, position + tagContent.length);

    if (this.isKnownHashTag(tagContent)) {
      // Создаем плашку
      const hashTagElement = document.createElement('span');
      hashTagElement.className = 'hash-tag';

      // Обернем созданный Range в плашку
      rng.surroundContents(hashTagElement);
      // Убираем хэштег
      hashTagElement.innerHTML = tagContent.replace('#', '<span class="hash-tag-sign">#</span>');
    }
    rng.collapse(false);
  }

  getTextNodes(node: Node, textNodes: Array<Node>) {
    const nodes = node.childNodes;
    for (let i = 0; i < nodes.length; i++) {
      const childNode = nodes[i];
      if (childNode.nodeType === 3) {
        textNodes.push(childNode);
      } else if (childNode.nodeType === 1) {
        if (!this.isHashTagElement(childNode)) {
          this.getTextNodes(childNode, textNodes);
        }
      }
    }
  }

  getNearestNonEmptyNode(node: Node) {
    if (node && node.textContent.trim() !== '') {
      return node;
    } else {
      if (node && node.previousSibling) {
        return this.getNearestNonEmptyNode(node.previousSibling);
      } else {
        return node;
      }
    }
  }

  setCursorInPreviousElement(currentSelection) {
    const currentRange = currentSelection.getRangeAt(0);
    if (currentRange.startContainer &&
      currentRange.startContainer.parentNode &&
      this.isHashTagElement(currentRange.startContainer.parentNode)) {
      currentRange.startContainer.parentNode.parentNode.removeChild(currentRange.startContainer.parentNode);
      const newRange = document.createRange();
      const nearestNode = this.getNearestNonEmptyNode(currentRange.startContainer.parentNode.previousSibling);
      if (nearestNode) {
        newRange.setStart(nearestNode, nearestNode.textContent.length);
        currentSelection.removeAllRanges();
        currentSelection.addRange(newRange);
      } else {
        // Для Firefox
        currentSelection.collapseToStart();
      }
    }
  }

  selectRangeBackwards(selection, range) {
    const endRange = range.cloneRange();
    endRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(endRange);
    selection.extend(range.startContainer, range.startOffset);
  }

  isHashTagElement(node: Node) {
    return node && node.nodeType && node.nodeType === 1 && (<HTMLElement>node).className === 'hash-tag';
  }

  isEditorNode(node: Node) {
    return node.nodeType === 1 && (<HTMLElement>node).className === 'editor';
  }
}
