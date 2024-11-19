import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from '../../services/message.service';
import * as moment from 'moment';
import { NgbActiveOffcanvas, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MessageDatePipe } from '../../pipe/message-date.pipe';

import { GalleryImgPreviewComponent } from '../gallery-img-preview/gallery-img-preview.component';
import { FILE_EXTENSIONS, FILE_EXTENSIONS_Video } from '../../constant/file-extensions';
@Component({
  selector: 'app-media-gallery',
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.scss'],
})
export class MediaGalleryComponent implements OnInit {
  @Input('userChat') userChat: any = {};
  mediaList: any = [];
  fileName: string;
  profileId: number;
  activePage = 1;
  hasMoreData = false;
  filterMediaList = [];
  isMediaLoader=false; 
  constructor(
    private messageService: MessageService,
    public activeOffCanvas: NgbActiveOffcanvas,
    private modelService:NgbModal
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngOnInit() {
    this.getMessageMedia();
  }

  getMessageMedia(): void {
    this.isMediaLoader = true;
    const data = {
      roomId: this.userChat?.roomId || null,
      groupId: this.userChat?.groupId || null,
      size: 10,
      page: this.activePage,
    };
    this.messageService.getMessageMedia(data).subscribe({
      next: (res: any) => {
        this.isMediaLoader = false;
        if (this.activePage < res?.pagination.totalPages) {
          this.hasMoreData = true;
        } else {
          this.hasMoreData = false;
        }
        this.mediaList = [...this.mediaList, ...res.data];
        this.filterMediaList = new MessageDatePipe().transform(this.mediaList);
      },
      error: (error) => {
        console.log(error);
        this.isMediaLoader = false;
      },
    });
  }

  isFile(media: string): boolean {
    this.fileName = media?.split('/')[3]?.replaceAll('%', '-');
    const File = FILE_EXTENSIONS;
    return File.some((ext) => media?.endsWith(ext));
  }
  isVideoFile(media: string): boolean {
    const FILE_EXTENSIONS = FILE_EXTENSIONS_Video;
    return FILE_EXTENSIONS.some((ext) => media?.endsWith(ext));
  }

  pdfView(pdfUrl: string) {
    window.open(pdfUrl);
  }

  loadMoreMedia() {
    this.activePage = this.activePage + 1;
    this.getMessageMedia();
  }

  downloadPdf(data): void {
    const pdfLink = document.createElement('a');
    pdfLink.href = data;
    pdfLink.click();
  }
  openImagePreview(src: string) {
    const modalRef = this.modelService.open(GalleryImgPreviewComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.src = src;
    modalRef.componentInstance.roomId = this.userChat?.roomId;
    modalRef.componentInstance.groupId = this.userChat?.groupId;
    modalRef.componentInstance.activePage = this.activePage;
  }
}
