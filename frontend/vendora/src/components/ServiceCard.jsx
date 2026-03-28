import React from 'react';
import { FiStar, FiChevronRight } from 'react-icons/fi';
import '../styles/ServiceCard.css';

const ServiceCard = ({ image, title, rating, reviews, price, category }) => {
  return (
    <div className="service-card glass-morphism">
      <div className="card-image-wrapper">
        <img src={image} alt={title} className="card-image" />
        <span className="card-badge">{category}</span>
      </div>
      <div className="card-body">
        <div className="card-rating">
          <FiStar className="star-icon" />
          <span className="rating-value">{rating}</span>
          <span className="review-count">({reviews})</span>
        </div>
        <h3 className="card-title">{title}</h3>
        <div className="card-footer">
          <div className="card-price">
            <span className="currency">₹</span>
            <span className="amount">{price}</span>
          </div>
          <button className="card-action">
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
