import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-post-meta-data-card',
  templateUrl: './post-meta-data-card.component.html',
  styleUrls: ['./post-meta-data-card.component.scss']
})
export class PostMetaDataCardComponent {

  @Input('post') post: any = {};

  validateImageUrl(url: string) {
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlPattern.test(url);
  }
}
