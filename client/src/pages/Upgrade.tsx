import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Upgrade: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');
  const [queuedPlanId, setQueuedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/dashboard');
        if (data.user) {
          setCurrentPlan(data.user.plan || 'free');
          setCurrentPlanId(data.user.planId || 'free');
          setQueuedPlanId(data.user.queuedPlanId || null);
        }
      } catch (error) {
        console.error("Failed to fetch user plan", error);
      }
    };
    fetchUserPlan();
  }, []);

  const isFullySubscribed = queuedPlanId !== null;

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
      buttonText: currentPlan === 'pro' ? 'Switch to Free' : 'Current Plan',
      // If user is pro, Free is disabled. If they have a queued plan, everything is disabled.
      isDisabled: currentPlan === 'pro' || isFullySubscribed,
      isCurrent: currentPlanId === 'free',
      isQueued: false,
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
      buttonText: currentPlanId === 'pro_monthly' ? 'Active Plan' : (queuedPlanId === 'pro_monthly' ? 'Queued Plan' : 'Get Monthly'),
      isDisabled: currentPlanId === 'pro_monthly' || queuedPlanId === 'pro_monthly' || isFullySubscribed,
      isCurrent: currentPlanId === 'pro_monthly',
      isQueued: queuedPlanId === 'pro_monthly',
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
      buttonText: currentPlanId === 'pro_6month' ? 'Active Plan' : (queuedPlanId === 'pro_6month' ? 'Queued Plan' : 'Get 6 Months'),
      isDisabled: currentPlanId === 'pro_6month' || queuedPlanId === 'pro_6month' || isFullySubscribed,
      isCurrent: currentPlanId === 'pro_6month',
      isQueued: queuedPlanId === 'pro_6month',
      highlight: true
    }
  ];

  const handlePayment = async (planId: string, planName: string) => {
    if (isFullySubscribed) return;
    
    const toastId = toast.loading(`Initializing secure payment for ${planName}...`);
    
    try {
      const { data: order } = await axiosInstance.post('/payments/create-order', {
        planId
      });

      const token = localStorage.getItem('token');
      let userData: any = {};
      if (token) {
        try {
          userData = jwtDecode(token);
        } catch (e) {
          console.error("Error decoding token", e);
        }
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "DataPilotAI",
        description: `Upgrade to ${planName}`,
        order_id: order.id,
        handler: async (response: any) => {
          const verifyToastId = toast.loading("Verifying payment...");
          try {
            const { data } = await axiosInstance.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId
            });
            
            toast.success("Success! Your plan will be extended.", { id: verifyToastId });
            setQueuedPlanId(data.queuedPlanId);
            setTimeout(() => window.location.href = '/dashboard', 2000);
          } catch (error: any) {
            toast.error(error.message || "Payment verification failed", { id: verifyToastId });
          }
        },
        prefill: {
          name: userData.name || "",
          email: userData.email || "",
        },
        theme: {
          color: "#9B6FCC",
        },
      };

      if (!window.Razorpay) {
        toast.error("Razorpay SDK not loaded", { id: toastId });
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      
      rzp.open();
      toast.dismiss(toastId);
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize payment", { id: toastId });
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-transparent py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Scale your knowledge with <span className="text-brand">Premium</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Manage your subscriptions and unlock advanced AI features.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative group rounded-3xl p-8 transition-all duration-300 border flex flex-col ${
                  plan.highlight 
                    ? 'bg-white/5 border-brand/50 shadow-[0_0_40px_-15px_rgba(var(--brand-rgb),0.3)] scale-105 z-10' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                } ${plan.isQueued ? 'opacity-90' : ''}`}
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

                <div className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-brand/20 text-brand' : 'bg-white/5 text-white/40'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => handlePayment(plan.id, plan.name)}
                    disabled={plan.isDisabled}
                    className={`w-full py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      plan.isDisabled 
                        ? 'bg-white/5 text-white/20 cursor-default border border-white/5' 
                        : plan.highlight
                          ? 'bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20 hover:scale-[1.02]'
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                  
                  {plan.isQueued && (
                    <p className="text-[10px] text-brand/80 text-center mt-3 animate-pulse">
                      Note: This plan will activate automatically after your current plan expires.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Fully Subscribed Notice */}
          {isFullySubscribed && (
            <div className="mt-12 p-6 rounded-2xl bg-brand/5 border border-brand/20 text-center max-w-2xl mx-auto">
              <p className="text-brand text-sm font-medium">
                You have an active plan and an upcoming queued plan. Purchase buttons are temporarily disabled to prevent accidental over-billing.
              </p>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-20 text-center">
            <p className="text-white/30 text-sm mb-6">Secure payments powered by Razorpay. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Upgrade;
