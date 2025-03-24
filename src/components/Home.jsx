import React, { useEffect } from 'react';
import './Home.css';
import { useNavigation } from '../contexts/NavigationContext';
import { FiVideo, FiMic, FiUser, FiCpu, FiGlobe, FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';


const Home = () => {
  const { navigateToTab } = useNavigation();

  useEffect(() => {
    console.log('Home component loaded');

  }, []);

  const features = [
    {
      icon: <FiMic />,
      title: "AI-Powered Voices",
      description: "Choose from a diverse library of natural-sounding voices in multiple languages and accents."
    },
    {
      icon: <FiUser />,
      title: "Realistic Avatars",
      description: "Select from our collection of lifelike digital avatars with natural expressions and movements."
    },
    {
      icon: <FiCpu />,
      title: "Smart Generation",
      description: "Advanced AI technology creates high-quality videos in minutes, not hours."
    },
    {
      icon: <FiVideo />,
      title: "Professional Quality",
      description: "Generate studio-quality videos perfect for marketing, training, and education."
    },
    {
      icon: <FiGlobe />,
      title: "Multiple Languages",
      description: "Create content in various languages to reach a global audience."
    },
    {
      icon: <FiDownload />,
      title: "Easy Export",
      description: "Download your videos in standard formats or share directly to platforms."
    }
  ];

  const workflowSteps = [
    {
      number: "1",
      title: "Select Your Voice",
      description: "Choose from our library of natural-sounding AI voices in multiple languages."
    },
    {
      number: "2",
      title: "Pick an Avatar",
      description: "Select a realistic digital avatar that matches your brand and message."
    },
    {
      number: "3",
      title: "Write Your Script",
      description: "Enter your text or use our templates to create engaging content."
    },
    {
      number: "4",
      title: "Generate Video",
      description: "Let our AI create a professional video in minutes."
    }
  ];

  return (
    <div className="home">
      <section className="hero-section">
        <div className="video-background">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="background-video"
          >
            <source 
              src="https://files2.heygen.ai/aws_pacific/avatar_tmp/2a0e99c212a24819ad67a766bfe4e0da/45f52e34351f4d25968138e83837b0b1.mp4?Expires=1742905394&Signature=iWIL0MvOTQlSJ1iPVygxQDY58wsChxqSJKsDREStZmtd61JBnfnTFG5kJff5~F2ftZXS9rhhXwhUug-YS27NQGibVyAwd7777QFFhvxAdAsDtUMhqffsOCWjmlEA3vQxJyr~wkWpNbiVLmoDe6MMZ7ta8chgRNZpNVnrWODS9oEW2FAIsldDrjcmHb6U9xabV29CdmPqAH5pd5zOv3BvOg3xEN9curExxXY0an4GJ-EFu0PCkDvdX3k5pkhBwfETHeVHq0bw-kmmgTVUpFv6s7~gKjEPuqhq~NoJUHM~cBKUQxV3LBVe7TIm~vRT2tnnDbfzaxm52DAQr-VsbmEn0g__&Key-Pair-Id=K38HBHX5LX3X2H"
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="video-gradient-overlay"></div>
        <div className="hero-content">
        <h1 className="hero-title">
          Create Professional Videos with AI
        </h1>
        <p className="hero-subtitle">
          Transform your content into engaging videos using AI-powered voices and realistic avatars. Perfect for marketing, training, education, and more.
        </p>
        <button 
          className="cta-button"
          onClick={() => navigateToTab('voices')}
        >
          Get Started
          <span>→</span>
        </button>
        </div>
       
      </section>
    
      <section className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <h2 className="section-title">How It Works</h2>
        <div className="workflow-steps">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              className="workflow-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;