import {
  BookOpen,
  CalendarDays,
  Camera,
  Church,
  Flag,
  Gift,
  HandHeart,
  Heart,
  MapPin,
  Megaphone,
  Mic,
  Music,
  Plane,
  Radio,
  Sparkles,
  Star,
  Store,
  Tent,
  Users,
  Video,
  type LucideProps,
} from "lucide-react";
import type { IconeFrente as NomeIcone } from "@/lib/frentes";

const MAPA: Record<NomeIcone, React.ComponentType<LucideProps>> = {
  "calendar-days": CalendarDays,
  "hand-heart": HandHeart,
  radio: Radio,
  store: Store,
  megaphone: Megaphone,
  music: Music,
  "book-open": BookOpen,
  users: Users,
  heart: Heart,
  star: Star,
  flag: Flag,
  "map-pin": MapPin,
  plane: Plane,
  tent: Tent,
  mic: Mic,
  video: Video,
  camera: Camera,
  gift: Gift,
  church: Church,
  sparkles: Sparkles,
};

export function IconeFrente({ nome, ...props }: { nome: string } & LucideProps) {
  const Icone = MAPA[nome as NomeIcone] ?? Sparkles;
  return <Icone aria-hidden {...props} />;
}
