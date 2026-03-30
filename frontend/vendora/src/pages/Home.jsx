import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustBanner from "../components/TrustBanner"

export default function Home() {
  return (
    <div className="home">
      <Navbar />
     <Hero/>
     <TrustBanner/>
    </div>
  );
}