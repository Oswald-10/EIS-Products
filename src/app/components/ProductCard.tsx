interface ProductCardProps {
  title: string;
  subtitle: string;
  price: string;
  image: string;
}

export function ProductCard({ title, subtitle, price, image }: ProductCardProps) {
  return (
    <div className="product-card">
      <img src={image} alt={title} />
      <div className="product-card-body">
        <h5 className="product-card-title">{title}</h5>
        <p className="text-muted">{subtitle}</p>
        <div className="product-card-price">${price}</div>
        <div className="d-flex gap-2">
          <a href="#" className="link-primary text-decoration-none">Learn more</a>
          <a href="#" className="link-primary text-decoration-none">Buy</a>
        </div>
      </div>
    </div>
  );
}
