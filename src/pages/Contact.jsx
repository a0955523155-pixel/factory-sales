import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';

const Contact = () => {
  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Navbar />
      <div className="pt-20">
        <ContactSection title="聯絡我們" dark={true} />
      </div>
      <Footer />
    </div>
  );
};

export default Contact;