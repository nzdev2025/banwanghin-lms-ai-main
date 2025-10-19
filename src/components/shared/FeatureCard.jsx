import React from 'react';

const FeatureCard = ({ icon, title, description, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative p-6 rounded-2xl bg-gray-800/60 backdrop-blur-sm border border-white/10 cursor-pointer overflow-hidden transition-all duration-300 ease-in-out group hover:border-teal-400/30 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-teal-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
