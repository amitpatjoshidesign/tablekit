/**
 * Icons: Lucide (https://lucide.dev, ISC license) via lucide-react.
 *
 * The rest of the component imports these named wrappers, never lucide-react directly,
 * so swapping the icon set later is a one-file change. Every icon is decorative:
 * the surrounding button or cell carries the accessible name.
 */
import type { ActionIconName, BadgeIconName } from "@tablekit/core";
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CirclePause,
  CircleX,
  Clock,
  Columns3,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  Flag,
  GripVertical,
  Hourglass,
  Inbox,
  Info,
  ListFilter,
  LoaderCircle,
  Lock,
  LockOpen,
  type LucideIcon,
  type LucideProps,
  Mail,
  Minus,
  Pencil,
  Pin,
  Receipt,
  RefreshCw,
  Rows2,
  Rows3,
  Rows4,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  Truck,
  Undo2,
  Upload,
  UserPlus,
  X,
  Zap,
} from "lucide-react";

type IconProps = Omit<LucideProps, "ref">;

/** 16px, 1.75px stroke: Lucide's 24-unit grid scaled down, tuned for 12–14px text. */
function wrap(Icon: LucideIcon, defaults: IconProps = {}) {
  const Wrapped = (props: IconProps) => (
    <Icon
      size={16}
      strokeWidth={1.75}
      aria-hidden="true"
      focusable="false"
      className="tk-icon"
      {...defaults}
      {...props}
    />
  );
  Wrapped.displayName = `Tk${Icon.displayName ?? "Icon"}`;
  return Wrapped;
}

export const SortAscIcon = wrap(ArrowUp);
export const SortDescIcon = wrap(ArrowDown);
export const SortNoneIcon = wrap(ChevronsUpDown);
export const SearchIcon = wrap(Search);
export const FilterIcon = wrap(ListFilter);
export const ColumnsIcon = wrap(Columns3);
export const CloseIcon = wrap(X);
export const ChevronLeftIcon = wrap(ChevronLeft);
export const ChevronRightIcon = wrap(ChevronRight);
export const MoreIcon = wrap(Ellipsis);
export const CheckIcon = wrap(Check, { strokeWidth: 2.25 });
export const MinusIcon = wrap(Minus, { strokeWidth: 2.25 });
export const AlertIcon = wrap(CircleAlert);
export const InboxIcon = wrap(Inbox);
export const GripIcon = wrap(GripVertical);
export const PinIcon = wrap(Pin);
export const ExternalIcon = wrap(ExternalLink, { size: 12, strokeWidth: 2 });
/** Density toggle: compact = 4 rows, default = 3, comfortable = 2. */
export const DensityCompactIcon = wrap(Rows4);
export const DensityDefaultIcon = wrap(Rows3);
export const DensityComfortableIcon = wrap(Rows2);

/** Badge icon names (closed list in @tablekit/core) → Lucide components. */
const BADGE: Record<BadgeIconName, LucideIcon> = {
  "circle-check": CircleCheck,
  check: Check,
  "circle-x": CircleX,
  x: X,
  "triangle-alert": TriangleAlert,
  "circle-alert": CircleAlert,
  info: Info,
  "circle-dashed": CircleDashed,
  circle: Circle,
  "circle-dot": CircleDot,
  "circle-pause": CirclePause,
  clock: Clock,
  hourglass: Hourglass,
  loader: LoaderCircle,
  "refresh-cw": RefreshCw,
  ban: Ban,
  lock: Lock,
  "shield-check": ShieldCheck,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "arrow-right": ArrowRight,
  "undo-2": Undo2,
  send: Send,
  truck: Truck,
  star: Star,
  zap: Zap,
  sparkles: Sparkles,
  eye: Eye,
};

/** Action icon names (closed list in @tablekit/core) → Lucide components. */
const ACTION: Record<ActionIconName, LucideIcon> = {
  eye: Eye,
  pencil: Pencil,
  copy: Copy,
  download: Download,
  upload: Upload,
  "share-2": Share2,
  send: Send,
  "external-link": ExternalLink,
  "refresh-cw": RefreshCw,
  "undo-2": Undo2,
  archive: Archive,
  "trash-2": Trash2,
  ban: Ban,
  lock: Lock,
  unlock: LockOpen,
  check: Check,
  x: X,
  "user-plus": UserPlus,
  mail: Mail,
  receipt: Receipt,
  flag: Flag,
  star: Star,
};

/** 12px badge icon. `loader` spins (paused under reduced motion). */
export function BadgeIcon({ name }: { name: BadgeIconName }) {
  const Icon = BADGE[name];
  return (
    <Icon
      size={12}
      strokeWidth={2.25}
      aria-hidden="true"
      focusable="false"
      className="tk-icon tk-badge-icon"
      data-spin={name === "loader" ? "" : undefined}
    />
  );
}

export function ActionIcon({ name }: { name: ActionIconName }) {
  const Icon = ACTION[name];
  return (
    <Icon size={16} strokeWidth={1.75} aria-hidden="true" focusable="false" className="tk-icon" />
  );
}
