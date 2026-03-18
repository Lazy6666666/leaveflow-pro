import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, ShieldCheck, Zap } from 'lucide-react';

const PaymentCard = () => {
    const stripe = useStripe();
    const elements = useElements();
    const prefersReducedMotion = useReducedMotion();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [succeeded, setSucceeded] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) {
            setProcessing(false);
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError("Payment form is not ready.");
            setProcessing(false);
            return;
        }

        setError("Stripe Elements is mounted, but no payment intent backend is wired for this form yet.");
        setSucceeded(false);
        setProcessing(false);
    };

    return (
        <motion.div
            initial={{ rotateY: 0 }}
            whileHover={prefersReducedMotion ? undefined : { rotateY: 15, rotateX: -5 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-full max-w-md p-8 rounded-2xl border bg-card text-card-foreground shadow-2xl backdrop-blur-xl bg-opacity-80"
            style={{ transformStyle: 'preserve-3d' }}
        >
            <div className="absolute top-4 right-4 text-muted-foreground/20">
                <Zap className="w-12 h-12 fill-current" />
            </div>

            <div className="flex items-center gap-2 mb-8">
                <CreditCard className="w-6 h-6" />
                <span className="font-semibold tracking-tight uppercase text-xs">Premium Plan</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#000',
                                    '::placeholder': { color: '#aab7c4' },
                                },
                                invalid: { color: '#9e2146' },
                            },
                        }}
                    />
                </div>

                {error && <div className="text-destructive text-sm font-medium">{error}</div>}

                <button
                    disabled={!stripe || processing || succeeded}
                    className="w-full py-3 px-6 rounded-xl bg-foreground text-background font-bold hover:opacity-90 transition-opacity disabled:opacity-50 relative overflow-hidden group"
                >
                    <span className="z-10 relative">
                        {processing ? "Processing..." : succeeded ? "Succeeded!" : "Subscribe Now"}
                    </span>
                    {succeeded && (
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={prefersReducedMotion ? undefined : { x: '100%' }}
                            transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, repeat: Infinity }}
                            className="absolute inset-0 bg-white/20"
                        />
                    )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" />
                    Secure checkout powered by Stripe
                </div>
            </form>
        </motion.div>
    );
};

export default PaymentCard;
