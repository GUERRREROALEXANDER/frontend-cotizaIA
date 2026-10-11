// Animated text link, adapted from skiper-ui "skiper40" (itself inspired by
// cursor.com): the underline draws in from the left on hover and leaves to
// the right, and a small arrow rises into place. Renders an <a> when given
// href, otherwise a <button>, so it works for navigation and in-app actions.
const ARROW_PATH = "M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004";

export default function AnimatedLink({ href, onClick, children, arrow = true, className = "", ...props }) {
  const Component = href ? "a" : "button";
  return (
    <Component
      href={href}
      onClick={onClick}
      type={href ? undefined : "button"}
      className={`group relative inline-flex items-center font-medium text-brand before:pointer-events-none before:absolute before:left-0 before:top-[1.35em] before:h-[0.08em] before:w-full before:origin-right before:scale-x-0 before:bg-current before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] before:content-[''] hover:before:origin-left hover:before:scale-x-100 focus-visible:before:origin-left focus-visible:before:scale-x-100 ${className}`}
      {...props}
    >
      {children}
      {arrow && (
        <svg
          aria-hidden="true"
          viewBox="0 0 10 10"
          fill="none"
          className="ml-[0.35em] size-[0.6em] translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          <path d={ARROW_PATH} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Component>
  );
}
