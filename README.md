# Hospiswift app

Static files. Serve the folder over http(s) (for example `npx serve .`) and open `index.html`.
Video and voice calls need https (or localhost) for camera and microphone access.

Files: `index.html` (customer app and sign-in) · `partners.html` (pharmacy and hospital onboarding and dashboards, embedded by index.html) · `hs-core.js` (listings, partner-set fees, stock, orders, payment gateway) · `hs-room.js` (consultation room: video, voice, chat).

## Try it
Sign-in screen > "Try a demo account" > Customer, Pharmacy or Hospital. Open two tabs to see both sides at once (each tab keeps its own login): book or order as the customer, and watch the pharmacy or hospital dashboard receive it live. Test card: 4084 0840 8408 4081, any future date, CVV 408. Card ending 0002 is declined.

## What is real and what is demo
- Payment gateway: demo checkout (card, bank transfer, USSD). To go live set `HS.config.paystackKey` in `hs-core.js` and verify every transaction on your server before confirming an order or booking.
- Backend: `hs-core.js` keeps listings, fees, stock, orders and bookings in localStorage so the app and the dashboards talk to each other on one browser. Replace the "DATA LAYER" functions with API calls.
- Calls: WebRTC is real. Signalling uses BroadcastChannel, so two tabs of one browser connect. For calls across devices add a signalling server and a TURN server (or Agora, Twilio, Daily) in `hs-room.js`.
- Sign-in codes are shown on screen. Connect an SMS or email service. Partner approval is simulated.
- Set `DEMO_ACCOUNTS=false` in `index.html` to remove the demo buttons.
