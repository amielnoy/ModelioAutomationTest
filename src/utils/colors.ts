const enabled =
  process.stdout.isTTY !== false &&
  !process.env['NO_COLOR'] &&
  process.env['TERM'] !== 'dumb';

const esc = (code: string) => (s: string) => enabled ? `\x1b[${code}m${s}\x1b[0m` : s;

export const c = {
  // styles
  bold:   esc('1'),
  dim:    esc('2'),
  // colours
  red:    esc('91'),
  green:  esc('92'),
  yellow: esc('93'),
  blue:   esc('94'),
  cyan:   esc('96'),
  gray:   esc('90'),
  white:  esc('97'),
};
