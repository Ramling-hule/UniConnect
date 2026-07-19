"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '@/services/apiClient';
import useRazorpay from 'react-razorpay';
import { checkoutSchema, getZodError } from '@/utils/schemas';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/utils/errorHelper';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get('mentorId');
  const serviceId = searchParams.get('serviceId');
  const { user } = useSelector((state) => state.auth);
  const [Razorpay] = useRazorpay();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const { data: mentorData } = useQuery({
    queryKey: ['mentor', mentorId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/mentor/${mentorId}`);
      return data;
    },
    enabled: !!mentorId
  });

  const { data: servicesData } = useQuery({
    queryKey: ['mentorServices', mentorId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/mentor/${mentorId}/services`);
      return data;
    },
    enabled: !!mentorId
  });

  const service = servicesData?.services?.find(s => s._id === serviceId);
  const mentor = mentorData?.mentor;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // 1. Create Booking (which locks slot)
      const { data: bookingData } = await apiClient.post('/api/booking', {
        mentorId, serviceId, date, startTime: time, endTime: "TBD", notes
      });

      // 2. Create Razorpay Order
      const { data: orderData } = await apiClient.post('/api/payment/create-order', {
        bookingId: bookingData.booking._id
      });

      return { booking: bookingData.booking, orderData: orderData.order };
    },
    onSuccess: async ({ booking, orderData }) => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "dummy_key",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ProConnect",
        description: `Booking with ${mentor?.user?.name}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const { data: verifyData } = await apiClient.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            toast.success(`Payment successful!`);
            router.push('/dashboard');
          } catch (err) {
            const msg = extractErrorMessage(err, "Payment verification failed.");
            toast.error(msg);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#2563eb",
        },
      };

      const rzp1 = new Razorpay(options);
      rzp1.on('payment.failed', function (response){
        toast.error("Payment Failed: " + response.error.description);
      });
      rzp1.open();
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Checkout failed'));
    }
  });

  const handleCheckout = (e) => {
    e.preventDefault();
    try {
      checkoutSchema.parse({ date, time, notes });
    } catch (err) {
      toast.error(getZodError(err));
      return;
    }
    checkoutMutation.mutate();
  };

  if (!service || !mentor) return <div className="min-h-screen bg-slate-950 text-white flex justify-center pt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Complete Your Booking</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Session Details</h2>
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Select Date</label>
                    <input type="date" required value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Select Time</label>
                    <input type="time" required value={time} onChange={e=>setTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Notes for Mentor (Optional)</label>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What do you want to discuss?" rows="3" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="flex gap-4 items-center border-b border-slate-800 pb-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden">
                <img src={mentor.user?.profilePicture} alt="Mentor" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-white">{mentor.user?.name}</p>
                <p className="text-xs text-slate-400">{mentor.headline}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300 mb-6">
              <div className="flex justify-between">
                <span>Service</span>
                <span className="font-medium text-white">{service.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{service.duration} mins</span>
              </div>
              <div className="flex justify-between">
                <span>Session Fee</span>
                <span>₹{service.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee (10%)</span>
                <span>₹{Math.round(service.price * 0.1)}</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 mb-6 flex justify-between items-end">
              <span className="font-bold text-slate-400">Total</span>
              <span className="text-2xl font-black text-white">₹{service.price + Math.round(service.price * 0.1)}</span>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={checkoutMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {checkoutMutation.isPending ? 'Processing...' : 'Pay & Book Slot'}
            </button>
            <p className="text-xs text-center text-slate-500 mt-4">Secured by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
