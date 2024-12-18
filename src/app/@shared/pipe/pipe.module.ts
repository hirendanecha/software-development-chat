import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafePipe } from './safe.pipe';
// import { GetImageUrlPipe } from './get-image-url.pipe';
// import { CommaSeperatePipe } from './comma-seperate.pipe';
import { DateDayPipe } from './date-day.pipe';
import { NoSanitizePipe } from './sanitize.pipe';
import { MessageTimePipe } from './message-time.pipe';
import { MessageDatePipe } from './message-date.pipe';
// import { SearchFilterPipe } from './search-filter.pipe';
import { HighlightPipe } from './hightlight-text.pipe';
import { GetImageUrlPipe } from './get-image-url.pipe';
import { SearchFilterPipe } from './search-filter.pipe';
import { LinkifyPipe } from './linkify.pipe';

@NgModule({
  declarations: [
    SafePipe,
    GetImageUrlPipe,
    DateDayPipe,
    NoSanitizePipe,
    MessageTimePipe,
    MessageDatePipe,
    SearchFilterPipe,
    HighlightPipe,
    LinkifyPipe
  ],
  imports: [CommonModule],
  exports: [
    SafePipe,
    GetImageUrlPipe,
    DateDayPipe,
    NoSanitizePipe,
    MessageTimePipe,
    MessageDatePipe,
    SearchFilterPipe,
    HighlightPipe,
    LinkifyPipe
  ],
})
export class PipeModule {}
