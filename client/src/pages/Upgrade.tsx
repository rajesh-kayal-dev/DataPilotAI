import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { toast } from 'react-hot-toast';

const Upgrade: React.FC = () => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: [
        '2 Workspaces',
        '5 PDF uploads',
        'Basic AI Models',
        'Standard Support',
        '100 messages/month'
      ],
      buttonText: 'Current Plan',
      isCurrent: true,
      highlight: false
    },
    {
      id: 'pro_monthly',
      name: 'Monthly Pro',
      price: '₹149',
      period: 'per month',
      features: [
        'Unlimited Workspaces',
        '50 PDF uploads',
        'Premium Models (GPT-4o, Claude 3.5)',
        'Advanced RAG Intelligence',
        'Unlimited messages',
        'Priority Processing'
      ],
      buttonText: 'Upgrade Monthly',
      isCurrent: false,
      highlight: false
    },
    {
      id: 'pro_6month',
      name: '6-Month Saver',
      price: '₹499',
      period: 'for 6 months',
      features: [
        'Everything in Monthly Pro',
        'Save over 40% annually',
        'Extended Support',
        'Early access to new features',
        'Exclusive Beta features',
        'Locked-in pricing'
      ],
      buttonText: 'Get 6 Months',
      isCurrent: false,
      highlight: true
    }
  ];

  const handlePayment = (planId: string, planName: string) => {
    if (planId === 'free') return;
    
    const toastId = toast.loading(`Connecting to Razorpay Secure Gateway...`);
    
    // Simulate payment initialization
    setTimeout(() => {
      toast.error(
        `Razorpay integration for "${planName}" is currently being configured. Please contact support for early access!`, 
        { id: toastId, duration: 5000 }
      );
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-[#08060E] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Scale your knowledge with <span className="text-brand">Premium</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your workflow. Unlock advanced models and unlimited document processing.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative group rounded-3xl p-8 transition-all duration-300 border ${
                  plan.highlight 
                    ? 'bg-white/5 border-brand/50 shadow-[0_0_40px_-15px_rgba(var(--brand-rgb),0.3)] scale-105 z-10' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Best Value
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/40 text-sm">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-brand/20 text-brand' : 'bg-white/5 text-white/40'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handlePayment(plan.id, plan.name)}
                  disabled={plan.isCurrent}
                  className={`w-full py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                    plan.isCurrent 
                      ? 'bg-white/5 text-white/20 cursor-default border border-white/5' 
                      : plan.highlight
                        ? 'bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20 hover:scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-20 text-center">
            <p className="text-white/30 text-sm mb-6">Secure payments powered by Razorpay. Cancel anytime.</p>
            <div className="flex justify-center items-center gap-8 opacity-40 grayscale invert">
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Upgrade;
