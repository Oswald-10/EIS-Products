interface GridCardProps {
  title: string;
  subtitle?: string;
  image: string;
  bgColor?: string;
  variant?: 'normal' | 'short' | 'center';
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  showActions?: boolean;
  onClick?: () => void;
}

export function GridCard({
  title,
  subtitle,
  image,
  bgColor = 'bg-light',
  variant = 'normal',
  primaryActionLabel = 'Learn more',
  primaryActionHref = '#',
  secondaryActionLabel = 'Order now',
  secondaryActionHref = '#',
  showActions = true,
  onClick,
}: GridCardProps) {
  const cardClass = `grid-card ${variant === 'short' ? 'grid-card-short' : ''} ${variant === 'center' ? 'grid-card-center' : ''} ${onClick ? 'cursor-pointer' : ''}`;

  return (
    <div
      className={cardClass}
      style={variant !== 'center' ? { backgroundImage: `url(${image})` } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          onClick();
        }
      }}
    >
      {variant === 'center' ? (
        <>
          <div className="grid-card-center-image-wrapper">
            <img src={image} alt={title} className="grid-card-center-image" />
          </div>
          <div>
            <h2 className="display-4 display-md-3 fw-bold mb-2">{title}</h2>
            {subtitle && <p className="fs-5 fs-md-4 mb-2 text-white">{subtitle}</p>}
            {showActions ? (
            <div className="d-flex gap-2 justify-content-center mb-2">
              <a href={primaryActionHref} className="btn btn-primary px-3">
                {primaryActionLabel}
              </a>
              <a href={secondaryActionHref} className="btn btn-outline-primary px-3">
                {secondaryActionLabel}
              </a>
            </div>
          ) : null}
          </div>
        </>
      ) : (
        <div>
          <h2 className="display-4 display-md-3 fw-bold mb-2">{title}</h2>
          {subtitle && <p className="fs-5 fs-md-4 mb-2 text-white">{subtitle}</p>}
          {showActions ? (
            <div className="d-flex gap-2 justify-content-center mb-2">
              <a href={primaryActionHref} className="btn btn-primary px-3">
                {primaryActionLabel}
              </a>
              <a href={secondaryActionHref} className="btn btn-outline-primary px-3">
                {secondaryActionLabel}
              </a>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
