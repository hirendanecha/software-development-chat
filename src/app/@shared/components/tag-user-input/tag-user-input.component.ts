import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from '../../services/customer.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-tag-user-input',
  templateUrl: './tag-user-input.component.html',
  styleUrls: ['./tag-user-input.component.scss'],
})
export class TagUserInputComponent implements OnChanges, OnDestroy {
  @Input('value') value: string = '';
  @Input('placeholder') placeholder: string = 'ss';
  @Input('isShowMetaPreview') isShowMetaPreview: boolean = true;
  @Input('isCopyImagePreview') isCopyImagePreview: boolean = true;
  @Input('isAllowTagUser') isAllowTagUser: boolean = true;
  @Input('isShowMetaLoader') isShowMetaLoader: boolean = true;
  @Input('isShowEmojis') isShowEmojis: boolean = false;
  @Input('isCustomeSearch') isCustomeSearch: number = null;
  @Input() placement: string = 'bottom-end';
  @Output('onDataChange') onDataChange: EventEmitter<any> =
    new EventEmitter<any>();

  @ViewChild('tagInputDiv', { static: false }) tagInputDiv: ElementRef;
  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;

  metaDataSubject: Subject<void> = new Subject<void>();

  userList = [];
  userNameSearch = '';
  metaData: any = {};
  isMetaLoader: boolean = false;

  copyImage: any;
  profileId: number;
  emojiPaths = [
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Heart.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Cool.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Anger.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Censorship.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Hug.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Kiss.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/LOL.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Party.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Poop.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Sad.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Thumbs-UP.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Thumbs-down.gif',
  ];

  constructor(
    private renderer: Renderer2,
    private customerService: CustomerService,
    private spinner: NgxSpinnerService,
    private messageService: MessageService
  ) {
    this.metaDataSubject.pipe(debounceTime(5)).subscribe(() => {
      this.getMetaDataFromUrlStr();
      this.checkUserTagFlag();
    });
    this.profileId = +localStorage.getItem('profileId');
  }

  ngOnChanges(changes: SimpleChanges): void {
    const val = changes?.value?.currentValue;
    this.setTagInputDivValue(val);

    if (val === '') {
      this.clearUserSearchData();
      this.clearMetaData();
      this.onClearFile();
    } else {
      this.getMetaDataFromUrlStr();
      this.checkUserTagFlag();
    }
  }

  ngOnDestroy(): void {
    this.metaDataSubject.next();
    this.metaDataSubject.complete();
  }

  messageOnKeyEvent(): void {
    this.metaDataSubject.next();
    this.emitChangeEvent();
  }

  checkUserTagFlag(): void {
    this.userList = [];
    if (this.isAllowTagUser) {
      let htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
      const anchorTagRegex =
        /<a\s+href="\/settings\/view-profile\/(\d+)"\s+class="text-danger"\s+data-id="\d+">@([\w\s]+)<\/a>/g;
      htmlText = htmlText.replace(anchorTagRegex, '');
      const atSymbolRegex = /@(\w*)/g;
      const matches = [...htmlText.matchAll(atSymbolRegex)];
      const cursorPosition = this.getCursorPosition();
      if (matches.length > 0) {
        let foundValidTag = false;
        for (const match of matches) {
          const atSymbolIndex = match.index;
          if (cursorPosition > atSymbolIndex) {
            let textAfterAt = htmlText
              .substring(atSymbolIndex + 1, cursorPosition)
              .trim();
            textAfterAt = textAfterAt.replace(/<[^>]*>/g, '');
            textAfterAt = textAfterAt.replace(/[^\w\s\-_\.]/g, '');
            const currentPositionValue = textAfterAt.split(' ')[0].trim();
            if (currentPositionValue.length > 0) {
              this.userNameSearch = currentPositionValue;
              foundValidTag = true;
            }
          } else {
            const atSymbolIndex = htmlText.lastIndexOf('@');
            if (atSymbolIndex !== -1) {
              let textAfterAt = htmlText.substring(atSymbolIndex + 1).trim();
              textAfterAt = textAfterAt.replace(/<[^>]*>/g, '');
              textAfterAt = textAfterAt.replace(/[^\w\s\-_\.]/g, '');
              this.userNameSearch = textAfterAt.split(' ')[0].trim();
              foundValidTag = true;
            }
          }
        }
        if (
          foundValidTag &&
          this.userNameSearch &&
          this.userNameSearch.length > 1 && !this.isCustomeSearch
        ) {
          this.getUserList(this.userNameSearch);
        } else if (this.isCustomeSearch) {
          this.getUserList('');
        } else {
          this.clearUserSearchData();
        }
      }
    }
  }

  getCursorPosition(): number {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(this.tagInputDiv.nativeElement);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
    return -1;
  }

  getMetaDataFromUrlStr(): void {
    const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
    this.extractImageUrlFromContent(htmlText);
    if (htmlText === '') {
      this.onClearFile();
    }

    const text = htmlText.replace(/<br\s*\/?>|<[^>]*>/g, ' ');
    const extractedLinks = [
      ...htmlText.matchAll(
        /<a\s+(?![^>]*\bdata-id=["'][^"']*["'])[^>]*?href=["']([^"']*)["']/gi
      ),
    ].map((match) => match[1]);
    const matches = text.match(
      /(?:https?:\/\/|www\.)[^\s<&]+(?:\.[^\s<&]+)+(?:\.[^\s<]+)?/g
    );
    const url = matches?.[0] || extractedLinks?.[0];
    if (url) {
      if (url !== this.metaData?.url) {
        const unsubscribe$ = new Subject<void>();
        this.customerService
          .getMetaData({ url })
          .pipe(takeUntil(unsubscribe$))
          .subscribe({
            next: (res: any) => {
              this.isMetaLoader = false;
              if (res?.meta?.image) {
                const urls = res.meta?.image?.url;
                const imgUrl = Array.isArray(urls) ? urls?.[0] : urls;

                const metatitles = res?.meta?.title;
                const metatitle = Array.isArray(metatitles)
                  ? metatitles?.[0]
                  : metatitles;

                const metaurls = res?.meta?.url || url;
                const metaursl = Array.isArray(metaurls)
                  ? metaurls?.[0]
                  : metaurls;

                this.metaData = {
                  title: metatitle,
                  metadescription: res?.meta?.description,
                  metaimage: imgUrl,
                  metalink: metaursl,
                  url: url,
                };

                this.emitChangeEvent();
              } else {
                this.metaData.metalink = url;
              }
              this.spinner.hide();
            },
            error: () => {
              if (this.metaData.metalink === null || '') {
                this.metaData.metalink = url;
              }
              this.isMetaLoader = false;
              // this.clearMetaData();
              this.spinner.hide();
            },
            complete: () => {
              unsubscribe$.next();
              unsubscribe$.complete();
            },
          });
      }
    } else {
      this.clearMetaData();
      this.isMetaLoader = false;
    }
  }

  moveCursorToEnd(): void {
    const range = document.createRange();
    const selection = window.getSelection();
    const tagInputDiv = this.tagInputDiv?.nativeElement;
    if (tagInputDiv && tagInputDiv.childNodes.length > 0) {
      range.setStart(
        this.tagInputDiv?.nativeElement,
        this.tagInputDiv?.nativeElement.childNodes.length
      );
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  selectTagUser(user: any): void {
    const htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
    const savedRange = this.saveCursorPosition();
    const replaceUsernamesInTextNodesAtCursor = (
      html: string,
      userName: string,
      userId: string,
      displayName: string
    ) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const cursorPosition = this.getCursorPosition();
          const regex = /@/g;
          const match = regex.exec(node.nodeValue || '');
          if (match && match.index <= cursorPosition) {
            const atSymbolIndex = match.index;
            const replacement = `<a href="/settings/view-profile/${userId}" class="text-danger" data-id="${userId}">@${displayName}</a>`;
            const beforeText = node.nodeValue?.substring(0, atSymbolIndex);
            const afterText = node.nodeValue?.substring(cursorPosition);
            const replacedText = `${beforeText}${replacement}${afterText}`;
            const span = document.createElement('span');
            span.innerHTML = replacedText;
            while (span.firstChild) {
              node.parentNode?.insertBefore(span.firstChild, node);
            }
            node.parentNode?.removeChild(node);
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName.toLowerCase() !== 'a'
        ) {
          node.childNodes.forEach((child) => walk(child));
        }
      };

      doc.body.childNodes.forEach((child) => walk(child));
      return doc.body.innerHTML;
    };
    const text = replaceUsernamesInTextNodesAtCursor(
      htmlText,
      this.userNameSearch,
      user?.Id,
      user?.Username.split(' ').join('')
    );
    this.setTagInputDivValue(text);
    this.restoreCursorPosition(savedRange);
    this.emitChangeEvent();
    this.moveCursorToEnd();
  }

  saveCursorPosition(): Range | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    return null;
  }

  restoreCursorPosition(savedRange: Range | null): void {
    if (savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  }

  selectEmoji(emoji: any): void {
    let htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
    htmlText = htmlText.replace(/^(<br\s*\/?>)+/i, '');
    const text = `${htmlText}<img src=${emoji} width="50" height="50">`;
    this.setTagInputDivValue(text);
    this.emitChangeEvent();
  }

  getUserList(search: string): void {
    if (this.isCustomeSearch) {
      this.messageService
        .getRoomProfileList(search, this.isCustomeSearch)
        .subscribe({
          next: (res: any) => {
            if (res?.data?.length > 0) {
              this.userList = res.data.filter(
                (user) => user.Id !== this.profileId
              );
            } else {
              this.clearUserSearchData();
            }
          },
          error: () => {
            this.clearUserSearchData();
          },
        });
    } else {
      this.customerService.getProfileList(search).subscribe({
        next: (res: any) => {
          if (res?.data?.length > 0) {
            this.userList = res.data.map((e) => e);
          } else {
            this.clearUserSearchData();
          }
        },
        error: () => {
          this.clearUserSearchData();
        },
      });
    }
  }

  clearUserSearchData(): void {
    this.userNameSearch = '';
    this.userList = [];
  }

  clearMetaData(): void {
    this.metaData = {};
    this.emitChangeEvent();
  }

  setTagInputDivValue(htmlText: string): void {
    if (this.tagInputDiv) {
      this.renderer.setProperty(
        this.tagInputDiv.nativeElement,
        'innerHTML',
        htmlText
      );
    }
  }

  handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData =
      event.clipboardData?.getData('text/html') ||
      event.clipboardData?.getData('text/plain');
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const items = clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event: any) => {
            const base64Image = event.target.result;
            const imgTag = `<img src="${base64Image}" alt="Pasted Image" />`;
            document.execCommand('insertHTML', false, imgTag);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    }
    if (pastedData) {
      const isPlainText = !/<[^>]+>/.test(pastedData);
      if (isPlainText) {
        document.execCommand('insertText', false, pastedData);
        return;
      }
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.cleanPastedData(pastedData);
      this.removeInlineStyles(tempDiv);
      document.execCommand('insertHTML', false, tempDiv.innerHTML);
    }
  }
  cleanPastedData(data: string): string {
    return data
      .replace(/<!--.*?-->/gs, '')
      .replace(/<!DOCTYPE.*?>/gs, '')
      .replace(/<xml.*?<\/xml>/gs, '')
      .replace(/<o:.*?<\/o:.+?>/gs, '')
      .replace(/<w:.*?>.*?<\/w:.+?>/gs, '')
      .replace(/<m:.*?>.*?<\/m:.+?>/gs, '')
      .replace(/<!--[if.*?]>([\s\S]*?)<!\[endif]-->/gs, '')
      .replace(/<w:LatentStyles.*?<\/w:LatentStyles>/gs, '')
      .replace(/<style.*?<\/style>/gs, '')
      .trim();
  }
  removeInlineStyles(element: HTMLElement) {
    const elementsWithStyle = element.querySelectorAll('[style]');
    for (let i = 0; i < elementsWithStyle.length; i++) {
      elementsWithStyle[i].removeAttribute('style');
    }

    const tagsToConvert = [
      'B',
      'I',
      'U',
      'STRONG',
      'EM',
      'MARK',
      'SMALL',
      'S',
      'DEL',
      'INS',
      'SUB',
      'SUP',
    ];
    tagsToConvert.forEach((tag) => {
      const elements = element.getElementsByTagName(tag);
      const elementsArray = Array.from(elements);
      elementsArray.forEach((el) => {
        const span = document.createElement('span');
        span.innerHTML = el.innerHTML;
        el.parentNode?.replaceChild(span, el);
      });
    });
  }

  emitChangeEvent(): void {
    if (this.tagInputDiv) {
      const htmlText = this.tagInputDiv?.nativeElement?.innerHTML;
      this.value = `${htmlText}`
        .replace(/<br[^>]*>\s*/gi, '<br>')
        .replace(/(<br\s*\/?>\s*){4,}/gi, '<div><br><br><br><br></div>')
        .replace(/(?:<div><br><\/div>\s*)+/gi, '<div><br></div>')
        .replace(
          /<a\s+(?![^>]*\bdata-id=["'][^"']*["'])[^>]*>(.*?)<\/a>/gi,
          '$1'
        );
      this.onDataChange?.emit({
        html: this.value,
        tags: this.tagInputDiv?.nativeElement?.children,
        meta: this.metaData,
      });
    }
  }

  extractImageUrlFromContent(content: string): string | null {
    const contentContainer = document.createElement('div');
    contentContainer.innerHTML = content;
    const imgTag = contentContainer.querySelector('img');

    if (imgTag) {
      // const tagUserInput = document.querySelector('.tag-input-div') as HTMLInputElement;
      // if (tagUserInput) {tagUserInput.focus()}
      const imgTitle = imgTag.getAttribute('title');
      const imgStyle = imgTag.getAttribute('style');
      const imageGif = imgTag
        .getAttribute('src')
        .toLowerCase()
        .endsWith('.gif');
      if (!imgTitle && !imgStyle && !imageGif) {
        this.copyImage = imgTag.getAttribute('src');
      }
    }
    return null;
  }

  onClearFile() {
    this.copyImage = null;
  }
}
