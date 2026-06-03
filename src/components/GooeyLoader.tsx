import * as React from "react";

export interface GooeyLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The primary color for the goo effect. */
  primaryColor?: string;
  /** The secondary color for the goo effect. */
  secondaryColor?: string;
  /** The color for the bottom border. */
  borderColor?: string;
}

const GooeyLoader = React.forwardRef<HTMLDivElement, GooeyLoaderProps>(
  ({ className, primaryColor, secondaryColor, borderColor, ...props }, ref) => {
    // Usamos los colores violetas principales del tema de INNOVACV
    const style = {
      "--gooey-primary-color": primaryColor || "#6147FF", 
      "--gooey-secondary-color": secondaryColor || "#8A70FF", 
      "--gooey-border-color": borderColor || "rgba(226, 232, 240, 0.4)", 
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={`relative flex items-center justify-center text-sm ${className || ""}`}
        style={style}
        role="status"
        aria-label="Loading"
        {...props}
      >
        {/* SVG filter for the gooey effect */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="gooey-loader-filter">
              <feGaussianBlur in="SourceGraphic" stdDeviation={12} result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 48 -7"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        <style>
          {`
            .gooey-loader {
              width: 12em;
              height: 3em;
              position: relative;
              overflow: hidden;
              border-bottom: 8px solid var(--gooey-border-color);
              filter: url(#gooey-loader-filter);
            }

            .gooey-loader::before,
            .gooey-loader::after {
              content: '';
              position: absolute;
              border-radius: 50%;
            }

            .gooey-loader::before {
              width: 22em;
              height: 18em;
              background-color: var(--gooey-primary-color);
              left: -2em;
              bottom: -18em;
              animation: gooey-loader-wee1 2s linear infinite;
            }

            .gooey-loader::after {
              width: 16em;
              height: 12em;
              background-color: var(--gooey-secondary-color);
              left: -4em;
              bottom: -12em;
              animation: gooey-loader-wee2 2s linear infinite 0.75s;
            }

            @keyframes gooey-loader-wee1 {
              0% {
                transform: translateX(-10em) rotate(0deg);
              }
              100% {
                transform: translateX(7em) rotate(180deg);
              }
            }

            @keyframes gooey-loader-wee2 {
              0% {
                transform: translateX(-8em) rotate(0deg);
              }
              100% {
                transform: translateX(8em) rotate(180deg);
              }
            }
          `}
        </style>

        {/* The loader element that the styles target */}
        <div className="gooey-loader" />
      </div>
    );
  }
);
GooeyLoader.displayName = "GooeyLoader";

export { GooeyLoader };
