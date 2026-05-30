interface HeroCardProps {
  title: string;
  subtitle: string;
  image: string;
  bgColor?: string;
  imageSize?: 'small' | 'normal' | 'large';
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  showActions?: boolean;
  onClick?: () => void;
}

export function HeroCard({
  title,
  subtitle,
  image,
  bgColor = 'bg-transparent',
  imageSize = 'normal',
  primaryActionLabel = 'Learn more',
  primaryActionHref = '#',
  secondaryActionLabel = 'Order now',
  secondaryActionHref = '#',
  showActions = true,
  onClick,
}: HeroCardProps) {
  const bgClass = `${bgColor || 'bg-transparent'} ${onClick ? 'cursor-pointer' : ''}`;
  const imageWrapperStyle =
    imageSize === 'small'
      ? { maxWidth: '320px' }
      : imageSize === 'large'
      ? { maxWidth: '520px' }
      : undefined;

  return (
    <section
      className={`${bgClass} pt-2 pb-0 pt-md-3 pb-md-0`}
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
      <div className="container-lg px-3 text-center">
        <h2 className="display-4 display-md-3 fw-bold mb-0">{title}</h2>
        <p className="fs-5 fs-md-4 mb-0 text-muted">{subtitle}</p>
        {showActions ? (
          <div className="d-flex gap-2 justify-content-center mb-1">
            <a href={primaryActionHref} className="btn btn-primary px-3">
              {primaryActionLabel}
            </a>
            <a href={secondaryActionHref} className="btn btn-outline-primary px-3">
              {secondaryActionLabel}
            </a>
          </div>
        ) : null}
        <div className="hero-card-image-wrapper" style={imageWrapperStyle}>
          <img src={image} alt={title} className="img-fluid hero-card-image" />
        </div>
      </div>
    </section>
  );
}
