import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ContainerSize = "page" | "text";

const SIZE_CLASS: Record<ContainerSize, string> = {
  page: "container-page",
  text: "container-text",
};

interface ContainerProps {
  /** page: khung chung 1480px (navbar, hero, section); text: khung 960px cho khối nhiều chữ. */
  size?: ContainerSize;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** Khung ngang duy nhất của landing – thay cho các `mx-auto max-w-7xl px-…` rải rác. */
export function Container({ size = "page", as: Tag = "div", className, children }: ContainerProps) {
  return <Tag className={cn(SIZE_CLASS[size], className)}>{children}</Tag>;
}

interface SectionProps {
  id?: string;
  labelledBy?: string;
  /** Lớp nền / màu của cả dải section (full-bleed). */
  className?: string;
  /** Lớp của khung nội dung bên trong. */
  containerClassName?: string;
  size?: ContainerSize;
  children: ReactNode;
}

/** Section landing: nền full-bleed + khoảng cách dọc chuẩn + khung nội dung chung. */
export function Section({ id, labelledBy, className, containerClassName, size, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-(--nav-height)", className)}>
      <Container size={size} className={cn("section-space", containerClassName)}>
        {children}
      </Container>
    </section>
  );
}
