import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  id: string;
  eyebrow?: string;
  title: string | string[];
  body?: string;
  align?: "left" | "center";
  inverse?: boolean;
  className?: string;
}

/** Tiêu đề section chuẩn của landing: eyebrow nhỏ, h2 lớn, đoạn mô tả ngắn. `center` chỉ áp dụng từ tablet (mobile luôn căn trái). */
export function SectionHeading({ id, eyebrow, title, body, align = "left", inverse, className }: SectionHeadingProps) {
  const lines = Array.isArray(title) ? title : [title];
  return (
    <div className={cn("max-w-2xl min-w-0", align === "center" && "md:mx-auto md:text-center", className)}>
      {eyebrow && <p className={cn("text-sm font-medium", inverse ? "text-brand-bright" : "text-primary-ink")}>{eyebrow}</p>}
      <h2
        id={id}
        className={cn(
          "mt-3 text-[clamp(30px,8.5vw,36px)] leading-[1.08] font-[650] tracking-[-0.035em] text-balance sm:text-[44px] lg:text-[clamp(44px,3.2vw,52px)]",
          inverse ? "text-inverse-foreground" : "text-foreground"
        )}
      >
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h2>
      {body && <p className={cn("mt-4 text-[17px] leading-[1.65]", inverse ? "text-inverse-muted" : "text-muted")}>{body}</p>}
    </div>
  );
}
