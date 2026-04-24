import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import "../styles/ProviderDetail.css";
import { useNavigate } from "react-router-dom";
import BookingModal from "../components/BookingModal";
export default function ProviderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [bookingProvider, setBookingProvider] = useState(null);
  const handleChat = () => {
    navigate(`/chat/${provider.userId}`, {
      state: {
        userName:  provider.businessName,
        userImage: provider.profilePhotoUrl || null,
      },
    });
  };
  // Touch swipe support
  const touchStartX = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          axios.get(`/provider/${id}`),
          axios.get(`/review/provider/${id}`)
        ]);
        setProvider(pRes.data);
        setReviews(rRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  if (!provider) return <p className="pd-loading">Loading...</p>;

  // Fallback: if no portfolio images, use profile photo
  const images =
    provider.portfolioImages && provider.portfolioImages.length > 0
      ? provider.portfolioImages
      : [provider.profilePhotoUrl];

  const prev = () => setActiveImg((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveImg((i) => (i === images.length - 1 ? 0 : i + 1));

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };
  const handleBook = () => {
  setBookingProvider(provider);
};

  return (
    <>
      <Navbar />
      <div className="vd-page">
        {bookingProvider && (
  <BookingModal
    provider={bookingProvider}
    onClose={() => setBookingProvider(null)}
    onSuccess={(res) => console.log("Booked:", res)}
  />
)}

        {/* TOP SECTION */}
        <div className="vd-top">

          {/* LEFT - SWIPEABLE PORTFOLIO IMAGES */}
          <div className="vd-images" >
            {/* Thumbnail strip */}
            <div className="vd-thumbnail">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Portfolio ${i + 1}`}
                  className={`vd-thumb-item ${i === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>

            {/* Main image with swipe + arrows */}
            <div
              className="vd-main-img-wrap"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              
            >
              <img
                src={images[activeImg]}
                alt={`Portfolio ${activeImg + 1}`}
                className="vd-main-img"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            
        

              {/* Prev / Next arrows — only show if more than 1 image */}
              {images.length > 1 && (
                <>
                  <button className="vd-img-arrow prev" onClick={prev} aria-label="Previous image">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <button className="vd-img-arrow next" onClick={next} aria-label="Next image">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>

                  {/* Dot indicators */}
            
                  <div className="vd-img-dots">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className={`vd-img-dot ${i === activeImg ? "active" : ""}`}
                        onClick={() => setActiveImg(i)}
                      />
                    ))}
                  </div>
                 
                </>
              )}
            </div>
          </div>

          {/* CENTER - DETAILS */}
          <div>
            <div className="vd-details">
              <h1>{provider.businessName}</h1>

              <p className="vd-rating">
                ⭐ {provider.averageRating} ({provider.totalReviews} reviews)
              </p>

              <p className="vd-price">
                ₹ {provider.basePrice} / {provider.priceUnit}
              </p>

              <p className="vd-location">📍 {provider.district}</p>

              <p className="vd-description">{provider.description}</p>
            </div>

            {/* RIGHT - ACTION PANEL */}
            <div className="vd-action">
              <h2>₹ {provider.basePrice}</h2>
              <p>Available for booking</p>
              <button className="vd-btn-primary" onClick={handleBook}>Book Now</button>
              <button className="vd-btn-outline" onClick={handleChat}>Chat Provider</button>
            </div>
          </div >
        </div>
        

        {/* ABOUT VENDORA */}
        <div className="vd-about">
          <h2>Why choose Vendora?</h2>
          <p>
            Vendora connects you with trusted service professionals in your area.
            Every provider is verified, rated by real customers, and backed by
            secure booking and payment systems.
          </p>
        </div>

        {/* REVIEWS */}
        <div className="vd-reviews">
          <h2>Customer Reviews</h2>
          {reviews.length === 0 && <p>No reviews yet.</p>}
          {reviews.map((r, i) => (
            <div key={i} className="vd-review">
              <p>👤 {r.customerId}</p>
              <p>⭐ {r.rating}</p>
              <p>{r.comment}</p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}