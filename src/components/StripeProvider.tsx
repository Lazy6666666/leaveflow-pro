import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!stripePromise) {
        throw new Error("Missing VITE_STRIPE_PUBLISHABLE_KEY");
    }

    return (
        <Elements stripe={stripePromise}>
            {children}
        </Elements>
    );
};
