import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, FileText, Search, BarChart, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const { user } = useAuth();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden py-24 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-mono-1000 mb-8 tracking-tight leading-none">
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-block"
              >
                Upload Once,
              </motion.span>
              <br />
              <motion.span
                className="font-medium inline-block"
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.6,
                  type: "spring",
                  stiffness: 100
                }}
              >
                Get Hired.
              </motion.span>
            </h1>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-mono-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Engineers: Upload your resume. Employers: Find the perfect match.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            variants={itemVariants}
          >
            {user ? (
              // Show dashboard buttons for logged-in users
              <>
                <Link to={user.userType === 'engineer' ? '/engineer/dashboard' : '/employer/dashboard'}>
                  <motion.button
                    className="btn-primary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                    initial={{ opacity: 0, y: 20, boxShadow: "0 0px 0px rgba(0, 0, 0, 0)" }}
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1, type: "spring", stiffness: 300 }}
                  >
                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      Go to Dashboard
                    </motion.span>
                    <motion.div
                      className="inline-block ml-2 h-5 w-5 relative z-10"
                      whileHover={{ x: 3, rotate: -15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BarChart className="h-5 w-5" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-mono-800 -z-0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
                {user.userType === 'engineer' && (
                  <Link to="/engineer/upload">
                    <motion.button
                      className="btn-secondary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                      whileHover={{
                        scale: 1.05,
                        y: -2,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.2, type: "spring", stiffness: 300 }}
                    >
                      <motion.span
                        className="relative z-10"
                        whileHover={{ x: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        Upload Resume
                      </motion.span>
                      <motion.div
                        className="inline-block ml-2 h-5 w-5 relative z-10"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Upload className="h-5 w-5" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 bg-mono-100 -z-0"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </Link>
                )}
              </>
            ) : (
              // Show auth buttons for non-logged-in users
              <>
                <Link to="/engineer/auth">
                  <motion.button
                    className="btn-primary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1, type: "spring", stiffness: 300 }}
                  >
                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      Join as Engineer
                    </motion.span>
                    <motion.div
                      className="inline-block ml-2 h-5 w-5 relative z-10"
                      whileHover={{ x: 3, rotate: -15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-mono-800 -z-0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
                <Link to="/employer/auth">
                  <motion.button
                    className="btn-secondary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2, type: "spring", stiffness: 300 }}
                  >
                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      Find Talent
                    </motion.span>
                    <motion.div
                      className="inline-block ml-2 h-5 w-5 relative z-10"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Search className="h-5 w-5" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-mono-100 -z-0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Enhanced animated geometric elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Floating squares */}
          <motion.div
            className="absolute top-20 left-1/4 w-4 h-4 bg-mono-300 rounded-sm"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-40 right-1/4 w-3 h-3 bg-mono-400 rounded-sm"
            animate={{
              y: [0, 15, 0],
              rotate: [0, -180, -360]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div
            className="absolute bottom-40 left-1/3 w-2 h-2 bg-mono-500 rounded-full"
            animate={{
              x: [0, 30, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />

          {/* Animated lines */}
          <motion.div
            className="absolute top-32 left-1/4 w-1 h-32 bg-mono-300 origin-top"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
          <motion.div
            className="absolute top-48 right-1/3 w-32 h-1 bg-mono-300 origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
          />

          {/* Pulsing dots */}
          <motion.div
            className="absolute top-60 right-1/2 w-1 h-1 bg-mono-600 rounded-full"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-60 left-1/2 w-1 h-1 bg-mono-600 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          />
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 px-4 bg-mono-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-light text-mono-1000 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              How It Works
            </motion.h2>
            <motion.p
              className="text-lg text-mono-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Three simple steps to connect with your next opportunity.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <FileText className="h-6 w-6" />,
                title: "Upload Resume",
                description: "Upload your resume in seconds. PDF or Word format supported."
              },
              {
                icon: <Search className="h-6 w-6" />,
                title: "Get Discovered",
                description: "Top employers browse and discover your profile automatically."
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Land Opportunities",
                description: "Receive direct messages from hiring managers and recruiters."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center group cursor-pointer"
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div
                  className="w-12 h-12 bg-mono-1000 rounded-sm flex items-center justify-center text-mono-0 mb-6 mx-auto relative overflow-hidden"
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -10, 10, 0],
                    backgroundColor: "#333"
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.2 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-mono-800"
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
                <motion.h3
                  className="text-xl font-medium text-mono-1000 mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {feature.title}
                </motion.h3>
                <motion.p
                  className="text-mono-600 leading-relaxed"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {feature.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-20 px-4 bg-mono-1000"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-mono-0">
            {[
              { number: "10K+", label: "Engineers" },
              { number: "500+", label: "Companies" },
              { number: "95%", label: "Success Rate" },
              { number: "2M+", label: "Connections" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.5 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.1,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                className="cursor-pointer"
              >
                <motion.div
                  className="text-3xl md:text-4xl font-light mb-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                  viewport={{ once: true }}
                >
                  {stat.number}
                </motion.div>
                <motion.div
                  className="text-mono-400 text-sm uppercase tracking-wider"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.7 }}
                  viewport={{ once: true }}
                >
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us Section */}
      <motion.section
        className="py-20 px-4 bg-mono-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-mono-1000 mb-6">
              Why Engineers Choose Us
            </h2>
            <p className="text-lg text-mono-600 max-w-2xl mx-auto">
              The simplest way to get discovered by top employers and land your next role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="space-y-8">
                {[
                  {
                    title: "Instant Visibility",
                    description: "Your resume goes live immediately. Top employers start discovering your profile within minutes."
                  },
                  {
                    title: "Direct Contact",
                    description: "Skip recruiters and job boards. Hiring managers and CTOs reach out to you directly."
                  },
                  {
                    title: "Quality Opportunities",
                    description: "Only verified companies with real engineering roles. No spam, no fake listings."
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-2 h-2 bg-mono-1000 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="text-lg font-medium text-mono-1000 mb-2">{benefit.title}</h3>
                      <p className="text-mono-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-mono-100 rounded-md p-8 relative">
                <div className="space-y-4">
                  <div className="h-4 bg-mono-300 rounded w-3/4"></div>
                  <div className="h-4 bg-mono-300 rounded w-1/2"></div>
                  <div className="h-4 bg-mono-300 rounded w-5/6"></div>
                  <div className="mt-6 space-y-2">
                    <div className="h-3 bg-mono-400 rounded w-1/3"></div>
                    <div className="h-3 bg-mono-400 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-mono-1000 rounded-sm"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="py-20 px-4 bg-mono-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-mono-1000 mb-6">
              Success Stories
            </h2>
            <p className="text-lg text-mono-600">
              Engineers who uploaded and got discovered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Uploaded my resume on Monday, got 3 interview requests by Friday. Game changer.",
                author: "Abhishek Sinha",
                role: "Senior Frontend Engineer"
              },
              {
                quote: "No more applying to hundreds of jobs. I got 5 interviews scheduled in just 1 week without apply to any company",
                author: "Neha Tiwari",
                role: "DevOps Engineer"
              },
              {
                quote: "Simple upload, instant visibility. Got hired by my dream startup in 2 weeks.",
                author: "Aisha Patel",
                role: "Full Stack Developer"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="card-minimal p-6 text-center relative overflow-hidden group cursor-pointer"
                initial={{ opacity: 0, y: 30, rotateY: -15, boxShadow: "0 0px 0px rgba(0, 0, 0, 0)" }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-mono-1000"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
                  viewport={{ once: true }}
                />
                <motion.p
                  className="text-mono-700 mb-6 italic leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                  viewport={{ once: true }}
                >
                  "{testimonial.quote}"
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.6 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    className="font-medium text-mono-1000"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {testimonial.author}
                  </motion.div>
                  <div className="text-sm text-mono-600">{testimonial.role}</div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-mono-50 to-mono-100 opacity-0 group-hover:opacity-100 -z-10"
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-24 px-4 bg-mono-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-light text-mono-1000 mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Ready to Get Discovered?
          </motion.h2>
          <motion.p
            className="text-lg text-mono-600 mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Upload your resume today and let top employers find you.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {user ? (
              // Show dashboard buttons for logged-in users
              <>
                <Link to={user.userType === 'engineer' ? '/engineer/dashboard' : '/employer/dashboard'}>
                  <motion.button
                    className="btn-primary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                    initial={{ boxShadow: "0 0px 0px rgba(0, 0, 0, 0)", opacity: 0, y: 20 }}
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1, type: "spring", stiffness: 300 }}
                  >
                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      Go to Dashboard
                    </motion.span>
                    <motion.div
                      className="inline-block ml-2 h-5 w-5 relative z-10"
                      whileHover={{ x: 3, rotate: -15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BarChart className="h-5 w-5" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-mono-800 -z-0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
                {user.userType === 'engineer' && (
                  <Link to="/engineer/upload">
                    <motion.button
                      className="btn-secondary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                      whileHover={{
                        scale: 1.05,
                        y: -2,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.2, type: "spring", stiffness: 300 }}
                    >
                      <motion.span
                        className="relative z-10"
                        whileHover={{ x: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        Upload Resume
                      </motion.span>
                      <motion.div
                        className="inline-block ml-2 h-5 w-5 relative z-10"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Upload className="h-5 w-5" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 bg-mono-100 -z-0"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </Link>
                )}
              </>
            ) : (
              // Show auth buttons for non-logged-in users
              <>
                <Link to="/engineer/auth">
                  <motion.button
                    className="btn-primary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                    initial={{ boxShadow: "0 0px 0px rgba(0, 0, 0, 0)", opacity: 0, y: 20 }}
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1, type: "spring", stiffness: 300 }}
                  >
                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      Join as Engineer
                    </motion.span>
                    <motion.div
                      className="inline-block ml-2 h-5 w-5 relative z-10"
                      whileHover={{ x: 3, rotate: -15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-mono-800 -z-0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
                <Link to="/employer/auth">
                  <motion.button
                    className="btn-secondary px-8 py-4 rounded-md font-medium text-lg relative overflow-hidden group"
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2, type: "spring", stiffness: 300 }}
                  >
                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      Find Talent
                    </motion.span>
                    <motion.div
                      className="inline-block ml-2 h-5 w-5 relative z-10"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Search className="h-5 w-5" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-mono-100 -z-0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}