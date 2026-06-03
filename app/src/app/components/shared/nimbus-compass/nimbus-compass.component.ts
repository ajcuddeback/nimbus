import { Component, Input, OnChanges } from '@angular/core';

interface TickMark { x1: number; y1: number; x2: number; y2: number; long: boolean; }
interface Cardinal { mark: string; x: number; y: number; }

@Component({
  selector: 'app-nimbus-compass',
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none" stroke="var(--line)" stroke-width="1.5"/>
        @for (m of tickMarks; track $index) {
          <line [attr.x1]="m.x1" [attr.y1]="m.y1" [attr.x2]="m.x2" [attr.y2]="m.y2"
                stroke="var(--line)" [attr.stroke-width]="m.long ? 1.5 : 1"/>
        }
        @for (card of cardinals; track card.mark) {
          <text [attr.x]="card.x" [attr.y]="card.y" text-anchor="middle"
                font-family="var(--mono,monospace)" font-size="11"
                [attr.fill]="card.mark === 'N' ? 'var(--c-temp)' : 'var(--ink-faint)'"
                [attr.font-weight]="card.mark === 'N' ? 600 : 400">{{ card.mark }}</text>
        }
        <line [attr.x1]="tailX" [attr.y1]="tailY" [attr.x2]="tipX" [attr.y2]="tipY"
              stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
        <polygon [attr.points]="arrowPoints" fill="var(--accent)"/>
        <circle [attr.cx]="c" [attr.cy]="c" r="4.5" fill="var(--card)" stroke="var(--accent)" stroke-width="2"/>
      </svg>
      @if (!compact) {
        <div style="text-align:center;line-height:1.25">
          <div style="font-family:var(--mono,monospace);font-size:18px;color:var(--ink);font-weight:500">
            {{ speed.toFixed(2) }} <span style="font-size:11px;color:var(--ink-soft)">mph {{ dirName }}</span>
          </div>
          @if (gust != null) {
            <div style="font-family:var(--mono,monospace);font-size:11px;color:var(--ink-faint)">gust {{ gust.toFixed(1) }}</div>
          }
        </div>
      }
    </div>
  `
})
export class NimbusCompassComponent implements OnChanges {
  @Input() deg = 0;
  @Input() dirName = '';
  @Input() speed = 0;
  @Input() gust?: number;
  @Input() size = 132;
  @Input() compact = false;

  c = 66; r = 52;
  rad = 0;
  tipX = 0; tipY = 0; tailX = 0; tailY = 0;
  arrowPoints = '';
  tickMarks: TickMark[] = [];
  cardinals: Cardinal[] = [];

  ngOnChanges(): void {
    this.c = this.size / 2;
    this.r = this.c - 14;
    this.rad = ((this.deg - 90) * Math.PI) / 180;
    this.tipX = this.c + Math.cos(this.rad) * (this.r - 6);
    this.tipY = this.c + Math.sin(this.rad) * (this.r - 6);
    this.tailX = this.c - Math.cos(this.rad) * (this.r - 30);
    this.tailY = this.c - Math.sin(this.rad) * (this.r - 30);
    const tx = this.tipX, ty = this.tipY, rad = this.rad;
    this.arrowPoints = `${tx},${ty} ${tx - Math.cos(rad - 0.5) * 11},${ty - Math.sin(rad - 0.5) * 11} ${tx - Math.cos(rad + 0.5) * 11},${ty - Math.sin(rad + 0.5) * 11}`;
    this.tickMarks = Array.from({ length: 36 }, (_, i) => {
      const a = (i * 10 - 90) * Math.PI / 180;
      const long = i % 9 === 0;
      const r1 = this.r - (long ? 8 : 4);
      return { x1: this.c + Math.cos(a) * this.r, y1: this.c + Math.sin(a) * this.r, x2: this.c + Math.cos(a) * r1, y2: this.c + Math.sin(a) * r1, long };
    });
    this.cardinals = ['N', 'E', 'S', 'W'].map((m, i) => {
      const a = (i * 90 - 90) * Math.PI / 180;
      const rr = this.r - 22;
      return { mark: m, x: this.c + Math.cos(a) * rr, y: this.c + Math.sin(a) * rr + 4 };
    });
  }
}
