import { Pipe, PipeTransform, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';

@Pipe({
  name: 'messageTime',
  pure: false
})
export class MessageTimePipe implements PipeTransform, OnDestroy {

  private lastUpdate: number | null = null;
  private intervalId: any;

  constructor(private cd: ChangeDetectorRef, private ngZone: NgZone) {}

  transform(value: string): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDate = new Date();
    const targetDate = new Date(value);
    const diffInTime = currentDate.getTime() - targetDate.getTime();
    const diffInSeconds = Math.round(diffInTime / 1000);
    const diffInMinutes = Math.round(diffInTime / (1000 * 60));
    const diffInHours = Math.round(diffInTime / (1000 * 3600));
    const diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));
    const diffInWeeks = Math.round(diffInDays / 7);

    let updateInterval = 3600000; // Default: 1 hour for updates

    if (diffInSeconds <= 60) {
      updateInterval = 1000; // Update every second
      this.setupAutoUpdate(updateInterval);
      return 'just now';
    }

    if (diffInMinutes < 60) {
      updateInterval = 60000; // Update every minute
      this.setupAutoUpdate(updateInterval);
      return `${diffInMinutes}min`;
    }

    if (diffInHours < 24) {
      updateInterval = 3600000; // Update every hour
      this.setupAutoUpdate(updateInterval);
      return `${diffInHours}h`;
    }

    if (diffInDays < 7) {
      this.clearAutoUpdate(); // No frequent updates needed
      return `${days[targetDate.getDay()]}`;
    }

    if (diffInWeeks === 1) {
      this.clearAutoUpdate();
      return '1 week ago';
    }

    if (diffInWeeks > 1 && diffInWeeks < 4) {
      this.clearAutoUpdate();
      return `${diffInWeeks} weeks ago`;
    }

    if (diffInDays >= 28) {
      this.clearAutoUpdate();
      const diffInMonths = Math.round(diffInDays / 30);
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }

    // For older dates, return the actual date
    this.clearAutoUpdate();
    const formattedDate = targetDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return formattedDate;
  }

  private setupAutoUpdate(interval: number): void {
    const now = new Date().getTime();
    if (!this.lastUpdate || now - this.lastUpdate > interval) {
      this.ngZone.runOutsideAngular(() => {
        this.clearAutoUpdate();
        this.intervalId = setTimeout(() => {
          this.cd.markForCheck();
        }, interval);
      });
      this.lastUpdate = now;
    }
  }

  private clearAutoUpdate(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearAutoUpdate();
  }
}
