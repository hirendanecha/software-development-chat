// import { Pipe, PipeTransform } from '@angular/core';

// @Pipe({
//   name: 'highlight',
// })
// export class HighlightPipe implements PipeTransform {
//   transform(text: string, search: string): string {
//     if (!search) {
//       return text;
//     }
//     const regex = new RegExp(`(${search})`, 'gi');
//     return text.replace(regex, '<span class="highlight">$1</span>');
//   }
// }


import { Pipe, PipeTransform } from '@angular/core';
import { EncryptDecryptService } from '../services/encrypt-decrypt.service';

@Pipe({
  name: 'highlight',
})

export class HighlightPipe implements PipeTransform {
  constructor(private encryptDecryptService: EncryptDecryptService) {}
  
  transform(text: string, search: string): string {
    const decryptedText = this.encryptDecryptService.decryptUsingAES256(text);
    
    if (!search) {
      return text;
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(decryptedText, 'text/html');

    this.highlightTextNodes(doc.body, search);

    const highlightedAndEncryptedText = this.encryptDecryptService.encryptUsingAES256(doc.body.innerHTML);
    return highlightedAndEncryptedText;
  }

  private highlightTextNodes(element: Node, search: string) {
    if (element.nodeType === Node.TEXT_NODE) {
      const regex = new RegExp(`(${search})`, 'gi');
      const wrapper = document.createElement('span');
      wrapper.innerHTML = element.nodeValue.replace(regex, '<span class="highlight">$1</span>');
      element.parentNode.replaceChild(wrapper, element);
    } else {
      element.childNodes.forEach(child => this.highlightTextNodes(child, search));
    }
  }
}
