const RAD = Math.PI / 180;

/** Sun elevation in degrees (NOAA approximation, no refraction), rounded to 0.001. */
export function sunElevationDeg(ms: number, lat: number, lng: number): number {
  const jd = ms / 86_400_000 + 2_440_587.5;
  const T = (jd - 2_451_545) / 36_525;

  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));

  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eqTimeMin =
    4 *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD)) /
    RAD;

  const minutesUtc = (((ms % 86_400_000) + 86_400_000) % 86_400_000) / 60_000;
  const trueSolarMin = (((minutesUtc + eqTimeMin + 4 * lng) % 1440) + 1440) % 1440;
  const hourAngle = trueSolarMin / 4 - 180;

  const cosZenith =
    Math.sin(lat * RAD) * Math.sin(decl) + Math.cos(lat * RAD) * Math.cos(decl) * Math.cos(hourAngle * RAD);
  const elevation = 90 - Math.acos(Math.min(1, Math.max(-1, cosZenith))) / RAD;
  return Math.round(elevation * 1000) / 1000;
}
