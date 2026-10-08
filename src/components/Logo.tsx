import logo from "/src/assets/logo.png";

type Props = {
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  className?: string;
};

const sizes = {
  sm: { icon: "h-6 w-6", name: "text-xl", slogan: "text-[10px]" },
  md: { icon: "h-8 w-8", name: "text-2xl", slogan: "text-xs" },
  lg: { icon: "h-12 w-12 md:h-14 md:w-14", name: "text-4xl md:text-5xl", slogan: "text-sm md:text-base" },
};

export function Logo({ size = "md", showSlogan = false, className = "" }: Props) {
  const s = sizes[size];
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img src={logo} alt="" className={`${s.icon} shrink-0`} />
      <div className="leading-tight">
        <span className={`block font-bold tracking-tight ${s.name}`}>
          <span className="text-text">Nutri</span>
          <span className="text-primary">Pro</span>
        </span>
        {showSlogan && <span className={`block text-text ${s.slogan}`}>Tu evolución, nuestro compromiso</span>}
      </div>
    </div>
  );
}