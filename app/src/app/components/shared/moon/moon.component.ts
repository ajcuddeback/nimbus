import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const MOON_RADIUS = 44;
const MOON_CENTER = 50;

/**
 * Builds the path for the shadowed part of the moon's disc.
 *
 * The shape is bounded by two arcs: half of the disc's outline (the limb on
 * the dark side) and the terminator — the day/night divide — which projects
 * onto the disc as a half-ellipse whose horizontal radius shrinks to zero at
 * the quarter phases.
 */
function buildShadowPath(cycleFraction: number): string {
  const cosineOfPhaseAngle = Math.cos(2 * Math.PI * cycleFraction);
  const terminatorRadiusX = Math.abs(cosineOfPhaseAngle) * MOON_RADIUS;
  const isWaxing = cycleFraction < 0.5;

  // A waxing moon is lit on the right, so its shadow hugs the left limb (and
  // vice versa). The terminator bulges toward the shadow before a quarter
  // phase and away from it after, which flips the arc's sweep direction.
  const limbSweep = isWaxing ? 0 : 1;
  const terminatorBulgesTowardShadow = cosineOfPhaseAngle > 0;
  const terminatorSweep = (isWaxing ? !terminatorBulgesTowardShadow : terminatorBulgesTowardShadow) ? 1 : 0;

  const top = `${MOON_CENTER} ${MOON_CENTER - MOON_RADIUS}`;
  const bottom = `${MOON_CENTER} ${MOON_CENTER + MOON_RADIUS}`;
  return [
    `M ${top}`,
    `A ${MOON_RADIUS} ${MOON_RADIUS} 0 0 ${limbSweep} ${bottom}`,
    `A ${terminatorRadiusX.toFixed(2)} ${MOON_RADIUS} 0 0 ${terminatorSweep} ${top}`,
    'Z',
  ].join(' ');
}

let nextInstanceId = 0;

@Component({
  selector: 'app-moon',
  templateUrl: './moon.component.html',
  styleUrl: './moon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoonComponent {
  /** Position in the lunar cycle: 0 = new, 0.25 = first quarter, 0.5 = full. */
  readonly phaseFraction = input.required<number>();
  /** Rendered width/height in pixels. */
  readonly size = input(60);
  /** Human-readable phase name, used for the accessible label and tooltip. */
  readonly phaseName = input('Moon');

  // SVG gradient/clip/filter references are looked up by document-wide id, so
  // each instance needs its own to avoid collisions.
  private readonly instanceId = ++nextInstanceId;
  protected readonly surfaceGradientId = `moon-surface-${this.instanceId}`;
  protected readonly discClipId = `moon-disc-${this.instanceId}`;
  protected readonly terminatorBlurId = `moon-terminator-${this.instanceId}`;

  protected readonly shadowPath = computed(() => buildShadowPath(this.phaseFraction()));

  /** Fraction of the disc that is lit; drives how strongly the moon glows. */
  protected readonly illuminatedFraction = computed(() => {
    const litFraction = (1 - Math.cos(2 * Math.PI * this.phaseFraction())) / 2;
    return Math.round(litFraction * 100) / 100;
  });
}
