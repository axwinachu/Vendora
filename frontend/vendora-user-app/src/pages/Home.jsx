import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustBanner from "../components/TrustBanner"
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="home">
     <Navbar />
     <Hero/>
     <TrustBanner/>
     <Footer/>
    </div>
  );
}