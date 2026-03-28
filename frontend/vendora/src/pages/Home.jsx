import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ServiceCard from '../components/ServiceCard';
import Footer from '../components/Footer';
import '../styles/Home.css';

const services = {
  featured: [
    {
      id: 1,
      title: 'AC Repair & Service',
      category: 'Appliances',
      rating: 4.8,
      reviews: '792K',
      price: '299',
      image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Deep House Cleaning',
      category: 'Cleaning',
      rating: 4.9,
      reviews: '1.2M',
      price: '1499',
      image: 'https://images.unsplash.com/photo-1550963295-019d8a8a61c5?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Switch/Socket Replacement',
      category: 'Electrical',
      rating: 4.84,
      reviews: '74K',
      price: '49',
      image: 'https://images.unsplash.com/photo-1558227691-41ea78d1f631?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Full Home Painting',
      category: 'Painting',
      rating: 4.7,
      reviews: '250K',
      price: '4999',
      image: 'https://images.unsplash.com/photo-1627038161720-749e75143a41?q=80&w=2000&auto=format&fit=crop'
    }
  ],
  handyman: [
    {
      id: 5,
      title: 'Fan Repair (Ceiling/Exhaust)',
      category: 'Electrical',
      rating: 4.8,
      reviews: '89K',
      price: '109',
      image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 6,
      title: 'Drill & Hang (Wall Decor)',
      category: 'Handyman',
      rating: 4.84,
      reviews: '97K',
      price: '49',
      image: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 7,
      title: 'Plumbing Check-up',
      category: 'Plumbing',
      rating: 4.75,
      reviews: '120K',
      price: '99',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2000&auto=format&fit=crop'
    }
  ]
};

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      
      <main className="home-main container">
        <section className="service-section">
          <div className="section-header">
            <h2 className="section-title">Most Booked Services</h2>
            <button className="view-all">See all</button>
          </div>
          <div className="service-grid">
            {services.featured.map(service => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </section>

        <section className="service-section">
          <div className="section-header">
            <h2 className="section-title">Handyman & Repairs</h2>
            <p className="section-subtitle">Expert help for small fixes</p>
          </div>
          <div className="service-grid">
            {services.handyman.map(service => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </section>

        <section className="cta-banner glass-morphism">
          <div className="cta-content">
            <h3>Ready to partner with us?</h3>
            <p>Join 100,000+ professionals and grow your business with Vendora.</p>
            <button className="btn-primary">Become a Partner</button>
          </div>
          <div className="cta-image">
            <div className="cta-glow"></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;