import "../styles/category.css";

const categories = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Cleaning",
];

export default function CategoryGrid() {
  return (
    <div>
      <h3>Categories</h3>

      <div className="category-grid">
        {categories.map((cat) => (
          <div key={cat} className="category-card">
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}